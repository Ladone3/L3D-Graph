import * as THREE from 'three';
import { DiagramView } from '../views/diagramView';
import { MouseHandler } from '../utils/mouseHandler';
import { KeyHandler, KEY_CODES, EventObject } from '../utils';
import { ViewController } from './viewController';
import { VrManager } from '../utils/webVr';

export class VrViewController implements ViewController {
    public readonly id = 'vr-view-controller';
    public readonly label = 'VR View Controller';

    private vrManager: VrManager;
    private connectionPromise: Promise<void>;

    constructor(
        protected view: DiagramView,
        protected mouseHandler: MouseHandler,
        protected keyHandler: KeyHandler,
    ) {
        this.vrManager = new VrManager(this.view.renderer, () => {
            this.view.renderer.render(this.view.scene, this.view.camera);
        });
        this.connectionPromise = this.vrManager.connect();
    }

    refreshCamera() { /* nothing */ }
    focusOn()  { /* nothing */ }

    switchOn() {
        if (!this.vrManager.isConnected) {
            this.connectionPromise.then(() => {
                this.vrManager.start();
                this.view.renderGraph();
            })
        } else {
            this.vrManager.start();
            this.view.renderGraph();
        }
        
        this.subscribe();
    }

    switchOff() {
        if (this.vrManager && this.vrManager.isStarted) {
            this.vrManager.stop();
            this.view.renderGraph();
        }
        this.unsubscribe();
    }

    private subscribe() {
        this.keyHandler.on('keyPressed', this.onKeyPressed);
    }

    private unsubscribe() {
        this.keyHandler.unsubscribe(this.onKeyPressed);
    }

    private onKeyPressed = (e: EventObject<'keyPressed', Set<number>>) =>  {
        if (e.data.has(KEY_CODES.ESCAPE)) {
            this.switchOff();
        }
    }
}
