const Bleno = require('@abandonware/bleno');

const CyclingPowerMeasurementCharacteristic = require('./cycling-power-measurement-characteristic');
const StaticReadCharacteristic = require('./static-read-characteristic');

// https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.cycling_power.xml
class CyclingPowerService extends Bleno.PrimaryService {

  constructor() {
    let powerMeasurement = new CyclingPowerMeasurementCharacteristic();
    super({
        // uuid: '1818',
		uuid: '1515',
        characteristics: [
          powerMeasurement,
          new StaticReadCharacteristic('2A65', 'Cycling Power Feature', [0x08, 0, 0, 0]), // 0x08 - crank revolutions
          new StaticReadCharacteristic('2A5D', 'Sensor Location', [13])         // 13 = rear hub
        ]
    });

    this.powerMeasurement = powerMeasurement;
  }

  notify(event) {
    this.powerMeasurement.notify(event);
    return this.RESULT_SUCCESS;
  };
}

module.exports = CyclingPowerService;
