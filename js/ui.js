(function($) {

	MultiServer = new Server();

	Users = {}

	jQuery("table.list").each(function() {

		var role = jQuery(this).attr("data-role");

		if (typeof role != "undefined" && role != "") {
			Users[role] = new ListController(jQuery(this), MultiServer);
		}

	});

	jQuery(".btn.add").on("click", function(event) {

		var editor = jQuery(".editor").filter(":eq("+jQuery(this).index(".btn.add")+")");

		editor.find("button").unbind("click");
		editor.find("input#id-field").val("");
		editor.find("input#name-field").val("");
		editor.find("input#position-field").val("");

		editor.stop().slideDown(function() {
			$(this).find("#name-field").focus();
		});

		return false;
	});

})(jQuery);