(function($) {

	MultiServer = new Server();

	// Глобальный объект который будет содержать в себе контроллеры списков для каждого юзера
	Users = {}

	// Для каждого списка инициализируем контроллер и прописываем наш callback на событие редактирования
	$("table.list").each(function() {
		var role = $(this).attr("data-role");

		if (typeof role != "undefined" && role != "") {
			Users[role] = new ListController($(this), MultiServer);

			Users[role].onEdit(function(item) {
				var editor = Users[role].container.parent().parent().find(".editor");

				editor.find("input#id-field").val(item.id);
				editor.find("input#name-field").val(item.name);
				editor.find("input#position-field").val(item.position);

				editor.stop().slideDown(function() {
					$(this).find("#name-field").focus();
				});
			});
		}
	});

	// Обработчик нажатия кнопки добавления нового элемента списка
	$(".btn.add").on("click", function(event) {

		var editor = $(".editor").filter(":eq("+$(this).index(".btn.add")+")");

		editor.find("input#id-field").val("");
		editor.find("input#name-field").val("");
		editor.find("input#position-field").val("");

		editor.stop().slideDown(function() {
			$(this).find("#name-field").focus();
		});

		return false;
	});

	// Обработчик нажатия кнопки отмены в редакторе
	$(".btn.cancel").on("click", function(event) {

		// Форма редактора
		var editor = $(".editor").filter(":eq("+$(this).index(".btn.cancel")+")");
		var role = editor.siblings(".data").find(".list").attr("data-role");
		var listController = Users[role];

		// Получаем ID элемента из формы
		var itemID = editor.find("input#id-field").val();

		// Если в форме указан ID элемента значит это было редактирование
		if (typeof itemID != "undefined" && itemID != '') {
			itemID = parseInt(itemID);
			// Снимаем блокировку с элемента
			listController.unlock(itemID);
		}

		editor.stop().slideUp(function() {
			$(this).find("input#id-field").val("");
			$(this).find("input#name-field").val("");
			$(this).find("input#position-field").val("");
		});

		return false;
	});

	$(".btn.save").on("click", function(event) {

		// Форма редактора
		var editor = $(".editor").filter(":eq("+$(this).index(".btn.save")+")");
		var role = editor.siblings(".data").find(".list").attr("data-role");
		var listController = Users[role];
		
		// Собираем объект элемента из значений формы
		var item = {
			id : editor.find("input#id-field").val(),
			name : editor.find("input#name-field").val(),
			position : editor.find("input#position-field").val()
		}

		// Если в форме присутствует ID - значит обновление элемента
		if (item.id != '') { 
			item.id = parseInt(item.id); 
			listController.updateItem(item);
		// Если ID в форме нет - значит создание
		} else {
			listController.createItem(item);
		}

		editor.stop().slideUp(function() {
			$(this).find("input#id-field").val("");
			$(this).find("input#name-field").val("");
			$(this).find("input#position-field").val("");
		});

		return false;
	});

})(jQuery);