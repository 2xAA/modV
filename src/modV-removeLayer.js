modV.prototype.removeLayer = function(Layer) {
	
	// remove modules from global lsit
	forIn(Layer.modules, (key, Module) => {
		this.deleteActiveModule(Module);
	});

	let activeListNode = document.querySelector('.active-list');
	activeListNode.removeChild(Layer.getNode());

	let layerIndex = this.layers.indexOf(Layer);

	this.layers.splice(layerIndex, 1);

	this.layers.forEach((Layer, index) => {
		Layer.updateIndex(index);
	});
};