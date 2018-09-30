var $q = require('q');
var EventEmitter = require('events').EventEmitter;
var com = require('serialport');
var DEBUG = false;

function kettlerUSB() {
    var self = this;
    self.port = null;
    self.pending = [];
    self.writer = null;
    self.reader = null;
	self.emitter = new EventEmitter();
    var EOL = '\r\n'; // CRLF 
	
    this.write = function (string) {
      self.pending.push(string);
    };

    this.flushNext = function () {
      if (self.pending.length == 0) {
        return;
      }
      var string = self.pending.shift();
      if (self.port) {
          var buffer = new Buffer(string + EOL);
          if (DEBUG) console.log('[OUT]: ' + buffer);
          self.port.write(buffer);
      } else {
          if (DEBUG) console.log('Communication port is not open - not sending data: ' + string);
      }
    };
	
	// require state from the bike
	this.askState = function () {
		self.write("ST");
	}

    this.readAndDispatch = function (string) {
        if (DEBUG) 
		{
			console.log('[IN]: ' + string);
			self.emitter.emit('raw', string ); 
		}
		
		var states = string.split('\t');
		
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
		if (states.length == 8)
		{
			var data = {};
			// puissance
			var power = parseInt(states[7]);
			if (!isNaN(power)) { data.power = power; }

			// speed
			var speed = parseInt(states[2]);
			if (!isNaN(speed)) { data.speed = speed * 0.1; }

			// cadence
			var cadence = parseInt(states[1]);
			if (!isNaN(cadence)) { data.cadence = cadence; }

			// HR
			var hr = parseInt(states[0]);
			if (!isNaN(hr)) { data.hr = hr; }
			
			// rpm
			var rpm = parseInt(states[1]);
			if (!isNaN(rpm)) { data.rpm = rpm;}
			
			if (Object.keys(data).length > 0)
				 self.emitter.emit('data', data); 
		}
		//                command: es 1
		// Le dernier chiffre semble etre une touche
		//response: 00      0       0       175  
		else if (states.length == 4)
		{
			 // key
			var key = parseInt(states[3]);
			if (!isNaN(key)) { self.emitter.emit('key', key); }
		}
		else
		{
			self.unknownHandler(string);
		}
    };

    // handlers start
    this.unknownHandler = function (string) {
        if (DEBUG) console.log('Unrecognized packet: ' + string);
		self.emitter.emit('error', string);
    };
	
	this.open = function () {
		com.list(function (err, ports) {
			if (err) {
				throw err;
			}
			ports.forEach(function (p) {
				if (DEBUG) console.log(p.vendorId +"  " + p.productId );
				// kettler ?
				if (p.vendorId == '0x10c4' && p.productId == '0xea60') {
					if (DEBUG) console.log("Kettler found on port " + p.comName);
					var port = new com.SerialPort(p.comName, {
						baudrate: 9600,
						parser: com.parsers.readline('\r\n')
					}, false);
					port.open(function () {
						self.port = port;
						port.on('data', self.readAndDispatch);
						// we can only write one message every 100 ms
						self.writer = setInterval(self.flushNext, 100);
						// read state
						self.reader = setInterval(self.askState, 3000);
					});
				}
			});	 
		});
		return self.emitter;
	};
	
	
	this.start = function () {
		// Je sais pas trop ce que ça fait mais ça initialise la bete
		self.write("VE");
		self.write("ID"); // l"id du racer, ça retoure un truc genre SGSXXX
		self.write("VE");
		self.write("KI"); // doit repondre Ergorace
		self.write("CA");
		 // init
        self.write("RS"); // reset
        self.write("CM"); // command mode
        self.write("SP1"); // manu = 1 , sinon 0 à 4 (0 = invité)
	};
	
	this.stop = function () {
	    // fermeture
        self.write("VE");
        self.write("ID");
        self.write("VE");

		self.pending = [];
		if (self.writer) {
			clearInterval(self.writer);
		}
		if (self.reader) {
			clearInterval(self.reader);
		}
	};
	
	// set the bike power resistance
	this.setPower = function (power) {
	    self.write("PW"+power.toString());
	};
	
	// to string
	this.toString = function () {
		return "Kettler on " + self.port.comName;
	};

}

module.exports = kettlerUSB
