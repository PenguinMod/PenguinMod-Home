import * as Three from "three";
import VHTMLElement from "../element";
import Direction from "../../util/direction";

class VHTMLButtonElement extends VHTMLElement {
    constructor(element, parentObject, renderer) {
        super(element, parentObject, renderer);
    }

    render() {
        const attributes = this.getAttributes();
        const position = (attributes.position || '0 0 0').split(' ');
        const size = (attributes.size || '1 1 1').split(' ');

        const text = String(attributes.text) || 'Button';
        // this code is really bad but its all canvas 2d's fault
        this.renderer.texCreator.ctx.font = '36px Arial';
        this.renderer.texCreator.ctx.textAlign = 'center';
        const textSize = this.renderer.texCreator.getTextureSizeText(text);
        const paddingSize = Number(attributes.padding);
        const padding2Size = paddingSize * 2;
        const imageSize = {
            width: textSize.width + padding2Size,
            height: textSize.height + padding2Size
        }
        this.renderer.texCreator.prepare(imageSize.width, imageSize.height);
        this.renderer.texCreator.ctx.fillStyle = 'white';
        this.renderer.texCreator.ctx.strokeStyle = 'black';
        this.renderer.texCreator.ctx.font = '36px Arial';
        this.renderer.texCreator.ctx.textAlign = 'center';
        this.renderer.texCreator.drawSliced('button', 0, 0, textSize.width + padding2Size, textSize.height + padding2Size);
        this.renderer.texCreator.createText(text, true, (textSize.width + padding2Size) / 2, paddingSize);

        const div = 64;
        const textTextureURL = this.renderer.texCreator.export();
        const imageTexture = this.renderer.texLoader.load(textTextureURL);
        const imgGeometry = new Three.PlaneGeometry(imageSize.width / div, imageSize.height / div);
        const imgMaterial = new Three.MeshBasicMaterial({
            map: imageTexture,
            transparent: true,
            side: Three.DoubleSide,
        });

        const imgObject = new Three.Mesh(imgGeometry, imgMaterial);
        imgObject.position.set(...position);
        imgObject.scale.set(...size);
        imgObject.rotateX(Direction.toRad(0));

        this.object = imgObject;
        this.parentObject.add(imgObject);
    }
}

export default VHTMLButtonElement;