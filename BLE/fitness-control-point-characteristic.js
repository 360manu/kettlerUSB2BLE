
var Bleno = require('@abandonware/bleno');
var DEBUG = false;

// Spec
// Control point op code
var ControlPointOpCode = {
	requestControl: 0x00,
	resetControl: 0x01,
	setTargetSpeed: 0x02,
	setTargetInclincation: 0x03,
	setTargetResistanceLevel: 0x04,
	setTargetPower: 0x05,
	setTargetHeartRate: 0x06,
	startOrResume: 0x07,
	stopOrPause: 0x08,
	setTargetedExpendedEnergy: 0x09,
	setTargetedNumberOfSteps: 0x0A,
	setTargetedNumberOfStrides: 0x0B,
	setTargetedDistance: 0x0C,
	setTargetedTrainingTime: 0x0D,
	setTargetedTimeInTwoHeartRateZones: 0x0E,
	setTargetedTimeInThreeHeartRateZones: 0x0F,
	setTargetedTimeInFiveHeartRateZones: 0x10,
	setIndoorBikeSimulationParameters: 0x11,
	setWheelCircumference: 0x12,
	spinDownControl: 0x13,
	setTargetedCadence: 0x14,
	responseCode: 0x80
};

var ResultCode = {
	reserved: 0x00,
	success: 0x01,
	opCodeNotSupported: 0x02,
	invalidParameter: 0x03,
	operationFailed: 0x04,
	controlNotPermitted: 0x05
};

class FitnessControlPoint extends Bleno.Characteristic {

	constructor(callback) {
		super({
			uuid: '2AD9',
			value: null,
			properties: ['write'],
			descriptors: [
				new Bleno.Descriptor({
					// Client Characteristic Configuration
					uuid: '2902',
					value: Buffer.alloc(2)
				})
			]
		});

		this.underControl = false;
		if (!callback)
			throw "callback can't be null";
		this.serverCallback = callback;
	}

	// Follow Control Point instruction from the client
	onWriteRequest(data, offset, withoutResponse, callback) {
		var state = data.readUInt8(0);
		switch (state) {
		case ControlPointOpCode.requestControl:
			if (DEBUG)
				console.log('ControlPointOpCode.requestControl.');
			if (!this.underControl) {
				if (this.serverCallback('control')) {
					if (DEBUG)
						console.log('control succeed.');
					this.underControl = true;
					callback(this.buildResponse(state, ResultCode.success)); // ok
				} else {
					if (DEBUG)
						console.log('control aborted.');
					callback(this.buildResponse(state, ResultCode.operationFailed));
				}
			} else {
				if (DEBUG)
					console.log('allready controled.');
				callback(this.buildResponse(state, ResultCode.controlNotPermitted));
			}
			break;

		case ControlPointOpCode.resetControl:
			if (DEBUG)
				console.log('ControlPointOpCode.resetControl.');
			if (this.underControl) {
				// reset the bike
				if (this.serverCallback('reset')) {
					this.underControl = false;
					callback(this.buildResponse(state, ResultCode.success)); // ok
				} else {
					if (DEBUG)
						console.log('control reset controled.');
					callback(this.buildResponse(state, ResultCode.operationFailed));
				}
			} else {
				if (DEBUG)
					console.log('reset without control.');
				callback(this.buildResponse(state, ResultCode.controlNotPermitted));
			}
			break;

		case ControlPointOpCode.setTargetPower:
			if (DEBUG)
				console.log('ControlPointOpCode.setTargetPower.');
			if (this.underControl) {
				var watt = data.readUInt16LE(1);
				if (DEBUG)
					console.log('watt : ' + watt);
				if (this.serverCallback('power', watt)) {
					callback(this.buildResponse(state, ResultCode.success)); // ok
				} else {
					if (DEBUG)
						console.log('setTarget failed');
					callback(this.buildResponse(state, ResultCode.operationFailed));
				}
			} else {
				if (DEBUG)
					console.log('setTargetPower without control.');
				callback(this.buildResponse(state, ResultCode.controlNotPermitted));
			}
			break;

		case ControlPointOpCode.startOrResume:
			if (DEBUG)
				console.log('ControlPointOpCode.startOrResume');
			callback(this.buildResponse(state, ResultCode.success));
			break;

		case ControlPointOpCode.stopOrPause:
			if (DEBUG)
				console.log('ControlPointOpCode.stopOrPause');
			callback(this.buildResponse(state, ResultCode.success));
			break;

		case ControlPointOpCode.setIndoorBikeSimulationParameters:
			if (DEBUG)
				console.log('ControlPointOpCode.setIndoorBikeSimulationParameters');
			var windspeed = data.readInt16LE(1) * 0.001;
			var grade = data.readInt16LE(3) * 0.01;
			var crr = data.readUInt8(5) * 0.0001;
			var cw = data.readUInt8(6) * 0.01;
			if (this.serverCallback('simulation', windspeed, grade, crr, cw)) {
				callback(this.buildResponse(state, ResultCode.success));
			} else {
				if (DEBUG)
					console.log('[fitness-control-point-characteristic.js] - simulation failed');
				callback(this.buildResponse(state, ResultCode.operationFailed));
			}
			break;

		default: // anything else : not yet implemented
			if (DEBUG)
				console.log('State is not supported ' + state + '.');
			callback(this.buildResponse(state, ResultCode.opCodeNotSupported));
			break;
		}
	};

	// Return the result message
	buildResponse(opCode, resultCode) {
		var buffer = new Buffer(3);
		buffer.writeUInt8(0x80, 0);
		buffer.writeUInt8(opCode, 1);
		buffer.writeUInt8(resultCode, 2);
		return buffer;
	};

};

module.exports = FitnessControlPoint;
