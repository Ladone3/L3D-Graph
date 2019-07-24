import { vector3DToTreeVector3, KeyHandler, KEY_CODES } from '../utils';
import { DiagramModel } from '../models/diagramModel';
import { DiagramView } from '../views/diagramView';
import { Element, isLink, ElementModel } from '../models/graphModel';
import { MouseHandler } from '../utils/mouseHandler';

const WHEEL_STEP = 100;
const MIN_DISTANCE_TO_CAMERA = 10;

export class DefaultEditor {
    constructor(
        private diagramModel: DiagramModel,
        private diagramView: DiagramView,
        private mouseHandler: MouseHandler,
        private keyHandler: KeyHandler,
    ) {
        this.mouseHandler.on('elementClick', e => {
            this.diagramModel.selection.setSelection(new Set([e.data.element]));
            e.data.nativeEvent.stopPropagation();
        });
        this.mouseHandler.on('paperClick', e => {
            this.diagramModel.selection.setSelection(new Set());
            e.data.stopPropagation();
        });
        this.mouseHandler.on('elementStartDrag', e => {
            this.onElementDrag(e.data.nativeEvent, e.data.element);
            e.data.nativeEvent.stopPropagation();
        });
        this.mouseHandler.on('elementDrag', e => {
            this.onElementDrag(e.data.nativeEvent, e.data.element);
            e.data.nativeEvent.stopPropagation();
        });
        this.mouseHandler.on('elementEndDrag', e => {
            this.onElementDragEnd(e.data.nativeEvent, e.data.element);
            e.data.nativeEvent.stopPropagation();
        });
        // this.mouseHandler.on('elementScroll', () => {
        //     // ...
        // });

        this.keyHandler.on('keyPressed', e => this.onKeyPressed(e.data));
    }

    private onKeyPressed(keyMap: Set<number>) {
        if (keyMap.has(KEY_CODES.DELETE) && this.diagramModel.selection.elements.size > 0) {
            const elementsToDelete: ElementModel[] = [];
            this.diagramModel.selection.elements.forEach(el => {
                elementsToDelete.push(el.model);
            });
            this.diagramModel.removeElements(elementsToDelete);
        }
    }

    onElementDrag(event: MouseEvent | MouseWheelEvent, target: Element) {
        if (isLink(target)) { return; }

        const nodeTreePos = vector3DToTreeVector3(target.position);
        const cameraPos = this.diagramView.camera.position;
        let distanceToNode = nodeTreePos.distanceTo(cameraPos);
        if (isMouseWheelEvent(event)) {
            const delata = -(event.deltaX || event.deltaY || event.deltaZ);
            distanceToNode += (delata > 0 ? 1 : -1) * WHEEL_STEP;
        }
        const size = target.size;
        const minDist = Math.max(size.x, size.y, size.z) / 2 + MIN_DISTANCE_TO_CAMERA;
        const limitedDistance = Math.max(distanceToNode, minDist);
        const newNodePosition = this.diagramView.mouseTo3dPos(event, limitedDistance);
        target.setPosition(newNodePosition);
    }

    onElementDragEnd(event: MouseEvent | MouseWheelEvent, target: Element) {
        this.onElementDrag(event, target);
    }
}

function isMouseWheelEvent(e: any): e is MouseWheelEvent {
    return Boolean(e.deltaX || e.deltaY || e.deltaZ);
}
