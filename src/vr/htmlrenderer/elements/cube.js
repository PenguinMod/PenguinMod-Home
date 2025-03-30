import * as Three from "three";
import VHTMLElement from "../element";

class VHTMLCubeElement extends VHTMLElement {
    constructor(element, parentObject, renderer) {
        super(element, parentObject, renderer);
    }

    /**
     * @param {HTMLElement} element
     */
    render() {
        const attributes = this.getAttributes();
        const color = new Three.Color(attributes.color || 'black');
        const position = (attributes.position || '0 0 0').split(' ');
        const size = (attributes.size || '0 0 0').split(' ');

        const cubeGeometry = new Three.BoxGeometry(...size);
        const cubeMaterial = new Three.MeshBasicMaterial({
            color: color
        });
        const cubeObject = new Three.Mesh(cubeGeometry, cubeMaterial);
        cubeObject.position.set(...position);

        this.object = cubeObject;
        this.parentObject.add(cubeObject);
    }
}

export default VHTMLCubeElement;