/*---------------------------------------------------------------------------------------------------*/
/* NodeJS Requires
/*---------------------------------------------------------------------------------------------------*/
var express 	= require('express');
var router 		= express.Router();
var path 		= require('path');
var nmea 		= require('node-nmea');
var serialport 	= require('serialport');
var PythonShell	= require('python-shell');
var net 		= require('net');
var _ 			= require('lodash');
var fs 			= require('fs');
var util 		= require('util');
var exec 		= require('child_process').exec;

/*---------------------------------------------------------------------------------------------------*/
/* Server variables
/*---------------------------------------------------------------------------------------------------*/
var savedHeading = '';
var rebooting = false;
var rebootTime = "00:00";
var activeAntenna = 'right';
var antennaLayout = 'rl';
var autoSwitch = false;
var left_antenna = 11;
var front_antenna = 13;
var right_antenna = 15;
var rear_antenna = 7;
var idealAngle = 45;
var gps_dta = '';
var socketDisconnected = true;
var signalStrength = '0.0';
var doOnce = true;
var selectedSatellite = {
		name: 'I-4 F3 Americas',
		lat: 0,
		lon: -98.4,
		key: 'i4f3'
};

// USB Antenna: /dev/ttyACM0
// UART Antenna: /dev/ttyS0
var gps_interface = '/dev/ttyS0';

var antenna_def = {
	left: {
		pin: left_antenna,
		active: true,
		enabled: false
	},
	right: {
		pin: right_antenna,
		active: false,
		enabled: false
	},
	front: {
		pin: front_antenna,
		active: false,
		enabled: false
	},
	rear: {
		pin: rear_antenna,
		active: false,
		enabled: false
	}
};
var inmarsat_satellites = {
	i4f1: {
		name: 'I-4 F1 Asia-Pacific',
		lat: 0,
		lon: 143.5,
		key: 'i4f1'
	},
	i4f2: {
		name: 'I-4 F2 EMEA',
		lat: 0,
		lon: 64.9,
		key: 'i4f2'
	},
	i4f3: {
		name: 'I-4 F3 Americas',
		lat: 0,
		lon: -98.4,
		key: 'i4f3'
	},
	alphasat: {
		name: 'I-4 F4 Alphasat',
		lat: 0,
		lon: 24.8,
		key: 'alphasat'
	}
};

/*---------------------------------------------------------------------------------------------------*/
/* TCP socket
/*---------------------------------------------------------------------------------------------------*/
var socket = new net.Socket();

function reconnect() {
	socket.destroy();
	socket = new net.Socket();
	socketerror();
	socketdata();
	console.log('socket connect');
	socket.connect(5454, '192.168.0.1', function(err) {
		console.log('TCP socket reconnected at 192.168.0.1 on port 5454');
		rebooting = false;
		rebootTime = '';
		socket.write('AT_ISIG=1\r\n');
		socketDisconnected = false;
	});
}

function socketerror() {
	socket.on("error", function(err) {
	    console.log("SocketError");
		console.log(err);
		socketDisconnected = true;
	});
}

reconnect();

function socketdata() {
	socket.on("data", function(data) {
	    var stringData = data.toString().split('\r\n');
	    var stringJson = JSON.stringify(stringData);
	    var time;
	    var set;
	    var seconds;
	    var minutes;
	    var newMinutes;
	    var rebootCommand;
	    var dbHz;
	    if (stringJson.indexOf('ISIG') !== -1 && stringJson.indexOf('AT') === -1) {
	    	// TODO: Use Regex to just remove all letters and leave all numbers
	    	dbHz = stringData[0].replace(/[^\d.-]/g, '');
	    	if (!isNaN(parseInt(dbHz))) {
	    		signalStrength = dbHz;
	    	}
	    } else if(stringJson.indexOf('REBOOT') !== -1){

	    	rebooting = true;
	    } else if (stringData[1]) {
	    	console.log(stringData[1]);
	    	console.log(Date.parse(stringData[1]));
	        time = stringData[1].split(',')[1];
	        if (time) {
	            set = time.substr(0,5);
	            seconds = time.substr(6,8);
	            minutes = set.split(':');
	            newMinutes = '';
	            if (parseInt(seconds) < 57) {
	                newMinutes = (parseInt(minutes[1]) + 1).toString();
	            } else {
	                newMinutes = (parseInt(minutes[1]) + 2).toString();
	            }
	            if (newMinutes.toString().length === 1) {
	                newMinutes = "0" + newMinutes;
	            }
	           	rebootTime = '"' + minutes[0] + ':' + newMinutes + '"';
	            rebootCommand = 'AT_ITREBOOT=42,1,' + rebootTime + "\r\n";
	            socket.write(rebootCommand);
	        }
	    }
	});
}

/*---------------------------------------------------------------------------------------------------*/
/* Serial port
/*---------------------------------------------------------------------------------------------------*/
var port = new serialport.SerialPort(gps_interface, {
	baudrate: 9600,
	parser: serialport.parsers.readline('\r\n'),
	autoOpen: false
});

port.on('error', function(err) {
	console.log('Error: ', err.message);
});

port.on('open', function() {
	console.log('port open');
	console.log(JSON.stringify(port));
});

port.open();

port.on('data', function(line) {
	// $GPMRC is the only type GPS NMEA sentence we care about, but the GPS module sends lots of
	// different sentences so we need to make sure we've got the right one before proceeding.
	if (line.includes('$GPRMC')) {
		var heading = 0;
		var bearing = 0;
		var x_pos = 0;
		var y_pos = 0;
		var myLat = 0;
		var myLon = 0;
		var satelliteLat = 0;
		var satelliteLon = 0;

		// Parse the sentence to extract GPS data from it.
		gps_dta = nmea.parse(line);

		// If the sentence is valid and doesn't have any errors,
		// we can proceed to calculations.
		if(gps_dta && gps_dta.valid) {
			heading = gps_dta.track;
			myLat = gps_dta.loc.geojson.coordinates[1];
			myLon = gps_dta.loc.geojson.coordinates[0];

			// before proceeding, we need to make sure that the selected satellite is still the correct one
			satelliteFind(myLat, myLon);
			satelliteLat = inmarsat_satellites[selectedSatellite.key].lat;
			satelliteLon = inmarsat_satellites[selectedSatellite.key].lon;

			// now we calculate a vector bearing pointing towards the selected satellite based on our current
			// latitude and longitude
			y_pos = Math.sin((satelliteLon*Math.PI/180)-(myLon * Math.PI/180))*Math.cos(satelliteLat*Math.PI/180);

			x_pos = (Math.cos(myLat*Math.PI/180)*Math.sin(satelliteLat*Math.PI/180))-(Math.sin(myLat*Math.PI/180)*Math.cos(satelliteLat*Math.PI/180)*Math.cos((satelliteLon*Math.PI/180)-(myLon*Math.PI/180)));

			bearing = Math.atan2(y_pos,x_pos) * (180/Math.PI);

			if (bearing - 180 > 0) {
				savedHeading = bearing - 180;
			} else {
				savedHeading = bearing + 180;
			}

			bearing = circle_fix(bearing);
			heading = circle_fix(heading);

			switchLogic(heading, bearing);
		}
	}
});

/*---------------------------------------------------------------------------------------------------*/
/* Server API Calls
/*---------------------------------------------------------------------------------------------------*/
router.get('/nmea', function(req, res) {
	var object = {
		nmea: gps_dta,
		heading: savedHeading,
		reboot: {
			rebooting: rebooting,
			rebootTime: rebootTime
		},
		antenna_def: antenna_def,
		autoSwitch: autoSwitch,
		selectedSatellite: selectedSatellite,
		antennaLayout: antennaLayout,
		signalStrength: signalStrength
	};
	res.json(object);
});

router.post('/sendcommand', function(req, res) {
	var response = '200 OK';
	_.each(antenna_def, function(val, key) {
		if (val.active) {
			activeAntenna = key;
		}
	});

	switch(req.body.data) {
		case 'left':
			gpio_switch(left_antenna);
			break;
		case 'front':
			gpio_switch(front_antenna);
			break;
		case 'right':
			gpio_switch(right_antenna);
            break;
		case 'rf':
			antennaLayout = 'fr';
			_.each(antenna_def, function(val, key) {
				if (key.indexOf('right') !== -1 ||
					key.indexOf('left') !== -1) {
					val.enabled = true;
				} else {
					val.enabled = false;
				}
			});

			if (activeAntenna === 'left') {
				gpio_switch(front_antenna);
			}
			break;
		case 'fl':
			antennaLayout = 'fl';
			_.each(antenna_def, function(val, key) {
				if (key.indexOf('front') !== -1 ||
					key.indexOf('left') !== -1) {
					val.enabled = true;
				} else {
					val.enabled = false;
				}
			});
			if (activeAntenna === 'right') {
				gpio_switch(front_antenna);
			}
			break;
		case 'rl':
			antennaLayout = 'rl';
			_.each(antenna_def, function(val, key) {
				if (key.indexOf('right') !== -1 ||
					key.indexOf('left') !== -1) {
					val.enabled = true;
				} else {
					val.enabled = false;
				}
			});
			if (activeAntenna === 'front') {
				gpio_switch(right_antenna);
			}
			break;
		case 'frl':
			antennaLayout = 'frl';
			_.each(antenna_def, function(val, key) {
				if (key.indexOf('front') !== -1 ||
					key.indexOf('right') !== -1 ||
					key.indexOf('left') !== -1) {
					val.enabled = true;
				} else {
					val.enabled = false;
				}
			});
			break;
		case 'i4f1':
			selectedSatellite = inmarsat_satelltes.i4f1;
			break;
		case 'i4f2':
			selectedSatellite = inmarsat_satellites.i4f2;
			break;
		case 'i4f3':
			selectedSatellite = inmarsat_satellites.i4f3;
			break;
		case 'alphasat':
			selectedSatellite = inmarsat_satellites.alphasat;
			break;
		case 'iperf':
			iperf_test();
			break;
		case 'reboot':
			reboot();
			break;
		default:
			break;
	}
	res.json(response);
});

router.post('/iperf', function(req, res) {
	exec('/var/www/html/iperf_test.sh', function (error, stdout, stderr) {
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	    res.json(stdout);
	});
});

router.post('/setlayout', function(req, res) {
	antennaLayout = req.body.data;

	_.each(antenna_def, function(val, key) {
		val.enabled = false;
	});

	switch(antennaLayout) {
		case 'rf':
			antenna_def.right.enabled = true;
			antenna_def.front.enabled = true;
			break;
		case 'fl':
			antenna_def.front.enabled = true;
			antenna_def.left.enabled = true;
			break;
		case 'rl':
			antenna_def.right.enabled = true;
			antenna_def.left.enabled = true;
			break;
		case 'frl':
			antenna_def.front.enabled = true;
			antenna_def.right.enabled = true;
			antenna_def.left.enabled = true;
			break;
		default:
			break;
	}
});

router.post('/setauto', function(req, res) {
	if (req.body.data === true) {
		autoSwitch = true;
	} else {
		autoSwitch = false;
	}
	res.json('Auto Switch Set To ' + autoSwitch.toString());
});

/*---------------------------------------------------------------------------------------------------*/
/* Iperf shell execution
/*---------------------------------------------------------------------------------------------------*/
function iperf_test() {
	exec('/var/www/html/iperf_test.sh', function (error, stdout, stderr) {
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	    return stdout;
	});
}

/*---------------------------------------------------------------------------------------------------*/
/* Periodic interval functions
/*---------------------------------------------------------------------------------------------------*/
setInterval(function() {
	console.log('Serial port open: ' + port.isOpen());
	if (!port.isOpen()) {
		console.log('Serial port not open, attempting port open');
		port.open();
	}

	console.log('TCP socket writable: ' + socket.writable);
	if (!socket.writable) {
		console.log('TCP socket not writable, attempting socket reconnect');
		reconnect();
	} else if (socket.writable && rebooting && socketDisconnected) {
		socket.destroy();
	}
}, 2500);

setInterval(function() {
	if (socket.writable && !rebooting && !socketDisconnected) {
		socket.write('AT_ISIG=\r\n');
	}
}, 100);

/*---------------------------------------------------------------------------------------------------*/
/* Other functions
/*---------------------------------------------------------------------------------------------------*/
function reboot() {
	var rebootIntervalId = setInterval(function() {
		if (rebooting) {
			clearInterval(rebootIntervalId);
			return;
		}
		socket.write('AT+CCLK?\r\n');
	}, 100);
}

function gpio_switch(pin) {
	var options = {
		mode: 'text',
		pythonPath: '/usr/bin/python',
		pythonOptions: ['-u'],
		scriptPath: '/var/www/html',
		args: [pin]
	};
	PythonShell.run('write_all_off.py', function(err) {
		if (err) throw err;
	});
	PythonShell.run('write_pin_on.py', options, function(err) {
		if (err) throw err;
	});

	_.each(antenna_def, function(val, key) {
		val.active = false;
	});

	switch(pin) {
		case antenna_def.right.pin:
			antenna_def.right.active = true;
			activeAntenna = 'right';
			break;
		case antenna_def.front.pin:
			antenna_def.front.active = true;
			activeAntenna = 'front';
			break;
		case antenna_def.left.pin:
			antenna_def.left.active = true;
			activeAntenna = 'left';
			break;
		case antenna_def.rear.pin:
			antenna_def.rear.active = true;
			activeAntenna = 'rear';
			break;
		default:
			break;
	}

	// We skip this reboot one time to allow the system to startup
	// We also skip this reboot if autoSwitch is false
	if(!doOnce && autoSwitch) {
    	reboot();
    }
    doOnce = false;
}

function switchLogic(heading, bearing) {
	var edgeBuffer = 5;
	var view_angle = 45;
	var right_heading = circle_fix(heading + 90);
	var right_heading_high = circle_fix(right_heading + view_angle);
	var right_heading_low = circle_fix(right_heading - view_angle);

	var left_heading = circle_fix(heading - 90);
	var left_heading_high = circle_fix(left_heading + view_angle);
	var left_heading_low = circle_fix(left_heading - view_angle);

	var front_heading = circle_fix(heading);
	var front_heading_high = circle_fix(front_heading + view_angle);
	var front_heading_low = circle_fix(front_heading - view_angle);

	_.each(antenna_def, function(val, key) {
		if (val.active) {
			activeAntenna = key;
		}
	});

	if (autoSwitch && !rebooting) {
		switch(antennaLayout) {
			case 'fl':
				if (bearing > (front_heading_low + edgeBuffer) &&
					bearing < (front_heading_high - edgeBuffer) &&
					activeAntenna !== 'front') {
					gpio_switch(front_antenna);
				} else if (bearing > (left_heading_low + edgeBuffer) &&
						   bearing < (left_heading_high - edgeBuffer) &&
						   activeAntenna !== 'left') {
					gpio_switch(left_antenna);
				}
				break;
			case 'rf':
				if (bearing > (right_heading_low + edgeBuffer) &&
					bearing < (right_heading_high - edgeBuffer) &&
					activeAntenna !== 'right') {
					gpio_switch(right_antenna);
				} else if (bearing > (front_heading_low + edgeBuffer) &&
						   bearing < (front_heading_high - edgeBuffer) &&
						   activeAntenna !== 'front') {
					gpio_switch(front_antenna);
				}
				break;
			case 'rl':
				if (bearing > (right_heading_low + edgeBuffer) &&
					bearing < (right_heading_high - edgeBuffer) &&
					activeAntenna !== 'right') {
					gpio_switch(right_antenna);
				} else if (bearing > (left_heading_low + edgeBuffer) &&
						   bearing < (left_heading_high - edgeBuffer) &&
						   activeAntenna !== 'left') {
					gpio_switch(left_antenna);
				}
				break;
			case 'frl':
				if (bearing > (right_heading_low + edgeBuffer) &&
					bearing < (right_heading_high - edgeBuffer) &&
					activeAntenna !== 'right') {
					gpio_switch(right_antenna);
				} else if (bearing > (left_heading_low + edgeBuffer) &&
						   bearing < (left_heading_high - edgeBuffer) &&
						   activeAntenna !== 'left') {
					gpio_switch(left_antenna);
				} else if (bearing > (front_heading_low + edgeBuffer) &&
					 	   bearing < (front_heading_high - edgeBuffer) &&
					       activeAntenna !== 'front') {
					gpio_switch(front_antenna);
				}
				break;
			default:
				break;
		}
	}
}

function circle_fix(angle) {
	if (angle < 0) {
		angle += 360;
	} else if (angle > 360) {
		angle -= 360;
	}
	return angle;
}

function satelliteFind(myLat, myLon) {
	if (autoSwitch) {
		var selectionObj = selectedSatellite;
		var best = {};
		_.each(inmarsat_satellites, function(sat, key) {
			if (sat.lon < 0) {
		        g = sat.lon - myLon;
		    } else {
		        g = myLon - sat.lon;
		    }
			numberD = (Math.cos(g*Math.PI/180)*Math.cos(myLat*Math.PI/180) - 0.1512);
			numberN = Math.sqrt(1-(Math.cos(g*Math.PI/180)*Math.cos(g*Math.PI/180))*(Math.cos(myLat*Math.PI/180)*Math.cos(myLat*Math.PI/180)));
			elevation = Math.atan(numberD/numberN)*(180/Math.PI);
			if ((idealAngle - elevation) < idealAngle) {
				// line-of-sight confirmed
				selectionObj = sat;
				selectionObj.elevation = elevation;
				if (!best.name) {
					best = selectionObj;
				}
			}
			if (Math.abs((idealAngle - selectionObj.elevation)) < Math.abs((idealAngle - best.elevation))) {
				best = {};
				best = selectionObj;
			}
		});
		selectedSatellite = best;
	}
}

// initially we want at least ONE of the antennas on
// so we'll pick one that fits in the current layout
if (antennaLayout === 'rl') {
	gpio_switch(right_antenna);
} else {
	gpio_switch(front_antenna);
}

module.exports = router;
