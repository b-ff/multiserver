(function($) {

	MultiServer = new Server();

	client1 = new ListController(".list.client1", MultiServer);
	client2 = new ListController(".list.client2", MultiServer);
	serverViewer = new ListController(".list.server", MultiServer);

})(jQuery);