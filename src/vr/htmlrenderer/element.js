class VHTMLElement {
    constructor(element, parentObject, renderer) {
        this.parentObject = parentObject;
        this.element = element;

        this.renderer = renderer;
    }

    getAttributes() {
        const attributes = {};
        const attribNames = this.element.getAttributeNames();
        for (const name of attribNames) {
            attributes[name] = String(this.element.getAttribute(name));
        }
        return attributes;
    }
}

export default VHTMLElement;