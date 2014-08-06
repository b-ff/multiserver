function ListController(container, server) {

	this.container = (container instanceof jQuery) ? container : jQuery(container); // jQuery-объект контейнера списка (в конкретном случае <table>)

	if (!this.container.size()) {
		this.error('ListController > init : container is not found');
		return false; 
	}

	if (typeof server == "undefined") { 
		this.error('ListController > init : server API object is not found');
		return false; 
	}

	this.server = server;

	this.load();

	this.renderList();

	this.attachHandlers();
}

ListController.prototype = new BaseController();

// Буфер
ListController.prototype.buffer = {};

// Списки задач для отправки на сервер
ListController.prototype.createQueue = 	[]; // добавление
ListController.prototype.updateQueue = 	[];	// обновление
ListController.prototype.deleteQueue = 	[];	// удаление

// Метод-обёртка для setTimeout, при повторном вызове сбрасывающий предыдущий таймаут
ListController.prototype.timeout = function(func, delay) {
	if (typeof this.timeout.timeoutID != "undefined") {
		clearTimeout(this.timeout.timeoutID);
	}

	this.timeout.timeoutID = setTimeout(jQuery.proxy(function() {
		func();
		delete this.timeout.timeoutID;
	}, this), delay);
}

// Получает с сервера весь список и помещает его в буфер
ListController.prototype.load = function() {
	this.buffer = this.server.getList();
};

// Рендерит свойство элемента списка
ListController.prototype.renderItemProperty = function(name, value) {
	return '<td class="property property-' + name + ((value == '') ? ' empty' : '') + '" data-property-name="' + name + '">' + value + '</td>';
}

// Рендерит список
ListController.prototype.renderList = function() {
	
	var output = '';

	for (var i = 0; i < this.buffer.length; i++) {
		output+='<tr class="list-item list-item-' + this.buffer[i].id + '">';

		for (property in this.buffer[i]) {
			output+=this.renderItemProperty(property, this.buffer[i][property]);
		}

		output+='<td class="actions">';
		output+='<button class="edit btn btn-default glyphicon glyphicon-pencil"></button> ';
		output+='<button class="delete btn btn-default glyphicon glyphicon-trash"></button>';
		output+='</td>';

		output+='</tr>';
	}

	this.container.find("tbody").empty().append(output);
}

// Получить DOM-строку списка по ID
ListController.prototype.getRowById = function(id) {
	return this.container.find(".list-item-"+id);
}

// Получить объект элемента списка по его DOM-строке
ListController.prototype.getItemByRow = function(row) {

	// Если DOM-строки не найдено - вернуть false 
	if (!row.size()) { 
		return false; 
	// Иначе...
	} else {
		// Создаём будущий объект элемента
		var item = {};
		// Проходимся по ячейкам свойств строки элемента
		row.find(".property").each(function() {
			// Получаем название свойства из аттрибута ячейки
			var propName = jQuery(this).attr("data-property-name");
			// Если это не ячейка строки с действиями
			if (propName != "actions") {
				// то дополняем наш объект элемента списка свойством со значением
				item[propName] = (propName == "id" || propName == "position") ? parseInt(jQuery(this).text()) : jQuery(this).text();
			}
		});
		// Возвращаем сформированный объект элемента списка
		return item;
	}
}

// Получить объект элемента списка по ID
ListController.prototype.getListItemById = function(id) {
	// Получаем строку по ID
	var row = this.getRowById(id);
	// Получаем объект элемента списка по строке
	return this.getItemByRow(row);
}

// Получить индекс элемента в буфере по его ID
ListController.prototype.getBufferIndexById = function(id) {
	for (var i = 0; i < this.buffer.length; i++) {
		if (this.buffer[i].id == id) { return i; }
	};
}

// Получить объект элемента буфера по его ID
ListController.prototype.getBufferItemById = function(id) {
	// Получаем индекс элемента в буфере по его ID
	var index = this.getBufferIndexById(id);
	// Возвращаем элемент буфера с указанным индексом
	return this.buffer[index];
}

// Удалить элемент буфера по его индексу
ListController.prototype.removeBufferItem = function(index) {
	if (typeof this.buffer[index] != "undefined") {
		this.buffer.splice(index, 1);
	} else {
		return false;
	}
}

// Удалить элемент буфера по его ID
ListController.prototype.removeBufferItemById = function(id) {
	// Получаем индекс элемента в буфере по его ID
	var index = this.getBufferIndexById(id);
	// Удаляем элемент из буфера по полученному индексу
	return this.removeBufferItem(index);
}

// Обновить элемент буфера по его индексу
ListController.prototype.updateBufferItem = function(item) {
	// Получаем индекс элемента в буфере
	var index = this.getBufferIndexById(item.id);
	// Обновляем элемент в буфере
	this.buffer[index] = item;
}

// Метод для удаления элемента списка
ListController.prototype.removeItemRow = function(id) {
	// Получаем DOM-строку элемента по его ID
	var row = this.getRowById(id);
	// Удаляем строку из списка
	row.remove();
}

// Метод для удаления элемента
ListController.prototype.removeItem = function(id) {
	// Удаляем элемент из списка
	this.removeItemRow(id);
	// Удаляем элемент из буфера
	this.removeBufferItemById(id);
	// Добавляем ID элемента в очередь на удаление
	this.deleteQueue.push(id);
	// Запускаем таймер на отправку данных на сервер
	this.timeout(jQuery.proxy(this.send, this), 5000);
}

ListController.prototype.send = function() {
	this.server.delete(this.deleteQueue);
	this.server.create(this.createQueue);
	this.server.update(this.updateQueue);

	delete this.deleteQueue;
	delete this.createQueue;
	delete this.updateQueue;

	this.deleteQueue = new Array();
	this.createQueue = new Array();
	this.updateQueue = new Array();
};

// Метод предназначеный для навешивания обработчиков на элементы списка
ListController.prototype.attachHandlers = function() {

	// Подписываемся на событие удаления на сервере
	this.server.on('delete', $.proxy(function(data) {
		// Для каждого ID из набора возвращённого сервером
		for (var i = 0; i < data.length; i++) {
			// Удаляем элемент с ID из буфера
			this.removeBufferItemById(data[i]);
			// Удаляем элемент с ID из списка
			this.removeItemRow(data[i]);
		};
	}, this));

	this.container.on("click", "button.delete", jQuery.proxy(function(event) {

		var button = this.container.find(event.currentTarget);
		button.addClass("disabled");
		var row = button.parent().parent();
		var item = this.getItemByRow(row);

		this.removeItem(item.id);

	}, this));
}



