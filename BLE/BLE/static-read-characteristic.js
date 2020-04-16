const Bleno = require('@abandonware/bleno');

class StaticReadCharacteristic extends Bleno.Characteristic {
	constructor(uuid, description, value) {
		super({
			uuid: uuid,
			properties: ['read'],
			value: null,
			descriptors: [
				new Bleno.Descriptor({
					uuid: '2901',
					value: description
				})
			]
		});
		this.uuid = uuid;
		this.description = description;
		this._value = Buffer.isBuffer(value) ? value : new Buffer(value);
	}
	
	onReadRequest(offset, callback) {
		console.log('OnReadRequest : ' + this.description);
		callback(this.RESULT_SUCCESS, this._value.slice(offset, this._value.length));
	};
}

module.exports = StaticReadCharacteristic;