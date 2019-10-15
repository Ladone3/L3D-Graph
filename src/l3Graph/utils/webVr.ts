import * as THREE from 'three';
import Subscribable from './subscribeable';

/**
 * This code was rewrited from example of webVR, so don't ask me why something is here
 * and how it works.
 */

export interface UndocumentedOptions {
	frameOfReferenceType: any;
}

export interface WebGLRenderer extends THREE.WebGLRenderer {
	vr: any;
}

type Device = VRDisplay & {
	isPresenting: boolean;
	exitPresent: () => void;
	requestPresent: (presenters: {source: HTMLCanvasElement}[]) => void;
	requestSession: (options: {immersive: boolean, exclusive: boolean}) => Promise<Session>;
	supportsSession: (options: {immersive: boolean, exclusive: boolean}) => Promise<void>;
}

interface VrEvent extends Event {
	display: Device;
}

interface Session {
	addEventListener: (eventId: string, handler: (event: Event) => void) => void;
	removeEventListener: (eventId: string, handler: (event: Event) => void) => void;
	end: () => void;
}

interface XrNavigator extends Navigator {
	xr: {
		requestDevice: () => Promise<Device>;
	}
}

function isXrNavigator(n: Navigator): n is XrNavigator {
	return ('xr' in n);
}

export interface VrManagerEvents {
	'presenting:state:changed': void;
	'connection:state:changed': void;
}

export class VrManager extends Subscribable<VrManagerEvents> {
	private device?: Device;
	private session?: Session; // only for XR mode

	private _isStarted: boolean;
	private errorMessages: string[] = [];

	private isXr: boolean;

	constructor(
		private renderer: WebGLRenderer,
		private animationLoop: () => void,
	) {
		super();
	}

	get errors() {
		return this.errorMessages;
	}

	get isStarted() {
		return this._isStarted;
	}

	get isConnected() {
		return Boolean(this.device);
	}

	start() {
		if (this.isStarted) return;
		this._initVr();
		if (this.isXr) {
			const onSessionStarted = (session: Session) => {
				this.session.addEventListener('end', onSessionEnded);
				this.renderer.vr.setSession(session);
			}
	
			const onSessionEnded = (event: Event) => {
				this.session.removeEventListener( 'end', onSessionEnded );
				this.renderer.vr.setSession(null);
				this.session = null;
			}
			this.device.requestSession({immersive: true, exclusive: true}).then(onSessionStarted);
		} else {
			this.device.requestPresent([{source: this.renderer.domElement}]).catch(function (){ alert(JSON.stringify(arguments)) }) ;
		}

		this._isStarted = true;
		this.trigger('presenting:state:changed');
	}

	stop() {
		if (!this.isStarted) return;
		this._cancelVr();

		if (this.isXr) {
			this.session.end();
		} else {
			this.device.exitPresent();
		}

		this._isStarted = false;
		this.trigger('presenting:state:changed');
	}

	connect() {
		let promise: Promise<void>;
		if (isXrNavigator(navigator)) {
			promise = navigator.xr.requestDevice().then(device => {
				device.supportsSession({immersive: true, exclusive: true})
					.then(() => { this.setDevice(device); } )
					.catch(e => {
						this.setDevice(null);
						this.setError(`Session is not support this mode: ${e.errorMessage}.`)
					});
			}).catch(e => this.setError(`Error during requesting device: ${e.errorMessage}.`));
			this.isXr = true;
		} else if ('getVRDisplays' in navigator) {
			promise = navigator.getVRDisplays()
				.then(displays => {
					if (displays.length > 0) {
						this.setDevice(displays[0] as any);
					} else {
						this.setDevice(null);
						this.setError(`VR display is not found yet.`);
					}
				}).catch(e => {
					this.setDevice(null);
					this.setError(`Error during requesting displays: ${e.errorMessage}.`)
				});
			this.isXr = false;
		}

		window.addEventListener('vrdisplayconnect', event => {
			this.setDevice((event as VrEvent).display);
		}, false);

		window.addEventListener('vrdisplaydisconnect', event => {
			this.stop();
			this.setDevice(null);
		}, false);

		window.addEventListener('vrdisplayactivate', event => {
			this.start()
		}, false);

		return promise;
	}

	private _initVr() {
		this.renderer.vr.enabled = true;
		(this.renderer as any).setAnimationLoop(this.animationLoop);
	}

	private _cancelVr() {
		this.renderer.vr.enabled = false;
		(this.renderer as any).setAnimationLoop(null);
	}
	
	private setError(message: string) {
		this.errorMessages.push(message);
	}

	private setDevice(device: Device) {
		this.device = device;
		this.renderer.vr.setDevice(this.device);
		this.trigger('connection:state:changed');
	}
}
