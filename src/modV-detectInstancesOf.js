modV.prototype.detectInstancesOf = function(name) {
	let instances = [];
	
	forIn(this.activeModules, key => {
		let item = this.activeModules[key];
		if(name === item.info.originalModuleName) {
			instances.push(item);
		}
	});

	return instances;
};