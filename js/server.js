function Server() {
	// ...Init...
}

Server.prototype = new BaseController();

Server.prototype.users = [];

Server.prototype.data = DB;

Server.prototype.edit = 	[]; // Массив хранящий id записей которые редактируются в настоящее время

// Объект хранящий массивы пользовательских обработчиков по событиям
Server.prototype.callbacks = {
	"create"	: [], // создание
	"edit"		: [], // начало изменения
	"unlock"	: [], // отмена изменения
	"update"	: [], // окончание изменения
	"delete"	: []  // удаление
}

Server.prototype.getUserToken = function() {
	var token = new Date().getTime();
	token = token.toString() + (Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000);

	this.users.push(token);

	return token;
}

Server.prototype.getMaxId = function() {
	var maxId = 0;

	for (var i = 0; i < this.data.length; i++) {
		if (this.data[i].id > maxId) { maxId = this.data[i].id; }
	};

	return maxId;
}

// Бронирует следующий после максимального порядковый ID элемента
Server.prototype.reserveId = function() {
	var newId = this.getMaxId() + 1;
	this.data.push({ 
		id: newId, 
		name: 'RESERVED',
		position: 'RESERVED'
	});

	return newId;
}

// Метод аля jQuery для навешивания обработчиков на события сервера
Server.prototype.on = function(eventType, callback) {
	// Если указан правильный эвент и переданный обработчик является функцией
	if (typeof this.callbacks[eventType] != "undefined" && typeof callback == "function") {
		// Добавляем его в массив обработчиков для данного типа события
		this.callbacks[eventType].push(callback);
	}
}

// Синтаксический сахар

Server.prototype.onCreate = function(callback) {
	this.on("create", callback);
}

Server.prototype.onEdit = function(callback) {
	this.on("edit", callback);
}

Server.prototype.onUpdate = function(callback) {
	this.on("update", callback);
}

Server.prototype.onDelete = function(callback) {
	this.on("delete", callback);
}

// Метод реализующий запуск всех пользовательских обработчиков для указанного события
// (хз зачем параметр eventData, где-нибудь применим=))
Server.prototype.triggerEvent = function(eventType, eventData) {
	// Если указан правильный эвент
	if (typeof this.callbacks[eventType] != "undefined") {
		// Для каждого пользовательского обработчика
		for (var i = 0; i < this.callbacks[eventType].length; i++) {
			// Если это действительно функция-обработчик, а то мало-ли, вон женщины с бородой... такое время, что никому нельзя верить...
			if (typeof this.callbacks[eventType][i] == "function") {
				// Выполняем его, передав какие-то данные события
				this.callbacks[eventType][i](eventData);
			}
		};
	}
}

Server.prototype.getList = function() {
	// Возвращаем клонированный в памяти массив, чтобы данные API сервера не были взаимосвязаны с буфером контроллера списка пользователя
	return this.data.slice(0);
};


// Получить индекс элемента в базе по его ID
Server.prototype.getListIndexById = function(id) {
	for (var i = 0; i < this.data.length; i++) {
		if (this.data[i].id == id) { return i; }
	};

	return false
}

// Метод для добавления элементов на сервере
Server.prototype.create = function(data, userToken) {
	
	if (typeof data == 'undefined' || data.length == 0) { return false; }

	this.info("Server: create task runned!");

	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	for (var i = 0; i < data.length; i++) {
		var DBIndex = this.getListIndexById(data[i].id);
		this.data[DBIndex] = data[i];
	};

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('create', data);
}

// Метод для обновления элементов на сервере
Server.prototype.update = function(data, userToken) {

	if (typeof data == 'undefined' || data.length == 0) { return false; }
	
	this.info("Server: update task runned!");

	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	for (var i = 0; i < data.length; i++) {
		this.info("Server: unlocking element "+data[i].id);
		this.unlock(data[i].id, userToken);
		var DBIndex = this.getListIndexById(data[i].id);
		this.data[DBIndex] = data[i];
	};

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('update', data);
}

// Метод для удаления элементов на сервере
Server.prototype.delete = function(data, userToken) {

	if (typeof data == 'undefined' || data.length == 0) { return false; }
	
	this.info("Server: delete task runned!");

	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	for (var i = 0; i < data.length; i++) {
		var DBIndex = this.getListIndexById(data[i]);

		if (DBIndex) {
			this.info("Server: deleting item #"+DBIndex+" from DB");
			this.info(this.data[DBIndex]);
			this.data.splice(DBIndex, 1);	
		}
	};


	// Вызываем пользовательские обработчики для события
	this.triggerEvent('delete', data);
}

// Метод для блокировки элементов на сервере
Server.prototype.lock = function(item_id, user_token) {

	if (typeof item_id == 'undefined') { return false; }
	
	this.info("Server: lock task runned!");

	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	for (var i = 0; i < this.edit.length; i++) {
		if (this.edit[i].id == item_id) { return false; }
	};

	this.edit.push({ id: item_id, token: user_token });

	// Вызываем пользовательские обработчики для события
	// this.triggerEvent('edit', this.edit);
	this.triggerEvent('edit', item_id);

	return true;
}

// Метод для блокировки элементов на сервере
Server.prototype.unlock = function(item_id, user_token) {
	
	if (typeof item_id == 'undefined') { return false; }

	this.info("Server: unlock task runned!");

	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	var index = null;

	for (var i = 0; i < this.edit.length; i++) {
		if (this.edit[i].id == item_id) {
			index = i;
		}
	};

	if (index != null && this.edit[index].token == user_token) {
		// Удаляем элемент из списка редактируемых
		this.edit.splice(index, 1);
		// Вызываем пользовательские обработчики для события
		this.triggerEvent('unlock', item_id);
		// Возвращаем "ок"
		return true;
	}

	return false;
}
