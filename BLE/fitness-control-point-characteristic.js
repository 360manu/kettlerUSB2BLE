
var Bleno = require('bleno');
var DEBUG = true;

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
			console.log('ControlPointOpCode.requestControl.');
			if (!this.underControl) {
				if (this.serverCallback('control')) {
					console.log('control succeed.');
					this.underControl = true;
					callback(this.buildResponse(state, ResultCode.success)); // ok
				} else {
					console.log('control aborted.');
					callback(this.buildResponse(state, ResultCode.operationFailed));
				}
			} else {
				console.log('allready controled.');
				callback(this.buildResponse(state, ResultCode.controlNotPermitted));
			}
			break;

		case ControlPointOpCode.resetControl:
			console.log('ControlPointOpCode.resetControl.');
			if (this.underControl) {
				// reset the bike
				if (this.serverCallback('reset')) {
					this.underControl = false;
					callback(this.buildResponse(state, ResultCode.success)); // ok
				} else {
					console.log('control reset controled.');
					callback(this.buildResponse(state, ResultCode.operationFailed));
				}
			} else {
				console.log('reset without control.');
				callback(this.buildResponse(state, ResultCode.controlNotPermitted));
			}
			break;

		case ControlPointOpCode.setTargetPower:
			console.log('ControlPointOpCode.setTargetPower.');
			if (this.underControl) {
				var watt = data.readUInt16LE(1);
				console.log('watt : ' + watt);
				if (this.serverCallback('power', watt)) {
					callback(this.buildResponse(state, ResultCode.success)); // ok
				} else {
					console.log('setTarget failed');
					callback(this.buildResponse(state, ResultCode.operationFailed));
				}
			} else {
				console.log('setTargetPower without control.');
				callback(this.buildResponse(state, ResultCode.controlNotPermitted));
			}

			break;
		case ControlPointOpCode.startOrResume:
			console.log('ControlPointOpCode.startOrResume');
			callback(this.buildResponse(state, ResultCode.success));
			break;
		case ControlPointOpCode.stopOrPause:
			console.log('ControlPointOpCode.stopOrPause');
			callback(this.buildResponse(state, ResultCode.success));
			break;
		case ControlPointOpCode.setIndoorBikeSimulationParameters:
			console.log('ControlPointOpCode.setIndoorBikeSimulationParameters');
			callback(this.buildResponse(state, ResultCode.success));
			break;
		default: // anything else : not yet implemented
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
