/*
var util = require('util');
var fs = require('fs');
var ws = fs.createWriteStream('./Ketter.log', {
		flags: 'a'
	});
var through = require('through2');
var t = new through();
t.pipe(process.stdout);
t.pipe(ws);
console.log = function () {
	t.write(util.format.apply(this, arguments) + '\n');
};*/

var DEBUG = false;
var express = require('express');
var kettlerUSB = require('./kettlerUSB');
var KettlerBLE = require('./BLE/kettlerBLE');
var BikeState = require('./BikeState');
//var Oled = require('./OledInfo');
var Button = require('./lib/rpi_gpio_buttons');

//--- Web Server on port 3000 for inspecting the Kettler State
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
	res.render('index');
});
server = app.listen(3000, function () {
		console.log('Kettler app listening on port 3000!');
	});
const io = require("socket.io")(server);
io.on('connection', (socket) => {
	socket.on('key', function (ev) {
		console.log('key' + ev);
		switch (ev) {
		case 'PowerUp':
			bikeState.addPower(20);
			break;
		case 'PowerDn':
			bikeState.addPower(-20);
			break;
		case 'GearUp':
			bikeState.GearUp();
			break;
		case 'GearDn':
			bikeState.GearDown();
			break;
		case 'pause':
			bikeState.setTargetPower(140);
			break;
		}
	});
});

//--- Buttons
var button = new Button(7);
button.on('clicked', function () {
	bikeState.GearUp();
});
 var button = new Button(11);
button.on('clicked', function () {
	bikeState.GearDown();
});
 
//--- Oled Screen
//var oled = new Oled();

//--- Machine State
var bikeState = new BikeState();
// un peu de retour serveur
bikeState.on('mode', (mode) => {
	io.emit('mode', mode);
});
bikeState.on('gear', (gear) => {
	io.emit('gear', gear);
	// oled.displayGear(gear);
});
bikeState.on('grade', (grade) => {
	io.emit('grade', grade + '%');
	// oled.displayGrade(grade);
});
bikeState.on('windspeed', (windspeed) => {
	io.emit('windspeed', windspeed);
});
bikeState.on('simpower', (simpower) => {
	kettlerUSB.setPower(simpower);
});
// first state
bikeState.setGear(4);

//--- Serial port
var kettlerUSB = new kettlerUSB();
kettlerUSB.on('error', (string) => {
	console.log('error : ' + string);
	io.emit('error', string);
});
kettlerUSB.on('connecting', () => {
	//oled.displayUSB('connecting');
});
kettlerUSB.on('start', () => {
	//oled.displayUSB('connected');
});
kettlerUSB.on('data', (data) => {
	// keep
	bikeState.setData(data);

	// send to html server
	if ('speed' in data)
		io.emit('speed', data.speed.toFixed(1));
	if ('power' in data)
		io.emit('power', data.power);
	if ('hr' in data)
		io.emit('hr', data.hr);
	if ('rpm' in data)
		io.emit('rpm', data.rpm);

	// send to BLE adapter
	kettlerBLE.notifyFTMS(data);
});
kettlerUSB.open();

//--- BLE server
var kettlerBLE = new KettlerBLE(serverCallback);

kettlerBLE.on('advertisingStart', (client) => {
	//oled.displayBLE('Started');
});
kettlerBLE.on('accept', (client) => {
	//oled.displayBLE('Connected');
});
kettlerBLE.on('disconnect', (client) => {
	//oled.displayBLE('Disconnected');
});

function serverCallback(message, ...args) {
	var success = false;
	switch (message) {
	case 'reset':
		console.log('[server.js] - Bike reset');
		kettlerUSB.restart();
		bikeState.restart();
		success = true;
		break;

	case 'control':
		console.log('[server.js] - Bike is under control');
		//oled.setStatus(1);
		bikeState.setControl();
		success = true;
		break;

	case 'power':
		// console.log('[server.js] - Bike in ERG Mode');
		bikeState.setTargetPower(args[0]);
		success = true;
		break;

	case 'simulation': // SIM Mode - calculate power based on physics
		//console.log('[server.js] - Bike in SIM Mode');
		var windspeed = Number(args[0]);
		var grade = Number(args[1]);
		var crr = Number(args[2]);
		var cw = Number(args[3]);
		// console.log('[server.js] - Bike SIM Mode - [wind]: ' + (windspeed * 3.6).toFixed(1) + 'hm/h [grade]: ' + grade.toFixed(1) + '% [crr]: ' + crr + ' [cw]: ' + cw)

		bikeState.setExternalCondition(windspeed, grade, crr, cw);
		// nothing special
		success = true;
		break;
	}
	return success;
};

/**** TEST ***/
/*
setInterval(mafonction, 2000);
setInterval(mafonction2, 4000);
oled.setStatus(1);

bikeState.on('simpower', (simpower) => {
	dataFake.power = simpower;
});
var dataFake = {
	rpm: 80, //+ 20 * (Math.random() - 0.5),
	speed: 20,
	power: 100
};
function mafonction() {
	kettlerUSB.emit('data', dataFake);

	dataFake = {
		rpm: 80 + 20 * (Math.random() - 0.5),
		speed: 20,
		power: 100
	};
};
function mafonction2() {
	var grade = 3; //20 * (Math.random() - 0.5);
	bikeState.setExternalCondition(0, grade, 0.005, 0.39);
};
*/
