// Doc: https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.service.fitness_machine.xml
const Bleno = require('bleno');

const MachineStatusCharacteristic = require('./machine-status-characteristic');
const TrainingStatusCharacteristic = require('./training-status-characteristic');
const IndoorBikeDataCharacteristic = require('./indoor-bike-data-characteristic');
const StaticReadCharacteristic = require('./static-read-characteristic');

class FitnessMachineService extends Bleno.PrimaryService {

	constructor() {
		let machineStatus = new MachineStatusCharacteristic();
		let trainingStatus = new TrainingStatusCharacteristic();
		let indoorBikeData = new IndoorBikeDataCharacteristic();
		super({
			uuid: '1826',
			characteristics: [
				new StaticReadCharacteristic('2ACC', 'Feature', [17408, 0]), // Feature Characteristics
				new StaticReadCharacteristic('2AD9', 'ControlPoint', [0x08, 0, 0, 0]), // Control Point Characteristics
				
				machineStatus,
				trainingStatus,
				
				new StaticReadCharacteristic('2ACD', 'TreadmillData', [0]), // TreadmillData
				new StaticReadCharacteristic('2ACE', 'CrossTrainerData', [0]), // CrossTrainerData
				new StaticReadCharacteristic('2ACF', 'StepClimberData', [0]), // StepClimberData
				new StaticReadCharacteristic('2AD0', 'StairClimberData', [0]), // StairClimberData
				new StaticReadCharacteristic('2AD1', 'RowerData', [0]), // RowerData
				indoorBikeData,

				new StaticReadCharacteristic('2AD4', 'SupportedSpeedRange', [0]), // SupportedSpeedRange
				new StaticReadCharacteristic('2AD5', 'SupportedInclinationRange', [0]), // SupportedInclinationRange
				new StaticReadCharacteristic('2AD6', 'SupportedResistanceLevelRange', [0]), // SupportedResistanceLevelRange
				new StaticReadCharacteristic('2AD8', 'SupportedPowerRange', [0]), // SupportedPowerRange
				new StaticReadCharacteristic('2AD7', 'SupportedHeartRateRange', [0]) // SupportedHeartRateRange
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
