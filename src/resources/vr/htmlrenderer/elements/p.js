import * as Three from "three";
import VHTMLElement from "../element";
import Direction from "../../util/direction";

class VHTMLPElement extends VHTMLElement {
    constructor(element, parentObject, renderer) {
        super(element, parentObject, renderer);
    }

    render() {
        const attributes = this.getAttributes();
        const position = (attributes.position || '0 0 0').split(' ');

        const textGroup = new Three.Group();
        textGroup.position.set(...position);
        textGroup.rotateX(Direction.toRad(0));

        this.object = textGroup;
        this.parentObject.add(textGroup);
    }
}

export default VHTMLPElement;