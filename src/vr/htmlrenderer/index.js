import * as Three from "three";

import VRHandler from "..";
import TextureCreator from "./texture";
import Direction from "../util/direction";
import TypeConverter from "../util/typeconverter";

import tagpairs from "./tagpairs";

class VHTMLRenderer {
    constructor(vrHandler) {
        /**
         * @type {VRHandler}
         */
        this.vrHandler = vrHandler;

        /**
         * @type {Three.Group}
         */
        this.group = null;
        this.centerPoint = [0, 2, -5];

        this.domParser = new DOMParser();
        this.texLoader = new Three.TextureLoader();
        this.texCreator = new TextureCreator();

        /**
         * @type {Array<Three.Object3D>}
         */
        this.animateObjects = [];
        this.animate();
    }

    clear() {
        this.animateObjects = [];
        this.group.clear();
    }
    animate() {
        for (const objClass of this.animateObjects) {
            objClass.animate();
        }

        requestAnimationFrame(() => {
            this.animate();
        });
    }
    _create(html) {
        this.group.position.set(...this.centerPoint);

        const tree = this.domParser.parseFromString(html, 'application/xml');
        const rootNode = tree.children.item(0);
        if (!rootNode || rootNode.tagName !== 'xml') {
            throw new Error('No root node under tag XML');
        }

        const children = TypeConverter.HTMLCollectionToArray(rootNode.children);
        for (const child of children) {
            this.renderElement(child, this.group);
        }
    }
    create(html) {
        try {
            this._create(html);
        } catch (error) {
            this.panic(`Failed to render XML page.\n${error}`);
            throw error;
        }
    }
    panic(error = 'Unknown Error') {
        // this code is really bad but its all canvas 2d's fault
        this.texCreator.ctx.font = '24px Arial';
        this.texCreator.ctx.textAlign = 'center';
        const textSize = this.texCreator.getTextureSizeText(error);
        this.texCreator.prepare(textSize.width, textSize.height);
        this.texCreator.ctx.fillStyle = 'white';
        this.texCreator.ctx.strokeStyle = 'black';
        this.texCreator.ctx.font = '24px Arial';
        this.texCreator.ctx.textAlign = 'center';
        this.texCreator.createText(error, true, textSize.width / 2, 0);

        const textTextureURL = this.texCreator.export();
        const planeTexture = this.texLoader.load("https://penguinmod.com/vr/warning.png");
        const errorMsgTexture = this.texLoader.load(textTextureURL);

        const planeGeometry = new Three.PlaneGeometry(1.5, 1.5);
        const errorGeometry = new Three.PlaneGeometry(textSize.width / 64, textSize.height / 64);
        const warningMaterial = new Three.MeshBasicMaterial({
            map: planeTexture,
            transparent: true,
            side: Three.DoubleSide,
        });
        const errorMsgMaterial = new Three.MeshBasicMaterial({
            map: errorMsgTexture,
            transparent: true,
            side: Three.DoubleSide,
        });
        const planeObject = new Three.Mesh(planeGeometry, warningMaterial);
        planeObject.position.set(0, 1, 0);
        planeObject.rotateX(Direction.toRad(0));
        const errorObject = new Three.Mesh(errorGeometry, errorMsgMaterial);
        errorObject.position.set(0, -0.5, 0);
        errorObject.rotateX(Direction.toRad(0));

        this.group.add(planeObject);
        this.group.add(errorObject);
    }

    /**
     * Renders an unknown tag element in Three.js
     * @param {HTMLElement} element
     * @param {HTMLElement} parent
     */
    renderDefaultNode(element, parent) {
        const text = (element.innerHTML || element.nodeValue || '').replace(/\n/g, ' ');

        // this code is really bad but its all canvas 2d's fault
        this.texCreator.ctx.font = '14px Arial';
        this.texCreator.ctx.textAlign = 'left';
        const textSize = this.texCreator.getTextureSizeText(text);
        this.texCreator.prepare(textSize.width, textSize.height);
        this.texCreator.ctx.fillStyle = 'black';
        this.texCreator.ctx.font = '14px Arial';
        this.texCreator.ctx.textAlign = 'left';
        this.texCreator.createText(text, false, 0, 0);

        const textTextureURL = this.texCreator.export();
        const textMsgTexture = this.texLoader.load(textTextureURL);
        const textGeometry = new Three.PlaneGeometry(textSize.width / 64, textSize.height / 64);
        const textMsgMaterial = new Three.MeshBasicMaterial({
            map: textMsgTexture,
            transparent: true,
            side: Three.DoubleSide,
        });

        const textObject = new Three.Mesh(textGeometry, textMsgMaterial);
        textObject.rotateX(Direction.toRad(0));

        parent.add(textObject);
    }
    /**
     * Renders an element in Three.js
     * @param {HTMLElement} element
     * @param {HTMLElement} parent
     */
    renderElement(element, parent) {
        const elementClass = tagpairs[element.tagName];
        let elementInst;
        if (elementClass) {
            elementInst = new elementClass(element, parent, this);
            elementInst.render();
        } else {
            this.renderDefaultNode(element, parent);
        }

        if (elementInst && elementInst.object && elementInst.animate) {
            this.animateObjects.push(elementInst);
        }

        const children = TypeConverter.HTMLCollectionToArray(element.childNodes);
        for (const child of children) {
            this.renderElement(child, elementInst ? elementInst.object : parent);
        }
    }
}

export default VHTMLRenderer;