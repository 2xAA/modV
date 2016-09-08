var Tile = new modVC.Module2D({
	info: {
		name: 'Tile',
		author: '2xAA',
		version: 0.2,
		previewWithOutput: true
	},
	init: function(canvas) {
		this.canvas2 = document.createElement('canvas');
		this.ctx2 = this.canvas2.getContext("2d");
		this.tileWidth = 2;
		this.tileHeight = 2;

		this.canvas2.width = canvas.width;
		this.canvas2.height = canvas.height;
	},
	resize: function(canvas) {
		this.canvas2.width = canvas.width;
		this.canvas2.height = canvas.height;
	},
	draw: function(canvas, ctx) {
		var canvas2 = this.canvas2;
		var ctx2 = this.ctx2;

		ctx2.clearRect(0,0,canvas.width, canvas.height);
		ctx2.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvas2.width, canvas2.height);
		for(var i=0; i < this.tileWidth; i++) {
			for(var j=0; j < this.tileHeight; j++) {
				ctx.drawImage(canvas2,
					0,
					0,
					canvas2.width,
					canvas2.height,
					(canvas2.width/this.tileWidth)*i,
					(canvas2.height/this.tileHeight)*j,
					canvas2.width/this.tileWidth,
					canvas2.height/this.tileHeight
				);
			}
		}	

	}
});

var controls = [];

controls.push(new modVC.RangeControl({
    variable: 'tileWidth',
    label: 'Tile Width',
    varType: 'int',
    min: 1,
    max: 20,
    step: 1,
    default: 2
}));

controls.push(new modVC.RangeControl({
    variable: 'tileHeight',
    label: 'Tile Height',
    varType: 'int',
    min: 1,
    max: 20,
    step: 1,
    default: 2
}));

Tile.add(controls);

modVC.register(Tile);