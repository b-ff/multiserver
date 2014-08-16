function Server() {
	// ...Init...
}

Server.prototype.users = [];

Server.prototype.data = DB;

Server.prototype.edit = 	[]; // Массив хранящий id записей которые редактируются в настоящее время

// Объект хранящий массивы пользовательских обработчиков по событиям
Server.prototype.callbacks = {
	"create"	: [], // создание
	"edit"		: [], // начало изменения
	"editcancel": [], // отмена изменения
	"update"	: [], // окончание изменения
	"delete"	: []  // удаление
}

Server.prototype.getUserToken = function() {
	var token = new Date().getTime();
	token = token.toString() + (Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000);

	this.users.push(token);

	return token;
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

// Метод для добавления элементов на сервере
Server.prototype.create = function(data) {
	
	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('create', data);
}

// Метод для обновления элементов на сервере
Server.prototype.update = function(data) {
	
	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('update', data);
}

// Метод для удаления элементов на сервере
Server.prototype.delete = function(data) {
	
	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('delete', data);
}

// Метод для блокировки элементов на сервере
Server.prototype.lock = function(item_id, user_token) {
	
	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	for (var i = 0; i < this.edit.length; i++) {
		if (this.edit[i].id == item_id) { return false; }
	};

	this.edit.push({ id: item_id, token: user_token });

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('edit', this.edit);

	return true;
}

// Метод для блокировки элементов на сервере
Server.prototype.unlock = function(item_id, user_token) {
	
	/*
	 *	Тут происходит уход запроса на сервер...
	 */

	// Вызываем пользовательские обработчики для события
	this.triggerEvent('editcancel', data);
}
