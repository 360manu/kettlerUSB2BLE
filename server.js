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
	if (DEBUG) console.log('Kettler app listening on port 3000!')
});

//socket.io instantiation
const io = require("socket.io")(server);

//listen on every connection
io.on('connection', (socket) => {
	if (DEBUG) console.log('connected to socketio')
	socket.on('reset', function (data) {
		io.sockets.emit('raw',  "connected" );
	});
});

var kettler = new kettlerUSB();
var kettlerObs = kettler.open();
var ble = new KettlerBLE();

kettlerObs.on('error', (string) => {
	if (DEBUG) console.log('error' + string);
	io.emit('error', string);
});

kettlerObs.on('data', (data) => {
	if (DEBUG) console.log('data' + JSON.stringify(data));
	// send to html server
	if ('speed' in data) 
		io.emit('speed', data.speed);
	if ('power' in data) 
		io.emit('power', data.power);
	if ('hr' in data) 
		io.emit('hr', data.hr);
	// send to BLE adapter
	ble.notifyFTMS(data);
});

kettlerObs.on('key', (string) => {
	if (DEBUG) console.log('key' + string);
});

kettlerObs.on('raw', (string) => {
	if (DEBUG) console.log('raw' + string);
	io.emit('raw', string);
});

/* // test
var count = 0;  
setInterval(function() {  
  count++;
  var data = {};
  data.power = 150 + count * 5;
  data.rpm = 82;
  data.hr = 120;
  data.speed = 35.30;
  ble.notifyFTMS(data);
}, 3000);
 */
kettler.start();
