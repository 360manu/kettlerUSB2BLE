/*
 * clock.js
 * Display a digital clock on a small I2C connected display
 *
 * 2016-11-28 v1.0 Harald Kubota
 */

"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1,
// however on other platforms you may need to adjust if to
// another value, for example 0.
var bus = 1;

var i2c = require('i2c-bus'),
i2cBus = i2c.openSync(bus),
oled = require('oled-i2c-bus');
var font = require('oled-font-5x7');

const SIZE_X = 128,
SIZE_Y = 64;

var opts = {
	width: SIZE_X,
	height: SIZE_Y,
	address: 0x3C
};

class Oled {

	constructor() {
		try {
			this.oled = new oled(i2cBus, opts);

			this.oled.clearDisplay();
			this.oled.turnOnDisplay();

			this.oled.drawPixel([
					[SIZE_X - 1, 0, 1],
					[SIZE_X - 1, SIZE_Y - 1, 1],
					[0, SIZE_Y - 1, 1],
					[0, 0, 1]
				]);

			this.oled.drawLine(1, 1, SIZE_X - 2, 1, 1);
			this.oled.drawLine(SIZE_X - 2, 1, SIZE_X - 2, SIZE_Y - 2, 1);
			this.oled.drawLine(SIZE_X - 2, SIZE_Y - 2, 1, SIZE_Y - 2, 1);
			this.oled.drawLine(1, SIZE_Y - 2, 1, 1, 1);
		} catch (err) {
			// Print an error message a
			console.log(err.message);
		}
	};

	// Gear
	displayGear(gear) {
		// Location fits 128x64 OLED
		this.oled.setCursor(80, 5);
		this.oled.writeString(font, 1, 'Gear', 1, true);
		this.oled.setCursor(80, 20);
		this.oled.writeString(font, 2, gear.toString(), 1, true);
	}

	// Gear
	displayGrade(grade) {
		// Location fits 128x64 OLED
		this.oled.setCursor(20, 5);
		this.oled.writeString(font, 1, 'pente', 1, true);
		this.oled.setCursor(20, 20);
		this.oled.writeString(font, 2, grade.toString() + '%', 1, true);
	}
}
module.exports = Oled
