import { Vector2d } from '../models/structures';
import { ViewController, ViewControllerEvents } from './viewController';
import { Subscribable } from '../utils';
import { KeyHandler } from '../input/keyHandler';
import { MouseHandler } from '../input/mouseHandler';
import { Core } from '../core';
export declare class SphericalViewController extends Subscribable<ViewControllerEvents> implements ViewController {
    protected core: Core;
    protected mouseHandler: MouseHandler;
    protected keyHandler: KeyHandler;
    readonly id: string;
    label: string;
    protected cameraAngle: Vector2d;
    protected cameraDistance: number;
    protected startAngle: Vector2d;
    constructor(core: Core, mouseHandler: MouseHandler, keyHandler: KeyHandler);
    switchOn(): void;
    switchOff(): void;
    private refreshCamera;
    focusOn(element: Element): void;
    protected setCameraAngle(anglePoint: Vector2d): void;
    protected setCameraDistance(distance: number): void;
    protected updateCameraPosition(): void;
    protected limitDistance(distance: number): number;
    private onMouseDragStart;
    private onMouseDrag;
    private onMouseWheel;
    private onKeyPressed;
    private zoom;
}
