
const EventEmitter = require('events');
var DEBUG = false;

var minGear = 1;
var maxGear = 11;
var gearbox = [1.2, 1.79, 2.00, 2.17, 2.38, 2.63, 2.94, 3.33, 3.57, 3.85, 4.17, 4.55];
var ratioLow = 1.36;
var ratioHigh = 0.16765;
var circumference = 211.5;

var slopeRange = [-15, -10, -5, 0, 5, 10, 15, 20, 25];
var rpmRange = [60, 70, 80, 90, 100, 110];

var powerCurve = [[100, 120, 140, 160, 180, 200],
	[125, 150, 175, 200, 225, 250],
	[150, 180, 210, 240, 270, 300],
	[175, 210, 245, 280, 315, 350],
	[200, 240, 280, 320, 360, 400],
	[225, 270, 315, 360, 404, 449],
	[250, 300, 349, 399, 449, 499],
	[275, 329, 384, 439, 494, 549],
	[299, 359, 419, 479, 539, 599]];

class BikeState extends EventEmitter {

	constructor() {
		super();
		console.log(`[BikeState starting]`);

		// init
		this.data = null;
		this.external = null;
		this.mode = 'ERG'; // ERG ou SIM
		this.gear = 4;
	};

	// Restart the trainer
	restart() {
		this.mode = 'ERG'; // ERG ou SIM
		this.emit('mode', this.mode);
		// update and compute
		this.data = null;
	};

	// Set the bike under the FTMS control
	setControl() {};

	// Current state
	setData(data) {
		this.data = data;
		// update
		this.compute();
	};

	// Gear Up
	GearUp() {
		this.gear++;
		if (this.gear > maxGear)
			this.gear = maxGear;
		this.emit('gear', this.gear);
	};

	// Gear Down
	GearDown() {
		this.gear--;
		if (this.gear < minGear)
			this.gear = minGear;
		this.emit('gear', this.gear);
	};

	/* Puissance a atteindre */
	setTargetPower(power) {
		this.mode = 'ERG'; // ERG
		this.emit('mode', this.mode);
		// update and compute
		if (this.data == null)
			return;
		this.data.power = power;
		this.emit('simpower', this.data.power);
	};

	/* Modifie la puissance target */
	addPower(increment) {
		if (this.data == null)
			return;
		this.data.power += increment;
		// update and compute
		this.emit('simpower', this.data.power);
	};

	/* Mode Simulation : les conditions externes a simuler */
	setExternalCondition(windspeed, grade, crr, cw) {
		this.mode = 'SIM'; // ERG ou SIM
		this.emit('mode', this.mode);
		this.external = {
			windspeed: windspeed,
			grade: grade,
			crr: crr,
			cw: cw
		};
		this.emit('windspeed', (windspeed * 3.6).toFixed(1));
		this.emit('grade', (grade).toFixed(1));
		this.emit('gear', this.gear);
	};
	
	// Do the math
	compute() {
		// rien si en mode ERG
		if (this.mode === 'ERG')
			return;
		// pas de data du velo : on ne peut rien faire
		if (this.data == null)
			return;
		// pas de data externe : on ne peut rien faire
		if (this.external == null)
			return;

		var simpower = 170 * (1 + 1.15 * (this.data.rpm - 80.0)/80.0) * (1.0 + 3 * this.external.grade/100.0);
		// apply gear
		simpower = Math.max(0.0, simpower * (1.0 + 0.1 * (this.gear - 5)));
		// store
		simpower = simpower.toFixed(1);
		
		if (DEBUG) {
			console.log('[BikeState.js] - SIM rpm: ', this.data.rpm);
			console.log('[BikeState.js] - SIM pente: ', this.external.grade);
			console.log('[BikeState.js] - SIM gear : ', this.gear);
			console.log('[BikeState.js] - SIM calculated power: ', simpower);
		}

		this.emit('simpower', simpower);
	};
	
	/*
	// recherche l'index de val dans le range
	findInRange(val, range)
	{
		for(var i = 0; i < range.length; i++)
		{
			if (val < range[i])
				return i;
		}
		return range.length - 1;
	};
	
	// Do the math
	compute() {
		// rien si en mode ERG
		if (this.mode === 'ERG')
			return;
		// pas de data du velo : on ne peut rien faire
		if (this.data == null)
			return;
		// pas de data externe : on ne peut rien faire
		if (this.external == null)
			return;

		var rpmIndex = this.findInRange(this.data.rpm, rpmRange);
		var gradeIndex = this.findInRange(this.external.grade, slopeRange);
		
		var simpower = powerCurve[gradeIndex][rpmIndex] * (1.0 + 0.1 * (this.gear - 5) );
		this.simpower = simpower.toFixed(0);
		if (DEBUG) {
			console.log('[BikeState.js] - SIM calculated power: ', simpower);
		}

		this.emit('simpower', simpower);
	};
*/
	/*
	// Do the math
	compute() {
	// rien si en mode ERG
	if (this.mode === 'ERG')
	return;
	// pas de data du velo : on ne peut rien faire
	if (this.data == null)
	return;
	// pas de data externe : on ne peut rien faire
	if (this.external == null)
	return;

	var mRider = 80; // mass in kg of the rider
	var mBike = 7; // mass in kg of the bike
	var mass = mBike + mRider; // mass in kg of the bike + rider
	// var h = 1.92 // hight in m of rider - this is allready included in the cw value sent from ZWIFT or FULLGAZ
	// var area = 0.0276 * Math.pow(h, 0.725) * Math.pow(mRider, 0.425) + 0.1647;  //  cross sectional area of the rider, bike and wheels - this is allready included in the cw value sent from ZWIFT or FULLGAZ

	// la pente
	var grade = Math.min(15, this.external.grade);

	var crr = this.external.crr; // coefficient of rolling resistance // the values sent from ZWIFT / FULLGAZ are crazy, specially FULLGAZ, when starting to decent, this drives up the wattage to above 600W
	var w = this.external.windspeed * 1; // multiply with 1 to parse sting to float // the values sent from ZWIFT / FULLGAZ are crazy
	var cd = this.external.cw; // coefficient of drag

	// speed in m/s
	var gearRatio = gearbox[this.gear]; // MICHAEL's: 34:25 & 50:11 20 speed; DAUM: the ratio starts from 42:24 and ends at 53:12; see TRS_8008 Manual page 57
	var distance = gearRatio * circumference; // distance in cm per rotation
	var speed = this.data.rpm * distance / (60.0 * 100.0); // speed in m.s-1
	var v = speed + w;
	this.data.speed = (speed * 3.6).toFixed(1);

	// ////////////////////////////////////////////////////////////////////////
	//  Constants
	// ////////////////////////////////////////////////////////////////////////
	var g = 9.8067; // acceleration in m/s^2 due to gravity
	var e = 0.98; // drive chain efficiency

	var forceofgravity = g * Math.sin(Math.atan(grade / 100.0)) * mass;
	var forcerollingresistance = g * Math.cos(Math.atan(grade / 100.0)) * mass * crr;
	var forceaerodynamic = 0.5 * cd * Math.pow(v + w, 2);
	var simpower = (forceofgravity + forcerollingresistance + forceaerodynamic) * v / e;

	// le resultat
	simpower = simpower.toFixed(0);
	this.simpower = simpower;
	if (DEBUG){
	console.log('[BikeState.js] - SIM calculated power: ', simpower);
	console.log('[BikeState.js] - SIM calculated speed: ', speed * 3.6);
	console.log('[BikeState.js] - SIM calculated gravity: ', (forceofgravity + 0 + 0) * v / e);
	console.log('[BikeState.js] - SIM calculated resistance: ', (0 + forcerollingresistance + 0) * v / e);
	console.log('[BikeState.js] - SIM calculated aero: ', (0 + 0 + forceaerodynamic) * v / e);
	}

	this.emit('simpower', simpower);
	};
	 */

};

module.exports = BikeState
