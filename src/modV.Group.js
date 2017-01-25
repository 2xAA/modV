module.exports = function(modV) {
	modV.prototype.Group = function() {
		var self = this;
		var Modules = [];

		self.canvas = document.createElement('canvas');
		self.ctx = self.canvas.getContext('2d');

		self.add = function(Module) {
			Modules.push(Module);
			return;
		};

		self.remove = function(index) {
			var returnVal = Modules.splice(index, 1);
			return returnVal;
		};
		
		//TODO: error stuff
/*		// RangeControl error handle
		function ControlError(message) {
			// Grab the stack
			this.stack = (new Error()).stack;

			// Parse the stack for some helpful debug info
			var reg = /\((.*?)\)/;    
			var stackInfo = this.stack.split('\n').pop().trim();
			stackInfo = reg.exec(stackInfo)[0];

			// Expose name and message
			this.name = 'modV.RangeControl Error';
			this.message = message + ' ' + stackInfo || 'Error';  
		}
		// Inherit from Error
		ModuleError.prototype = Object.create(Error.prototype);
		ModuleError.prototype.constructor = ModuleError;

		// Check for settings Object
		if(!settings) throw new ModuleError('RangeControl had no settings');
		// Check for info Object
		if(!('info' in settings)) throw new ModuleError('RangeControl had no info in settings');
		// Check for info.name
		if(!('name' in settings.info)) throw new ModuleError('RangeControl had no name in settings.info');
		// Check for info.author
		if(!('author' in settings.info)) throw new ModuleError('RangeControl had no author in settings.info');
		// Check for info.version
		if(!('version' in settings.info)) throw new ModuleError('RangeControl had no version in settings.info');*/

		// // Copy settings values to local scope
		// for(var key in settings) {
		// 	if(settings.hasOwnProperty(key)) {
		// 		self[key] = settings[key];
		// 	}
		// }
	};
};