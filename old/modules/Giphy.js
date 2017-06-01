/* globals Giphy */
class GiphyModV extends modV.Module2D {
	constructor() {
		super({
			info: {
				name: 'Giphy',
				author: '2xAA',
				version: 0.1,
				previewWithOutput: false,
				scripts: [
					'giphy/giphy.min.js'
				]
			}
		});
	}

	initGiphy() {
		this.giphy = new Giphy('dc6zaTOxFJmzC');
	}

	createControls(Module) {

		console.log(Module.video);

		if(typeof Module.giphy === "undefined") {
			console.log('creating new giphy');
			Module.initGiphy();
		}

		var giphyControlWrap = document.createElement('div');

		var gifGallery = document.createElement('div');

		var searchField = document.createElement('input');
		searchField.type = "text";
		searchField.addEventListener('keypress', function(e) {

			if(e.keyCode === 13) {

				this.select();

				Module.giphy.search({
					q: this.value,
					offset: 0,
					rating: 'r',
					fmt: 'json',
					'limit': 10
				},
				function(success) {
					console.log(success);
					gifGallery.innerHTML = '';

					success.data.forEach(function(gif) {

						var img = document.createElement('img');
						img.src = gif.images.downsized.url;

						img.addEventListener('click', function() {

							var video = document.createElement('video');
							video.crossOrigin = "anonymous";
							video.muted = true;
							video.loop = true;
							video.playbackRate = Module.playbackRate;

							video.oncanplaythrough = function() {
								Module.video = video;
								// total frames, duration, fps, frame time
								console.log(parseInt(gif.images.original.frames), video.duration, gif.images.original.frames / video.duration, video.duration/gif.images.original.frames);
								video.oncanplaythrough = null;
								
							};

							video.src = gif.images.original.mp4;
							video.play();					

						});

						gifGallery.appendChild(img);

					});

				},
				function(e) {
					console.error('Giphy: Could not connect to Giphy', e);
				});

			}

		});

		giphyControlWrap.appendChild(searchField);
		giphyControlWrap.appendChild(gifGallery);

		return giphyControlWrap;

	}
	
	init(canvas) {
		
		this.add(new modV.CustomControl(this.createControls));

		this.add(new modV.RangeControl({
			variable: 'playbackRate',
			label: 'Playback Rate',
			min: -1.0,
			max: 2.0,
			varType: 'float',
			step: 0.1
		}));

		this.initGiphy();

		this.video = document.createElement('video');
		this.video.src = '';
		this.video.muted = true;
		this.video.loop = true;
		this.playbackRate = 1.0;
		this.giphyCanvas = document.createElement('canvas');
		this.giphyCtx = this.giphyCanvas.getContext('2d');
		this.giphyCanvas.width = canvas.width;
		this.giphyCanvas.height = canvas.height;
	}

	resize(canvas) {
		this.giphyCanvas.width = canvas.width;
		this.giphyCanvas.height = canvas.height;
	}

	draw(canvas, ctx) {

		try {
			this.video.playbackRate = this.playbackRate;
		} catch(e) {
			
		}

		// use as a frame buffer as HTML5 video cannot loop seamlessly 100% of the time (or even 1% :^( )
		this.giphyCtx.drawImage(this.video, 0, 0, this.giphyCanvas.width, this.giphyCanvas.height); 

		ctx.drawImage(this.giphyCanvas, 0, 0, canvas.width, canvas.height); 

	}
}

modV.register(GiphyModV);