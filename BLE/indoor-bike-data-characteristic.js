var Bleno = require('bleno');
var DEBUG = false;

class IndoorBikeDataCharacteristic extends Bleno.Characteristic {

	constructor() {
		super({
			uuid: '2AD2',
			value: null,
			properties: ['notify'],
			descriptors: [
				new Bleno.Descriptor({
					// Client Characteristic Configuration
					uuid: '2902',
					value: Buffer.alloc(2)
				})
			]
		});
		this._updateValueCallback = null;
	}

	onSubscribe(maxValueSize, updateValueCallback) {
		if (DEBUG) console.log('[IndoorBikeDataCharacteristic] client subscribed');
		this._updateValueCallback = updateValueCallback;
		return this.RESULT_SUCCESS;
	};

	onUnsubscribe() {
		if (DEBUG) console.log('[IndoorBikeDataCharacteristic] client unsubscribed');
		this._updateValueCallback = null;
		return this.RESULT_UNLIKELY_ERROR;
	};

	notify(event) {
		if (!('power' in event) && !('hr' in event)) {
			// ignore events with no power and no hr data
			return this.RESULT_SUCCESS; 
		}
		if (DEBUG) console.log("notify");
		var buffer = new Buffer(10);
		// speed + power + heart rate
		buffer.writeUInt8(0x44, 0);
		buffer.writeUInt8(0x02, 1);

		var index = 2;
		if ('speed' in event) {
			var speed = parseInt(event.speed * 100);
			if (DEBUG) console.log("speed: " + speed);
			buffer.writeInt16LE(speed, index);
			index += 2;
		}
		
		if ('rpm' in event) {
			var rpm = event.rpm;
			if (DEBUG) console.log("rpm: " + rpm);
			buffer.writeInt16LE(rpm * 2, index);
			index += 2;
		}
		
		if ('power' in event) {
			var power = event.power;
			if (DEBUG) console.log("power: " + power);
			buffer.writeInt16LE(power, index);
			index += 2;
		}

		if ('hr' in event) {
			var hr = event.hr;
			if (DEBUG) console.log("hr : " + hr);
			buffer.writeUInt16LE(hr, index);
			index += 2;
		}

		if (this._updateValueCallback) {
			this._updateValueCallback(buffer);
		}
		else
		{
			if (DEBUG) console.log("nobody is listening");
		}
		return this.RESULT_SUCCESS;
	}

};

module.exports = IndoorBikeDataCharacteristic;
