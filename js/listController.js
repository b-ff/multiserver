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

	this.userToken = this.server.getUserToken();

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

	this.timeout.timeoutID = setTimeout($.proxy(function() {
		func();
		delete this.timeout.timeoutID;
	}, this), delay);
}

// Получает с сервера весь список и помещает его в буфер
ListController.prototype.load = function() {
	this.buffer = this.server.getList();
};

// Отправляет содержимое буферов на сервер и затем очищает их
ListController.prototype.send = function() {
	this.server.delete(this.deleteQueue, this.userToken);
	this.server.create(this.createQueue, this.userToken);
	this.server.update(this.updateQueue, this.userToken);

	delete this.deleteQueue;
	delete this.createQueue;
	delete this.updateQueue;

	this.deleteQueue = new Array();
	this.createQueue = new Array();
	this.updateQueue = new Array();
};

// Рендерит свойство элемента списка
ListController.prototype.renderItemProperty = function(name, value) {
	return '<td class="property property-' + name + ((value == '') ? ' empty' : '') + '" data-property-name="' + name + '">' + value + '</td>';
}

// Рендерит список
ListController.prototype.renderList = function() {
	
	var output = '';

	for (var i = 0; i < this.buffer.length; i++) {
		output+='<tr class="list-item list-item-' + i + ' list-item-id-' + this.buffer[i].id + '">';

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
	return this.container.find(".list-item-id-"+id);
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
	this.timeout($.proxy(this.send, this), 5000);
}

// Переопределяемый метод
ListController.prototype.edit = function(itemObject) {
	// ...
}

// Переопределятор предыдущего метода
ListController.prototype.onEdit = function(callback) {
	this.edit = callback;
}

// Метод обновляющий значение заданного поля в указанной строке
ListController.prototype.setPropertyValue = function(row, propertyName, value) {

	// row может быть объектом jQuery, порядковым номером или селектором (в т.ч. множественным) строки списка
	row = (row instanceof jQuery) ? row : (typeof row == "number") ? this.container.find(".list-item-"+row) : this.container.find(row);

	// Если строка действительно нашлась
	if (row.size()) {
		var propertyField = row.find(".property-"+propertyName);

		// И у неё даже есть такое свойство
		if (propertyField.size()) {
			// Обновляем его значение
			propertyField.text(value);
		} else {
			this.error("Update property error! Wrong property name '"+propertyName+"'!");
		}
	} else {
		this.error("Update property error! Can't find selected row in list!");
	}
}

// Обновляет элемент списка по ID в переданном объекте элемента
ListController.prototype.updateBufferItem = function(itemObject) {
	var bufferIndex = this.getBufferIndexById(itemObject.id);

	this.buffer[bufferIndex] = itemObject;
}

// Обновляет элемент списка по ID в переданном объекте элемента
ListController.prototype.updateItem = function(itemObject) {
	var row = this.getRowById(itemObject.id);

	// Обновляем элемент в буффере
	this.updateBufferItem(itemObject);

	// Обновляем элемент в списке
	for (propertyName in itemObject) {
		this.setPropertyValue(row, propertyName, itemObject[propertyName]);
	}

	// Если это мы редактировали элемент то шлём изменения в очередь и потом на сервер
	if (row.hasClass("info")) {
		// Добавляем ID элемента в очередь на удаление
		this.updateQueue.push(itemObject);
		// Запускаем таймер на отправку данных на сервер
		this.timeout($.proxy(this.send, this), 5000);
	}

	row.removeClass("info");
}

// Создаёт новый элемент списка из полученного объекта
ListController.prototype.createItem = function(itemObject) {
	// ...
}

// Обёртка для серверного метода блокировки элемента при редактировании
// Предназначена для того, чтобы изолировать userToken от использования в API на стороне
ListController.prototype.lock = function(id) {
	if (!this.server.lock(id, this.userToken)) {
		this.error("List item #"+id+" is already editing!");
	}
}

// Обёртка для серверного метода разблокировки элемента при окончании редактирования
// Предназначена для того, чтобы изолировать userToken от использования в API на стороне
ListController.prototype.unlock = function(id) {
	if (!this.server.unlock(id, this.userToken)) {
		this.error("You cannot unlock this list item if someone other edit it!");
	}
}

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

	// Подписываемся на событие начала редактирования элемента на сервере
	this.server.on('edit', $.proxy(function(item_id) {

		var row = this.getRowById(item_id);
		if (!row.hasClass("info")) {
			row.addClass("warning");
			row.find("button").addClass("disabled");
		}

	}, this));


	// Подписываемся на событие окончания редактирования редактирования элемента на сервере
	this.server.on('unlock', $.proxy(function(item_id) {

		var row = this.getRowById(item_id);
		
		if (row.hasClass("warning")) {
			row.removeClass("warning");
		}
		
		if (row.hasClass("info")) {
			row.removeClass("info");
		}

		this.container.find(".list-item").not(".warning").find("button").removeClass("disabled");

	}, this));

	// Подписываемся на событие обновления элемента
	this.server.on('update', $.proxy(function(data) {

		this.info(this.container.attr("data-role") + ": trying to update those " + data.length + " elements:");
		for (var i = 0; i < data.length; i++) {
			this.info(data[i]);
			this.updateItem(data[i]);
		};

	}, this));

	// Вешаем обработчик на кнопку списка
	this.container.on("click", "button.delete", $.proxy(function(event) {

		var button = this.container.find(event.currentTarget);
		button.addClass("disabled");
		var row = button.parent().parent();
		var item = this.getItemByRow(row);

		this.removeItem(item.id);

	}, this));

	// Вешаем обработчик на кнопку списка
	this.container.on("click", "button.edit", $.proxy(function(event) {

		var button = this.container.find(event.currentTarget);
		var row = button.parent().parent();
		var item = this.getItemByRow(row);

		row.addClass("info");
		this.container.find("button.edit").addClass("disabled");

		this.edit(item);

		this.lock(item.id, this.userToken);

	}, this));
}



