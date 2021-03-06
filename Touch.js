//SYNTH DEFINITIONS-----------------------------------------
var audio;

if(typeof AudioContext !== "undefined") {
	audio = new AudioContext();
}
else if(typeof webKitAudioContext !== "undefined") {
	audio = new webKitAudioContext();
}
		
//http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
window.addEventListener('touchstart', function() {

	//create empty buffer
	var buffer = myContext.createBuffer(1, 1, 22050);
	var source = myContext.createBufferSource();
	source.buffer = buffer;

	// connect to output (your speakers)
	source.connect(myContext.destination);
	// play the file
	source.noteOn(0);
}, false);

var out = audio.createGain();
out.connect(audio.destination);
out.gain.value = .75;

var delay = audio.createDelay();
var delayIn = audio.createGain();
var delayFB = audio.createGain();

delayFB.gain.value = .7;
delayIn.gain.value = .15;
delay.delayTime.value = .2;

delayIn.connect(delay); 

delay.connect(delayFB);
delayFB.connect(delay);
delay.connect(out);



var amp = audio.createGain();
amp.connect(out);
amp.connect(delayIn);
amp.gain.value = 0;


var carrier = audio.createOscillator();
carrier.start();

carrier.connect(amp);

var modulator = audio.createOscillator();
modulator.start();

var modAmp = audio.createGain();
modAmp.gain.value = 0;

modulator.connect(modAmp);
modAmp.connect(carrier.frequency);

var modulator2 = audio.createOscillator();
modulator2.start();

var mod2Amp = audio.createGain();
mod2Amp.gain.value = 0;
mod2Amp.connect(modulator.frequency);


var lfo = audio.createOscillator();
lfo.frequency.value = 5;
lfo.start();

var lfoAmp = audio.createGain();
lfoAmp.gain.value = 0;

lfo.connect(lfoAmp);
lfoAmp.connect(carrier.detune);

//CANVAS SETUP-------------------------------------------
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 8;
canvas.height = window.innerHeight - 8;

var mouseDown = false;
var mouseX = 0;
var mouseY = 0;
var pX = 0;
var pY = 0;
var dX = 0;
var dY = 0;
var mag = 0;
var magTarget = 0;


var needToClear = false;

canvas.addEventListener("mousedown",
	function(e) {
		mouseDown = true;
		amp.gain.setTargetAtTime(1, audio.currentTime, .0625);
		lfoAmp.gain.setTargetAtTime(75, audio.currentTime + .25, 8);
	}
);

canvas.addEventListener("mouseup",
	function(e) {
		mouseDown = false;
		amp.gain.setTargetAtTime(0, audio.currentTime, .125);
		lfoAmp.gain.setTargetAtTime(0, audio.currentTime, .25);
	}
);

canvas.addEventListener("mousemove",
	function(e) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}
);

//GFX Stuff-------------------------------------
function particle(x, y, m) {
	this.x = x;
	this.y = y;
	this.v = m * 100 * Math.random() * 10 + 5;

	this.angle = Math.random() * Math.PI * 2;

	this.alive = true;
	this.timeLeft = 1;
}

particle.prototype.draw = function() {
	//UPDATE--------------
	if(this.timeLeft > 0) {
		this.timeLeft = Math.max(0, this.timeLeft - .04);
		var xV = this.v * Math.cos(this.angle);
		var yV = this.v * Math.sin(this.angle);
		this.x += xV;
		this.y += yV;
		this.v *= .95;

	}
	else {
		this.alive = false;
	}

	//DRAW---------------
	ctx.beginPath();
	ctx.strokeStyle="white";
	ctx.arc(this.x, this.y, this.timeLeft * 10, 0, 2 * Math.PI, false);
	ctx.stroke();
};

var particles = [];

//MAIN LOOP------------------------------------------------

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

function draw() {
window.requestAnimationFrame(draw);
		
	dX = mouseX - pX;
	dY = mouseY - pY;

	dX = Math.abs(dX / canvas.width);
	dY = Math.abs(dY / canvas.height);

	pX = mouseX;
	pY = mouseY;

	if(mouseDown) {
			particles.push(new particle(mouseX, mouseY, mag));
		}


	particles = particles.filter(function(element) {
		return element.alive;
	});
	

	
	if(particles.length > 0) {	
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	for(var i = 0; i < particles.length; i++) {
		particles[i].draw();
	}


	if(mouseDown) {
		magTarget = (dX * dX) + (dY * dY);
	}
	else {
		magTarget = 0;
	}
		mag = .1 * magTarget + .9 * mag;
		modAmp.gain.setTargetAtTime(Math.min(.85, mag * 250) * 5000, audio.currentTime, .1);
		mod2Amp.gain.setTargetAtTime(Math.min(.75, mag * 250) * 5000, audio.currentTime, .1);
		carrier.frequency.setTargetAtTime(Math.min(2200, mag * 250 * 1200 + 200), audio.currentTime, .1);
		modulator.frequency.setTargetAtTime(1600 * (mouseX / canvas.width) + 200, audio.currentTime, .1);
		modulator2.frequency.setTargetAtTime(1600 * (mouseY / canvas.height) + 200, audio.currentTime, .1);


}

draw();

