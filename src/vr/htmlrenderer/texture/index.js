import FontUtil from "./font";
import TextUtil from "./text";
import NineSlices from "./nineslice";

class TextureCreator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.style = 'display: none;';
        this.canvas.width = 640;
        this.canvas.height = 360;
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        TextUtil.ctx = this.ctx;
        NineSlices.ctx = this.ctx;
    }

    prepare(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);
    }
    export() {
        const url = this.canvas.toDataURL('image/png');
        return url;
    }

    getTextureSizeText(text) {
        const measurement = this.ctx.measureText(text);
        const imageHeight = FontUtil.getFontSize(this.ctx.font) * text.split('\n').length;
        return {
            width: measurement.width,
            height: imageHeight
        }
    }
    drawSliced(sliceName, x, y, width, height) {
        const slice = NineSlices.images[sliceName];
        NineSlices.drawTexture(slice.image, slice.corner, x, y, width, height);
    }
    createText(text, stroke, x, y) {
        this.ctx.textBaseline = 'top';
        if (stroke) {
            // i love canvas 2d strokeText!!!!!!
            for (let i = 0; i < 5; i++) {
                TextUtil.strokeTextNL(text, x, y);
            }
        }
        TextUtil.fillTextNL(text, x, y);
    }
}

export default TextureCreator;