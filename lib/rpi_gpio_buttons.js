var gpio = require('rpi-gpio');
const EventEmitter = require('events');

var Button = function (portNumber) {
	var state = 0;
	var emitter = new EventEmitter();
	var self = this;
	self.gpio = portNumber;

	gpio.on('change', function (channel, value) {
		if ((value == false) && (channel == self.gpio))// buton down
		{
			emitter.emit('clicked');
		}
	});
	gpio.setup(portNumber, gpio.DIR_HIGH, gpio.EDGE_BOTH);

	// export functions
	return emitter;
};

module.exports = Button
