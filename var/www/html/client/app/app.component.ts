import { Component, Input, OnInit } from '@angular/core';
import { Http, Response }  from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

declare var jQuery:any;

@Component({
	selector: 'my-app',
	templateUrl: 'app/pages/navigation.html',
})

export class AppComponent {
	private indicator:any;
	private heading:number = 0;
	private command:string = 'left';
	private autoSwitch:boolean = false;
	private coordinates:any = {
		latitude: 35.8436867,
		longitude: -78.7789608
	};

	private selectedSatellite:any = {};
	private satelliteBearing:number = -135;
	private options:any = {
		coordinates: this.satelliteBearing,
		size : 450,					// Sets the size in pixels of the indicator (square)
		heading: this.heading,		// Heading angle in degrees for an heading indicator
		showBox : true,				// Sets if the outer squared box is visible or not (true or false)
		img_directory : 'app/img/'	// The directory where the images are saved to
	};
	private debugNMEA:string = '';
	private serverNMEA:string = '';
	private parsedNMEA = {};


	private isRebooting:boolean = false;
	private rebootTime:string = '00:00';

	private activeAntenna:string = '';
	private switchMode:boolean = false;
	private antennaLayout:string = 'frl';
	private rebootProgress = 100;
	private signalStrength = '0.0';
	private iperfOutput = '';
	private isTesting:boolean = false;

	private antenna_def = {
		left: {
			pin: 11,
			active: false,
			enabled: false
		},
		right: {
			pin: 15,
			active: false,
			enabled: false
		},
		front: {
			pin: 13,
			active: false,
			enabled: false
		},
		rear: {
			pin: 7,
			active: false,
			enabled: false
		}
	};

	private layoutSwitch = {
		rf: false,
		fl: false,
		rl: false,
		frl: false
	}

	// Types; attitude, heading, variometer, airspeed or altimeter

	/* Valid methods to call on indicator
		indicator.setRoll(roll);			// Sets the roll of an attitude indicator
		indicator.setPitch(pitch);			// Sets the pitch of an attitude indicator
		indicator.setHeading(heading);		// Sets the heading of an heading indicator
		indicator.setVario(vario);			// Sets the climb speed of an variometer indicator
		indicator.setAirSpeed(speed);		// Sets the speed of an airspeed indicator
		indicator.setAltitude(altitude);	// Sets the altitude of an altimeter indicator
		indicator.setPressure(pressure);	// Sets the pressure of an altimeter indicator
		indicator.resize(size);				// Sets the size of any indicators
		indicator.showBox();				// Make the outer squared box of any instrument visible
		indicator.hideBox();				// Make the outer squared box of any instrument invisible
	*/

	constructor(private http: Http) {}

	ngOnInit() {
		this.indicator = jQuery.flightIndicator('#indicator', 'heading', this.options);
		this.setup();
	}

	private setup() {
		setInterval(() => {
    		this.http.request('/nmea').catch(this.handleError).subscribe(response => this.extractSentence(response));
		}, 300);
	}

	private handleError (error: Response | any) {
		console.log('error');
		console.log(error.text());
		return Observable.throw(error.text());
	}

	private antennaSwitch(antenna:string) {
		console.log(antenna);
		if (this.antenna_def[antenna].active) {
			return;
		} else {
			this.antenna_def.left.active = false;
			this.antenna_def.right.active = false;
			this.antenna_def.front.active = false;
			this.antenna_def.rear.active = false;
			this.antenna_def[antenna].active = true;
			this.sendCommand(antenna);
		}
	}

	private extractSentence(response: Response) {
		let body = JSON.parse(response.text());
		//this.parsedNMEA = response.text();
		this.parsedNMEA = body;
		this.debugNMEA = body.raw;
		this.serverNMEA = body.raw;

		this.autoSwitch = body.autoSwitch;
		if (body.nmea.track !== null) {
			this.heading = body.nmea.track;
		}

		this.satelliteBearing = body.heading + this.heading - 180;


        this.selectedSatellite = body.selectedSatellite;

        this.isRebooting = body.reboot.rebooting;
        this.rebootTime = body.reboot.rebootTime;
        this.antennaLayout = body.antennaLayout;

        for (var key in this.layoutSwitch) {
        	this.layoutSwitch[key] = false;
        	this.layoutSwitch[this.antennaLayout] = true;
        }

        //this.activeAntenna = body.activeAntenna;


        this.antenna_def = body.antenna_def;
        //this.antennaSwitch(body.activeAntenna);

        this.signalStrength = body.signalStrength;

        // Set the location of the yellow satellite icon
        this.indicator.setSatellite(this.satelliteBearing);

        // Set the heading of the aircraft compass
        this.indicator.setHeading(this.heading);
	}

	private sendCommand(command:string) {
		this.http.post('/sendcommand', { data: command }).catch(this.handleError).subscribe();
	}

	private sendiperf(command:string) {
		this.isTesting = true;
		this.http.post('/iperf', { data: command }).catch(this.handleError).subscribe(response => this.extractIperf(response));
	}

	private extractIperf(response:Response) {
		this.isTesting = false;
		console.log(response);
		this.iperfOutput = JSON.parse(response.text());
		console.log(JSON.parse(response.text()));
	}

	private setLayout(layout:string) {
		if (this.antennaLayout === layout) {
			return;
		} else {
			for (var key in this.layoutSwitch) {
	        	this.layoutSwitch[key] = false;
	        	this.layoutSwitch[layout] = true;
	        	this.antennaLayout = layout;
	        }
		}
		console.log(this.layoutSwitch);
		this.http.post('/setlayout', { data: layout }).catch(this.handleError).subscribe();
	}

	private autoSet(layout:string) {
		this.autoSwitch = !this.autoSwitch;
		this.http.post('/setauto', { data: this.autoSwitch }).catch(this.handleError).subscribe();
	}
}
