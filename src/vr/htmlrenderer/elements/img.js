import * as Three from "three";
import VHTMLElement from "../element";
import Direction from "../../util/direction";

class VHTMLImageElement extends VHTMLElement {
    constructor(element, parentObject, renderer) {
        super(element, parentObject, renderer);
    }

    render() {
        const attributes = this.getAttributes();
        const position = (attributes.position || '0 0 0').split(' ');
        const size = (attributes.size || '1 1').split(' ');

        const imageTexture = this.renderer.texLoader.load(attributes.src);
        const imgGeometry = new Three.PlaneGeometry(...size);
        const imgMaterial = new Three.MeshBasicMaterial({
            map: imageTexture,
            transparent: true,
            side: Three.DoubleSide,
        });

        const imgObject = new Three.Mesh(imgGeometry, imgMaterial);
        imgObject.position.set(...position);
        imgObject.rotateX(Direction.toRad(0));

        this.object = imgObject;
        this.parentObject.add(imgObject);
    }
}

export default VHTMLImageElement;