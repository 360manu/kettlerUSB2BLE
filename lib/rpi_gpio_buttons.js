var gpio = require('rpi-gpio');
const EventEmitter = require('events');

var Button = function () {
	var state = 0;
	var emitter = new EventEmitter();

	gpio.on('change', function (channel, value) {
		checkButton(value);
	});
	gpio.setup(7, gpio.DIR_IN, gpio.EDGE_BOTH);

	function checkButton(value) {
		if (value == false) {
			if (state == 0) {
				state = 1;
				setTimeout(function () {
					if (state == 0)
						console.log('error');
					if (state == 1)
						emitter.emit('clicked');
					if (state == 2)
						emitter.emit('double_clicked');
					state = 0;
				}, 1000);
				return;
			}
			if (state == 1) {
				state = 2;
				return;
			}
		}
	};
	
	// export functions
	return emitter;
};

module.exports = Button
