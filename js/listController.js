function ListController(container, server) {
	// ...Init...

	container = jQuery(container);

	if (!container.size()) { return false; }

	this.container = container;
	this.server = server;

	this.load();

	this.renderList();
}

// Буфер
ListController.prototype.buffer = {};

// Списки задач для отправки на сервер
ListController.prototype.createQueue = 	[]; // добавление
ListController.prototype.updateQueue = 	[];	// обновление
ListController.prototype.deleteQueue = 	[];	// удаление

ListController.prototype.load = function() {
	this.buffer = this.server.getList();
};

ListController.prototype.renderItemProperty = function(name, value) {
	return '<td class="property property-' + name + ((value == '') ? ' empty' : '') + '">' + value + '</td>';
}

ListController.prototype.renderList = function() {
	
	var output = '';

	for (var i = 0; i < this.buffer.length; i++) {
		output+='<tr class="list-item list-item-' + this.buffer[i].id + '">';

		for (property in this.buffer[i]) {
			output+=this.renderItemProperty(property, this.buffer[i][property]);
		}

		output+='<td class="actions">';
		output+='<button class="edit btn btn-default glyphicon glyphicon-pencil"></button>';
		output+='<button class="delete btn btn-default glyphicon glyphicon-trash"></button>';
		output+='</td>';

		output+='</tr>';
	}

	this.container.find("tbody").append(output);
}


