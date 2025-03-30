import FontUtil from "./font";

class TextUtil {
    static ctx = null;

    static _drawTextNLType(type, text, x, y, ...args) {
        const split = text.split('\n');
        const fontSize = FontUtil.getFontSize(this.ctx.font);
        let initialY = y;
        for (const line of split) {
            this.ctx[type](line, x, initialY, ...args);
            initialY += fontSize;
        }
    }
    static fillTextNL(text, x, y, ...args) {
        this._drawTextNLType('fillText', text, x, y, ...args);
    }
    static strokeTextNL(text, x, y, ...args) {
        this._drawTextNLType('strokeText', text, x, y, ...args);
    }
}

export default TextUtil;