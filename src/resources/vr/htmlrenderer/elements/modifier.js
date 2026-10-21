import * as Three from "three";
import VHTMLElement from "../element";
import Direction from "../../util/direction";

class VHTMLModifierElement extends VHTMLElement {
    constructor(element, parentObject, renderer) {
        super(element, parentObject, renderer);
    }

    render() {
        const attributes = this.getAttributes();
        this.attributes = attributes;
        this.current = {
            dx: 0,
            dy: 0,
            dz: 0,
        };

        if (attributes.turn == 'true' && attributes.turnspeed) {
            this.current.dz = Number(attributes.turnspeed);
        }
        
        const modifierObject = new Three.Group();
        modifierObject.rotateX(Direction.toRad(0));

        this.object = modifierObject;
        this.parentObject.add(modifierObject);
    }
    animate() {
        if (!this.attributes) return;
        if (!this.current) return;
        if (!this.object) return;

        this.object.rotateX(Direction.toRad(this.current.dx));
        this.object.rotateY(Direction.toRad(this.current.dy));
        this.object.rotateZ(Direction.toRad(this.current.dz));
    }
}

export default VHTMLModifierElement;