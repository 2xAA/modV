module.exports = function(modV) {

	modV.prototype.createGalleryItem = function(oldModule) {
		var self = this;

		if(
			!(oldModule instanceof self.Module2D) &&
			!(oldModule instanceof self.ModuleShader) &&
			!(oldModule instanceof self.Module3D) &&
			!(oldModule instanceof self.ModuleScript)
		) return;

		if(self.headless) return;		

		self.galleryModules = [];
		
		var template = self.templates.querySelector('#gallery-item');
		var galleryItem = document.importNode(template.content, true);

		var previewCanvas = galleryItem.querySelector('canvas');

		// Module variables
		var previewCtx = previewCanvas.getContext('2d');
		
		// Clone module
		var Module = self.createModule(oldModule, previewCanvas, previewCtx, true);

		// Setup any preview settings for gallery item
		if('previewValues' in Module.info) {
			forIn(Module.info.previewValues, (key, value) => {
				Module[key] = value;
			});
		}
		
		document.querySelector('.gallery').appendChild(galleryItem);

		// Tell the Module it is in the gallery
		Module.info.galleryItem = true;

		// Pull back initialised node from DOM
		galleryItem = document.querySelector('.gallery .gallery-item:last-child');
		var galleryItemTitle = galleryItem.querySelector('span.title');
		galleryItemTitle.textContent = Module.info.name;

		// Set data
		// TODO: make sure this follows the HTML5 attributes spec: https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
		galleryItem.dataset.moduleName = Module.info.name.replace(' ', '-');

		// Draw preview
		//giMouseEnter(Module, previewCanvas, previewCtx, self);

		// Draw name
		giMouseOut(Module, previewCanvas, previewCtx, self);

		previewCanvas.addEventListener('mouseenter', function() {
			/*var loop = giMouseEnter(Module, previewCanvas, previewCtx, self);
			interval = setInterval(loop, 1000/60);*/
			mouseOver = true;
			activeVariables = [Module, previewCanvas, previewCtx, self];
			raf = requestAnimationFrame(loop);
		});

		previewCanvas.addEventListener('mouseout', function() {
			giMouseOut(Module, previewCanvas, previewCtx, self);
			cancelAnimationFrame(raf);
			mouseOver = false;
			activeVariables = [];
		});

/*		previewCanvas.addEventListener('mousemove', function(evt) {
			mousePos = getMousePos(previewCanvas, evt, true);
	   	}, false);*/

	};

	//var mousePos = {x: 0, y: 0};
	var mouseOver = false;
	var raf = null;
	var activeVariables = [];

	//function giMouseEnter(Module, canvas, ctx, self) {

		function loop(delta) {
			
			if(mouseOver) raf = requestAnimationFrame(loop);
			else cancelAnimationFrame(raf);

			if(activeVariables.length !== 4) {
				return;
			}

			var Module = activeVariables[0],
				canvas = activeVariables[1],
				ctx = activeVariables[2],
				self = activeVariables[3];

			//ctx.clearRect(0, 0, mousePos.x, canvas.height);
			//ctx.clearRect(0, 0, Math.round(canvas.width/2), canvas.height);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			//var positionInfo = canvas.getBoundingClientRect();

			//var largeWidth = Math.round(Math.map(mousePos.x, 0, positionInfo.width, 0, self.canvas.width));

			if(Module.info.previewWithOutput || Module instanceof self.ModuleShader) {
				ctx.drawImage(self.previewCanvas, 0, 0, canvas.width, canvas.height);
			}

			//ctx.drawImage(self.canvas, largeWidth, 0, self.canvas.width, self.canvas.height, mousePos.x, 0, canvas.width, canvas.height);
			//ctx.drawImage(self.canvas, Math.round(self.canvas.width/2), 0, self.canvas.width, self.canvas.height, Math.round(canvas.width/2), 0, canvas.width, canvas.height);
			

			if(Module instanceof self.ModuleShader) {

				var _gl = self.shaderEnv.gl;

				// Switch program
				if(Module.programIndex !== self.shaderEnv.activeProgram) {

					self.shaderEnv.activeProgram = Module.programIndex;

					_gl.useProgram(self.shaderEnv.programs[Module.programIndex]);
				}

				// Copy Main Canvas to Shader Canvas 
				self.shaderEnv.texture = _gl.texImage2D(
					self.shaderEnv.gl.TEXTURE_2D,
					0,
					_gl.RGBA,
					_gl.RGBA,
					_gl.UNSIGNED_BYTE,
					self.previewCanvas
				);

				// Set Uniforms
				if('uniforms' in Module.info) {
					forIn(Module.info.uniforms, (uniformKey, uniform) => {
						var uniLoc = _gl.getUniformLocation(self.shaderEnv.programs[self.shaderEnv.activeProgram], uniformKey);
						var value;

						switch(uniform.type) {
							case 'f':
								value = parseFloat(Module[uniformKey]);
								_gl.uniform1f(uniLoc, value);
								break;

							case 'i':
								value = parseInt(Module[uniformKey]);
								_gl.uniform1i(uniLoc, value);
								break;

							case 'b':
								value = Module[uniformKey];
								if(value) value = 1;
								else value = 0;
								
								_gl.uniform1i(uniLoc, value);
								break;

						}
					});
				}

				// Render
				self.shaderEnv.render(delta, canvas);

				// Copy Shader Canvas to Main Canvas
				ctx.drawImage(
					self.shaderEnv.canvas,
					0,
					0,
					canvas.width,
					canvas.height
				);

			} else if('draw' in Module) {
				ctx.save();
				Module.draw(canvas, ctx, self.video, self.myFeatures, self.meyda, delta, self.bpm, self.kick);
				ctx.restore();
			}
		}

	//}

	function giMouseOut(Module, canvas, ctx) {
		//ctx.fillStyle = 'rgba(0,0,0,0.5)';
		//ctx.fillRect(0, 0, canvas.width, canvas.height);
		//ctx.fillStyle = 'white';
		//var textWidth = ctx.measureText(Module.info.name).width;
		//ctx.fillText(Module.info.name, canvas.width/2 - textWidth/2, canvas.height/2);
	}

/*	function getMousePos(canvas, evt, round) {
		var rect = canvas.getBoundingClientRect();
		if(round) {
			return {
				x: Math.floor(evt.clientX - rect.left),
				y: Math.floor(evt.clientY - rect.top)
			};
		} else {
			return {
				x: evt.clientX - rect.left,
				y: evt.clientY - rect.top
			};
		}
	}*/

};