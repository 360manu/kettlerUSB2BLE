var express = require('express');
var kettlerUSB = require('./kettlerUSB');
var KettlerBLE = require('./BLE/kettlerBLE');
var DEBUG = false;
var BikeState = require('./BikeState');
var Oled = require('./OledInfo');

/* Web Server on port 3000 for inspecting the Kettler State */
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.get('/', function (req, res) { 	res.render('index'); });
server = app.listen(3000, function () { console.log('Kettler app listening on port 3000!'); });

// socket.io instantiation
const io = require("socket.io")(server);
var kettlerUSB = new kettlerUSB();
var kettlerBLE = new KettlerBLE(serverCallback);
var bikeState = new BikeState();
var oled = new Oled();

// go
var kettlerObs = kettlerUSB.open();

// Web server callback
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
// end WebServer

// un peu de retour serveur  
bikeState.on('mode', (mode) => {
	io.emit('mode', mode);
});
bikeState.on('gear', (gear) => {
	io.emit('gear', gear);
	oled.displayGear(gear);
});
bikeState.on('grade', (grade) => {
	io.emit('grade', grade + '%');
	oled.displayGrade(grade);
});
bikeState.on('windspeed', (windspeed) => {
	io.emit('windspeed', windspeed);
});
bikeState.on('simpower', (simpower) => {
	kettlerUSB.setPower(simpower);
});

/* BRIDGE : Kettler USB infor to BLE peripheral & Webserver */
kettlerObs.on('error', (string) => {
	console.log('error' + string);
	io.emit('error', string);
});

kettlerObs.on('data', (data) => {
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

// End Bridge

// BLE FTMS to Bike & Server
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
		bikeState.setControl();
		success = true;
		break;

	case 'power':
		console.log('[server.js] - Bike in ERG Mode');
		bikeState.setTargetPower(args[0]);
		success = true;
		break;

	case 'simulation': // SIM Mode - calculate power based on physics
		//console.log('[server.js] - Bike in SIM Mode');
		var windspeed = Number(args[0]);
		var grade = Number(args[1]);
		var crr = Number(args[2]);
		var cw = Number(args[3]);
		console.log('[server.js] - Bike SIM Mode - [wind]: ' + (windspeed*3.6).toFixed(1) + 'hm/h [grade]: ' + grade.toFixed(1) + '% [crr]: ' + crr + ' [cw]: ' + cw)

		bikeState.setExternalCondition(windspeed, grade, crr, cw);
		// nothing special
		success = true;
		break;
	}

	return success;
};

// GO
kettlerUSB.start();
