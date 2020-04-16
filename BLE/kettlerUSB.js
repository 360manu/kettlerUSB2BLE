var $q = require('q');
var EventEmitter = require('events').EventEmitter;
var SerialPort = require('serialport');
var DEBUG = true;
var MOCKDEBUG = false;

const Readline = SerialPort.parsers.Readline;
const EOL = '\r\n'; // CRLF
var portName = '/dev/ttyUSB0';

if (MOCKDEBUG) {
	const Mock = require('@serialport/binding-mock');
	SerialPort.Binding = Mock;
	portName = '/dev/ROBOT';
	Mock.createPort(portName, {
		echo: true
	});
}

class kettlerUSB extends EventEmitter {
	constructor() {
		console.log('[KettlerUSB] constructor');
		super();
		this.msg = ["VE", "ID", "VE", "KI", "CA", "RS", "CM", "SP1"];
		//start at -1
		this.writePower = false;
		this.power = -1;
	};

	directWrite(data) {
		if (DEBUG)
			console.log('[KettlerUSB] write : ' + data);
		this.port.write(data + EOL);
	};

	async readAndDispatch(data) {

		if (typeof data != "string") {
			console.log('[KettlerUSB] strange data');
			console.log(data);
			return;
		}

		if (DEBUG) {
			if (MOCKDEBUG) {
				if (data == 'ST' || data.startsWith('PW'))
					data = '101\t85\t35\t002\t' + this.power + '\t300\t01:12\t' + this.power;
			}
			if (this.last == null)
				this.last = Date.now();
			console.log('[KettlerUSB] read [' + (Date.now() - this.last) + '] :  ' + data);
			this.last = Date.now();
		}

		var states = data.split('\t');

		// Analyse le retour de ST
		//      101     047     074    002     025      0312    01:12   025
		//info: 1       2       3       4       5       6       7       8
		//1: heart rate as bpm (beats per minute)
		//2: rpm (revolutions per minute)
		//3: speed as 10*km/h -> 074=7.4 km/h
		//4: distance in 100m steps
		//   in non-PC mode: either counting down or up, depending on program
		//   in PC mode: can be set with "pd x[100m]", counting up
		//5: power in Watt, may be configured in PC mode with "pw x[Watt]"
		//6: energy in kJoule (display on trainer may be kcal, note kcal = kJ * 0.2388)
		//   in non-PC mode: either counting down or up, depending on program
		//   in PC mode: can be set with "pe x[kJ]", counting up
		//7: time minutes:seconds,
		//   in non-PC mode: either counting down or up, depending on program
		//   in PC mode: can be set with "pt mmss", counting up
		//8: current power on eddy current brake
		if (states.length == 8) {
			var dataOut = {};
			// puissance
			var power = parseInt(states[7]);
			if (!isNaN(power)) {
				dataOut.power = power;
			}

			// speed
			var speed = parseInt(states[2]);
			if (!isNaN(speed)) {
				dataOut.speed = speed * 0.1;
			}

			// cadence
			var cadence = parseInt(states[1]);
			if (!isNaN(cadence)) {
				dataOut.cadence = cadence;
			}

			// HR
			var hr = parseInt(states[0]);
			if (!isNaN(hr)) {
				dataOut.hr = hr;
			}

			// rpm
			var rpm = parseInt(states[1]);
			if (!isNaN(rpm)) {
				dataOut.rpm = rpm;
			}

			if (Object.keys(data).length > 0)
				this.emit('data', dataOut);
		}
		//                command: es 1
		// Le dernier chiffre semble etre une touche
		//response: 00      0       0       175
		else if (states.length == 4) {
			// key
			var key = parseInt(states[3]);
			if (!isNaN(key)) {
				this.emit('key', key);
			}
		} else {
			if (DEBUG)
				console.log('[KettlerUSB] Unrecognized packet');
		}
	};

	// Open COM port
	open() {
		console.log('[KettlerUSB] open');
		this.emit('connecting');
		// create and open a Serial port
		this.port = new SerialPort(portName, {
				baudRate: 9600,
				autoOpen: false
			});
		this.parser = this.port.pipe(new Readline({
					delimiter: '\r\n'
				}));
		this.parser.on('data', (data) => this.readAndDispatch(data));

		// try open
		this.internalOpen();

		this.port.on('open', () => {
			// read state
			// inform it's ok
			this.emit('open');

			// Je sais pas trop ce que ça fait mais ça initialise la bete
			this.init();
			this.port.drain();
			this.emit('start');

			// start polling in 3s for the state
			setTimeout(() => this.askState(), 3000);
		});

		this.port.on('close', () => {
			console.log('closing');
		});
	};

	internalOpen() {
		this.port.open((err) => {
			if (!err)
				return;
			console.log('[KettlerUSB] port is not open, retry in 10s');
			setTimeout(() => this.internalOpen(), 10000);
		});
	};

	// let's initialize com with the bike

	init() {
		if (this.msg.length == 0)
			return;
		var m = this.msg.shift();
		this.directWrite(m);
		setTimeout(() => this.init(), 150);
	};

	// require state from the bike
	askState() {
		if (this.writePower) {
			this.directWrite("PW" + this.power.toString());
			this.writePower = false;
		} else {
			this.directWrite("ST");
		}
		// call back later
		setTimeout(() => this.askState(), 2000);
	}

	// restart a connection
	restart() {
		if (this.port.isOpen) {
			this.stop();
			this.port.close();
			this.emit('stop');
		}
		setTimeout(() => this.open(), 10000);
	}

	// Stop the port
	stop() {
		// fermeture
		this.directWrite("VE");
		this.directWrite("ID");
		this.directWrite("VE");
	};

	// set the bike power resistance
	setPower(power) {
		var p = parseInt(Math.max(0, power), 10);
		if (p != this.power) {
			this.power = p;
			this.writePower = true;
		}
	};
};

module.exports = kettlerUSB
