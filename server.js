var express = require('express');
var kettlerUSB = require('./kettlerUSB');
var KettlerBLE = require('./BLE/kettlerBLE');
var DEBUG = false;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
	res.render('index');
});

server = app.listen(3000, function () {
		if (DEBUG)
			console.log('Kettler app listening on port 3000!');
	});

//socket.io instantiation
const io = require("socket.io")(server);
var kettlerUSB = new kettlerUSB();
var kettlerBLE = new KettlerBLE(serverCallback);
var kettlerObs = kettlerUSB.open();

/* Web server callback */
io.on('connection', (socket) => {
	if (DEBUG)
		console.log('connected to socketio');

	socket.on('reset', function (data) {
		io.sockets.emit('raw', "connected");
	});

	socket.on('restart', function (data) {
		if (DEBUG)
			console.log('restart');
		kettlerUSB.restart();
		io.sockets.emit('raw', "connected");
	});
});

/* Bike information transfer to BLE & Webserver */
kettlerObs.on('error', (string) => {
	if (DEBUG)
		console.log('error' + string);
	io.emit('error', string);
});

kettlerObs.on('data', (data) => {
	if (DEBUG)
		console.log('data' + JSON.stringify(data));
	// send to html server
	if ('speed' in data)
		io.emit('speed', data.speed);
	if ('power' in data)
		io.emit('power', data.power);
	if ('hr' in data)
		io.emit('hr', data.hr);
	// send to BLE adapter
	kettlerBLE.notifyFTMS(data);
});

kettlerObs.on('key', (string) => {
	if (DEBUG)
		console.log('key' + string);
});

kettlerObs.on('raw', (string) => {
	if (DEBUG)
		console.log('raw' + string);
	io.emit('raw', string);
});

/* BLE callback section */
function serverCallback(message, ...args) {
	var success = false;
	switch (message) {
	case 'reset':
		if (DEBUG)
			console.log('Bike Reset');
		io.emit('raw', "Bike Reset");
		kettlerUSB.restart();
		success = true;
		break;
	case 'control':
		if (DEBUG)
			console.log('Bike control');
		io.emit('raw', "Bike control");
		// nothing special
		success = true;
		break;
	case 'power':
		if (DEBUG)
			console.log('Bike set Power');
		if (args.length > 0) {
			var watt = args[0];
			kettlerUSB.setPower(watt);
			io.emit('raw', "Bike : set Power to " + watt);
			success = true;
		}
		break;
	}
	return success;
};

// GO
kettlerUSB.start();
