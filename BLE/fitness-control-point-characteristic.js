
var Bleno = require('bleno');

// Spec
 
class FitnessControlPoint extends  Bleno.Characteristic {
 
  constructor() {
    super({
      uuid: '2AD9',
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
    console.log('[FitnessControlPoint] client subscribed to PM');
    this._updateValueCallback = updateValueCallback;
    return this.RESULT_SUCCESS;
  };

  onUnsubscribe() {
    console.log('[FitnessControlPoint] client unsubscribed from PM');
    this._updateValueCallback = null;
    return this.RESULT_UNLIKELY_ERROR;
  };
  
 
};

module.exports = FitnessControlPoint;
