(function() {
	'use strict';
	/*jslint browser: true */

	modV.prototype.createControls = function(ModuleRef, modVSelf) {
		var self = this;
		var controlPanelWrapperNode = document.querySelector('.control-panel-wrapper');
		var panelNode = document.createElement('div');
		var titleNode = document.createElement('h1');

		titleNode.textContent = ModuleRef.name;

		panelNode.appendChild(titleNode);

		panelNode.classList.add('control-panel', 'pure-u-1-1');
		panelNode.dataset.moduleName = ModuleRef.safeName;

		if('controls' in ModuleRef.Module.info) { 
			var Module = ModuleRef.Module;
			
			Module.info.controls.forEach(function(control, idx) {
				if(!control.makeNode) return;
				var inputNode;

				console.log('createControls', control.variable);

				inputNode = control.makeNode(ModuleRef, modVSelf);

				inputNode.addEventListener('contextmenu', function(ev) {
					ev.preventDefault();

					console.log('ctx', ev);
					
					self.showContextMenu('control', [control, idx, ModuleRef, inputNode], ev);

					return false;
				}, false);

				var groupNode = document.createElement('div');
				groupNode.classList.add('control-group');
				var labelNode = document.createElement('label');
				labelNode.textContent = control.label;
				groupNode.appendChild(labelNode);
				groupNode.appendChild(inputNode);
				panelNode.appendChild(groupNode);
			});

		}

		controlPanelWrapperNode.appendChild(panelNode);

	};

})();