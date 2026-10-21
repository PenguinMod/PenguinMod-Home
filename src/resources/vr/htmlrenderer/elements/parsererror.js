import * as Three from "three";
import VHTMLElement from "../element";
import Direction from "../../util/direction";

class VHTMLParserErrorElement extends VHTMLElement {
    constructor(element, parentObject, renderer) {
        super(element, parentObject, renderer);
    }

    render() {
        const imageTexture = this.renderer.texLoader.load("https://penguinmod.com/vr/warning.png");
        const imgGeometry = new Three.PlaneGeometry(1.5, 1.5);
        const imgMaterial = new Three.MeshBasicMaterial({
            map: imageTexture,
            transparent: true,
            side: Three.DoubleSide,
        });

        const imgObject = new Three.Mesh(imgGeometry, imgMaterial);
        imgObject.position.set(0, 0, 0.5);
        imgObject.rotateX(Direction.toRad(0));

        this.object = imgObject;
        this.parentObject.add(imgObject);
    }
}

export default VHTMLParserErrorElement;