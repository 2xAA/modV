/* globals getDocument */
(function() {
	'use strict';
	/*jslint browser: true */
	
	function replaceAll(string, operator, replacement) {
		return string.split(operator).join(replacement);
	}

	var loadJS = function(url, location, Module){
		//url is URL of external file, implementationCode is the code
		//to be called from the file, location is the location to 
		//insert the <script> element

		var loaderPromise = new Promise(resolve => {
			var scriptTag = document.createElement('script');
			scriptTag.onload = function() {
				resolve(Module);
			};
			scriptTag.onreadystatechange = function() {
				resolve(Module);
			};

			scriptTag.src = url;

			location.appendChild(scriptTag);
		});

		return loaderPromise;
	};


	modV.prototype.register = function(Module, instantiated) {
		var self = this;
		var originalModule = Module;

		if(originalModule.name in self.moduleStore) {
			throw new STError("Already registered a Module with the name " + originalModule.name + ". Could not register duplicately named module");
		}

		// check if already instantiated for the script loader
		if(!instantiated) {
			self.moduleStore[originalModule.name] = originalModule;
			Module = new Module();
			Module.info.originalModuleName = originalModule.name;
		}
		
		// Shared Module variables
		var name;

		// Set meta
		Module.info.alpha = 1;
		Module.info.disabled = true;
		Module.info.solo = false;

		// Get name
		name = Module.info.name;
		Module.info.safeName = replaceAll(name, ' ', '-');

		// Super hacky way of loading scripts
		// TODO: use promises?
		if('scripts' in Module.info) {
			if(!('loadedScripts' in Module.info)) {
				Module.info.loadedScripts = [];
			}

			if(Module.info.loadedScripts.length !== Module.info.scripts.length) {
				Module.info.scripts.forEach(function(script) {
					loadJS('/modules/' + script, document.body, Module).then(function(Module) {
						Module.info.loadedScripts.push(true);

						if(Module.info.loadedScripts.length === Module.info.scripts.length) {
							self.register(Module, true);
						}

					});
				});
				return;
			}
		}

		// Handle Module2D
		if(Module instanceof self.Module2D) {
			console.info('Register: Module2D', Module.info.originalModuleName, '(' + name + ')');

			// Parse Meyda
			if(Module.info.meyda) {
				Module.info.meyda.forEach(self.addMeydaFeature);
			}

			// Initialise Module
			Module.init(self.layers[0].canvas, self.layers[0].context);

			// Add to Registry
			self.registeredMods[name] = Module;

			// Create Gallery item
			self.createGalleryItem(Module);
		}

		// Handle ModuleShader
		if(Module instanceof self.ModuleShader) {
			console.info('Register: ModuleShader', Module.info.originalModuleName, '(' + name + ')');

			Module.info.uniforms.modVcanvas = {
				type: "t",
				value: self.shaderEnv.texture
			};

			// Read shader document
			getDocument(self.baseURL + '/modules/' + Module.shaderFile, function(xhrDocument) {
				
				var vert = xhrDocument.querySelector('script[type="x-shader/x-vertex"]').textContent;
				var frag = xhrDocument.querySelector('script[type="x-shader/x-fragment"]').textContent;

				var gl = self.shaderEnv.gl; // set reference to self.shaderEnv.gl

				console.info('Attempting to compile', Module.info.name);
						
				// Compile shaders and create program
				var vertexShader;
				var fragmentShader;

				vertexShader = gl.createShader(gl.VERTEX_SHADER);
				gl.shaderSource(vertexShader, vert);
				gl.compileShader(vertexShader);

				var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
				var compilationLog;

				if(!compiled) {
					console.error(Module.info.name + "'s", 'Vertex Shader did not compile.');
					compilationLog = gl.getShaderInfoLog(vertexShader);
					console.info(Module.info.name + "'s", 'Vertex Shader compiler log: ' + compilationLog);
				}
	 
	  			fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
				gl.shaderSource(fragmentShader, frag);
				gl.compileShader(fragmentShader);

				compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);

				if(!compiled) {
					console.error(Module.info.name + "'s", 'Fragment Shader did not compile.');
					compilationLog = gl.getShaderInfoLog(fragmentShader);
					console.info(Module.info.name + "'s", 'Fragment Shader compiler log: ' + compilationLog);
				}

				Module.program = gl.createProgram();
				var program = Module.program;

				gl.attachShader(program, vertexShader);
				gl.attachShader(program, fragmentShader);
				gl.linkProgram(program);	
				gl.useProgram(program);

				Module.programIndex = self.shaderEnv.programs.push(program)-1;

				// TEST IMPLEMENT
				self.shaderEnv.resize(Module.programIndex);

				// Add to Registry
				self.registeredMods[name] = Module;

				// Create Gallery item
				self.createGalleryItem(Module);
			});

		}

		// Handle Module3D
		if(Module instanceof self.Module3D) {
			console.info('Register: Module3D', Module.info.originalModuleName, '(' + name + ')');

			// Parse Meyda
			if(Module.info.meyda) {
				Module.info.meyda.forEach(self.addMeydaFeature);
			}

			// Initialise Module
			Module.init(self.layers[0].canvas, Module.getScene(), self.THREE.material, self.THREE.texture);

			// Add to Registry
			self.registeredMods[name] = Module;

			// Create Gallery item
			self.createGalleryItem(Module);
			
		}
	};

})(module);