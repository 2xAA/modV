class Concentrics extends modV.Module2D {
	constructor() {
		super({
			info: {
				name: 'Concentrics',
				author: '2xAA',
				version: 0.2,
				meyda: ['zcr', 'rms'],
			}
		});

		var controls = [];

		controls.push(new modV.CheckboxControl({
			variable: 'rms',
			label: 'Use RMS',
			checked: false
		}));

		controls.push(new modV.RangeControl({
			variable: 'intensity',
			label: 'RMS/ZCR Intensity',
			varType: 'int',
			min: 0,
			max: 30,
			step: 1
		}));

		controls.push(new modV.RangeControl({
			variable: 'spacing',
			label: 'Circle Spacing',
			varType: 'int',
			min: 0,
			max: 100,
			step: 1,
			default: 5
		}));

		controls.push(new modV.RangeControl({
			variable: 'objectDistance',
			label: 'Object Distance',
			varType: 'int',
			min: 0,
			max: 200,
			step: 1,
			default: 40
		}));

		controls.push(new modV.RangeControl({
			variable: 'strokeWeight',
			label: 'Stroke Weight',
			varType: 'int',
			min: 1,
			max: 20,
			step: 1,
			default: 1
		}));

		this.add(controls);
	}

	Concentric() {
		return function(canvas) {
			this.x = canvas.width / 2;
			this.y = canvas.height / 2;
			this.hue = Math.round(Math.random() * 360);
				
			this.draw = function(ctx, zcr, strokeWeight, spacing) {
				ctx.strokeStyle = 'hsl(' + this.hue + ', 50%, 50%)';
				ctx.lineWidth = strokeWeight;

				for(var i=0; i < zcr; i++) {
					ctx.beginPath();
					ctx.arc(this.x, this.y, i * spacing, 0, 2*Math.PI);
					ctx.closePath();
					ctx.stroke();
				}
				
				if(this.hue > 360) this.hue = 0;
				else this.hue += 0.2;
			};
		};
	}
		
	init(canvas) {
			
		this.rms = false;
		this.intensity = 1;
		this.spacing = 5;
		this.strokeWeight = 1;
		this.objectDistance = 40;
		
		this.circle1 = new (this.Concentric())(canvas);
		this.circle2 = new (this.Concentric())(canvas);
		
	}

	draw(canvas, ctx, vid, features, meyda, delta) {
		var zcr = features.zcr;
		if(this.rms) zcr = features.rms;

		zcr = this.intensity * zcr;
		if(this.rms) {
			zcr = zcr * 50;
		}

		this.circle1.x = canvas.width/2 + Math.sin(delta / 1000) * this.objectDistance;
	    this.circle1.y = canvas.height/2 + Math.cos(delta / 1000) * this.objectDistance / 2;
	    this.circle1.draw(ctx, zcr, this.strokeWeight, this.spacing);
	    
	    this.circle2.x = canvas.width/2 + -Math.sin(delta / 1000) * this.objectDistance;
	    this.circle2.y = canvas.height/2 + -Math.cos(delta / 1000) * this.objectDistance / 2;
	    this.circle2.draw(ctx, zcr, this.strokeWeight, this.spacing);
	}
}

window.Concentrics = new Concentrics();

modV.register(Concentrics);