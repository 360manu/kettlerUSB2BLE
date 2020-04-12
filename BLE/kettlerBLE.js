const bleno = require('@abandonware/bleno');
const EventEmitter = require('events');
const CyclingPowerService = require('./cycling-power-service');
const FitnessMachineService = require('./ftms-service');

class KettlerBLE extends EventEmitter {

	constructor(serverCallback) {
		super();

		this.name = "KettlerBLE";
		process.env['BLENO_DEVICE_NAME'] = this.name; 

		this.csp = new CyclingPowerService();
		this.ftms = new FitnessMachineService(serverCallback); 

		let self = this;
		console.log(`[${this.name} starting]`);

		bleno.on('stateChange', (state) => {
			console.log(`[${this.name} stateChange] new state: ${state}`);
			
			self.emit('stateChange', state);

			if (state === 'poweredOn') {
				bleno.startAdvertising(self.name, [self.csp.uuid
				, self.ftms.uuid
				]);
			} else {
				console.log('Stopping...');
				bleno.stopAdvertising();
			}
		});

		bleno.on('advertisingStart', (error) => {
			console.log(`[${this.name} advertisingStart] ${(error ? 'error ' + error : 'success')}`);
			self.emit('advertisingStart', error);

			if (!error) {
				bleno.setServices([self.csp
				, self.ftms
				], 
				(error) => {
					console.log(`[${this.name} setServices] ${(error ? 'error ' + error : 'success')}`);
				});
			}
		});

		bleno.on('advertisingStartError', () => {
			console.log(`[${this.name} advertisingStartError] advertising stopped`);
			self.emit('advertisingStartError');
		});

		bleno.on('advertisingStop', error => {
			console.log(`[${this.name} advertisingStop] ${(error ? 'error ' + error : 'success')}`);
			self.emit('advertisingStop');
		});

		bleno.on('servicesSet', error => {
			console.log(`[${this.name} servicesSet] ${ (error) ? 'error ' + error : 'success'}`);
		});

		bleno.on('accept', (clientAddress) => {
			console.log(`[${this.name} accept] Client: ${clientAddress}`);
			self.emit('accept', clientAddress);
			bleno.updateRssi();
		});

		bleno.on('rssiUpdate', (rssi) => {
			console.log(`[${this.name} rssiUpdate]: ${rssi}`);
		});

	}

	// notifiy BLE services
	notifyFTMS(event) {
		this.csp.notify(event);
		this.ftms.notify(event);
	};
	
 

};

module.exports = KettlerBLE;