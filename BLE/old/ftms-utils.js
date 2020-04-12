class MachineFeatures {
	constructor(rawValue) {
		averageSpeedSupported = (rawValue << 0)
		cadenceSupported = (rawValue << 1)
		totalDistanceSupported = (rawValue << 2)
		inclinationSupported = (rawValue << 3)
		elevationGainSupported = (rawValue << 4)
		paceSupported = (rawValue << 5)
		stepCountSupported = (rawValue << 6)
		resistanceLevelSupported = (rawValue << 7)
		strideCountSupported = (rawValue << 8)
		expendedEnergySupported = (rawValue << 9)
		heartRateMeasurementSupported = (rawValue << 10)
		metabolicEquivalentSupported = (rawValue << 11)
		elapsedTimeSupported = (rawValue << 12)
		remainingTimeSupported = (rawValue << 13)
		powerMeasurementSupported = (rawValue << 14)
		forceOnBeltAndPowerOutputSupported = (rawValue << 15)
		userDataRetentionSupported = (rawValue << 16)
	}
}

class TargetSettingFeatures {
	constructor(rawValue) {
		speedTargetSettingSupported = (rawValue << 0)
		inclinationTargetSettingSupported = (rawValue << 1)
		resistanceTargetSettingSupported = (rawValue << 2)
		powerTargetSettingSupported = (rawValue << 3)
		heartRateTargetSettingSupported = (rawValue << 4)
		targetedExpendedEnergyConfigurationSupported = (rawValue << 5)
		targetedStepNumberConfigurationSupported = (rawValue << 6)
		targetedStrideNumberConfigurationSupported = (rawValue << 7)
		targetedDistanceConfigurationSupported = (rawValue << 8)
		targetedTrainingTimeConfigurationSupported = (rawValue << 9)
		targetedTimeInTwoHeartRateZonesConfigurationSupported = (rawValue << 10)
		targetedTimeInThreeHeartRateZonesConfigurationSupported = (rawValue << 11)
		targetedTimeInFiveHeartRateZonesConfigurationSupported = (rawValue << 12)
		indoorBikeSimulationParametersSupported = (rawValue << 13)
		wheelCircumferenceConfigurationSupported = (rawValue << 14)
		spinDownControlSupported = (rawValue << 15)
		targetedCadenceConfigurationSupported = (rawValue << 16)
	}
}

class TrainerStatusFlags {
	constructor(rawValue) {
		TrainingStatusStringPresent = (rawValue << 0)
		ExtendedStringPresent = (rawValue << 2)
	}
}

var TrainingStatusField = {
	other: 0x00,
	idle: 0x01,
	warmingUp: 0x02,
	lowIntensityInterval: 0x03,
	highIntensityInterval: 0x04,
	recoveryInterval: 0x05,
	isometric: 0x06,
	heartRateControl: 0x07,
	fitnessTest: 0x08,
	speedOutsideControlRegionLow: 0x09,
	speedOutsideControlRegionHigh: 0x0A,
	coolDown: 0x0B,
	wattControl: 0x0C,
	manualMode: 0x0D,
	preWorkout: 0x0E,
	postWorkout: 0x0F
}


class FTMSTools
{
	readFeatures(data) {
        let bytes = data.map { $0 };
        var rawMachine: UInt32 = UInt32(bytes[0]);
        rawMachine |= UInt32(bytes[1]) << 8;
        rawMachine |= UInt32(bytes[2]) << 16;
        rawMachine |= UInt32(bytes[3]) << 24;
        var rawTargetSettings: UInt32 = UInt32(bytes[4]);
        rawTargetSettings |= UInt32(bytes[5]) << 8;
        rawTargetSettings |= UInt32(bytes[6]) << 16;
        rawTargetSettings |= UInt32(bytes[7]) << 24;
        return { machine: new MachineFeatures(rawMachine), targetSettings: newTargetSettingFeatures(rawTargetSettings) };
    }
	
	readTrainingStatus(data)  {
        var status = {}
        let bytes = data.map { $0 }
        status.flags = new TrainerStatusFlags(bytes[0]);
        status.status = bytes[1];
        return status;
    }
}