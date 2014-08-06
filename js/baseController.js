/*	
 *	Base Controller
 *	
 *	Provides basic functions such as logging and debugging methods
 *	
 *	
 *	
 *	
 *	
 */

function BaseController() {
	// this.info("Base Controller is runned!");

	return this;
}


// Internal safe log function for debugging process
BaseController.prototype.log = function(data, type) {
	if (typeof type == "undefined") { type = 'log' }

	if (console) {
		if (console[type]) {
			console[type](data);
		}
	}
}


// Extended internal logging function for errors 
BaseController.prototype.error = function(data) {
	this.log(data, 'error');
}


// Extended internal logging function for basic information
BaseController.prototype.info = function(data) {
	this.log(data, 'info');
}