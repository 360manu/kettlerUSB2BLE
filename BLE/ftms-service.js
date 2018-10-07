// Doc: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.fitness_machine.xml
const Bleno = require('bleno');

const FitnessControlPoint = require('./fitness-control-point-characteristic');
const IndoorBikeDataCharacteristic = require('./indoor-bike-data-characteristic');
const StaticReadCharacteristic = require('./static-read-characteristic');

class FitnessMachineService extends Bleno.PrimaryService {

	constructor(callback) {
		
		let controlPoint = new FitnessControlPoint(callback);
		let indoorBikeData = new IndoorBikeDataCharacteristic();
		
		super({
			uuid: '1826',
			characteristics: [
				new StaticReadCharacteristic('2ACC', 'Fitness Machine Feature', [0x00, 0x44, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00]), // Feature Characteristics
				controlPoint,
				indoorBikeData,
				new StaticReadCharacteristic('2AD8', 'SupportedPowerRange', [0x00, 0x32, 0x58, 0x02, 0x00, 0x05]), // SupportedPowerRange (50 - 600 with 5watts step)
			]
		});  

		this.indoorBikeData = indoorBikeData;
	}

	/*
	 * Transfer event from Kettler USB to the given characteristics
	 */
	notify(event) {
		this.indoorBikeData.notify(event);
	};
	
	 
}

module.exports = FitnessMachineService;
