import * as Three from "three";
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
// import BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
// import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
// import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const SESSION_TYPE = "immersive-vr";

function toRad(deg) {
    return deg * (Math.PI / 180);
}
function toDeg(rad) {
    return rad * (180 / Math.PI);
}

class VRHandler {
    constructor() {
        /**
         * @type {Three.Scene}
         */
        this.scene = null;
        /**
         * @type {Three.Camera}
         */
        this.camera = null;
        /**
         * @type {Three.WebGLRenderer}
         */
        this.renderer = null;

        /**
         * Whether or not a session has been created.
         * @type {boolean}
         */
        this.isStarted = false;
        /**
         * @type {XRSession}
         */
        this.session = null;
    }

    static isSupported() {
        if (!('xr' in navigator)) return false;
        return navigator.xr.isSessionSupported(SESSION_TYPE);
    }
    
    _disposeImmersive() {
        this.session = null;
        if (!this.renderer) return;
        this.renderer.xr.enabled = false;
        this.hideVrCanvas();
    }
    async _createImmersive() {
        const renderer = this.renderer;
        if (!renderer) return false;

        const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] };
        const session = await navigator.xr.requestSession(SESSION_TYPE, sessionInit);
        this.session = session;
        this.isStarted = true;

        // enable xr on three.js
        renderer.xr.enabled = true;
        await renderer.xr.setSession(session);
        this.showVrCanvas();

        session.addEventListener("end", () => {
            this.isStarted = false;
            this.hideVrCanvas();
            this._disposeImmersive();
        });

        // setup render loop
        const drawFrame = () => {
            // breaks the loop once the session has ended
            if (!this.isStarted) return;

            // break loop if no camera or scene
            if (!this.camera) return;
            if (!this.scene) return;

            renderer.render(this.scene, this.camera);
            session.requestAnimationFrame(drawFrame);
        }
        session.requestAnimationFrame(drawFrame);

        // reference space
        session.requestReferenceSpace("local").then(space => {
            this.localSpace = space;
        });

        return session;
    }
    showVrCanvas() {
        try {
            const canvas = this.renderer.domElement;
            canvas.style.display = "";
        } catch {
            console.warn('tried to show VR canvas');
        }
    }
    hideVrCanvas() {
        try {
            const canvas = this.renderer.domElement;
            canvas.style.display = "none";
        } catch {
            console.warn('tried to hide VR canvas');
        }
    }

    initialize() {
        this.scene = new Three.Scene();
        this.renderer = new Three.WebGLRenderer({ // TODO: is this appropriate config for our use-case?
            preserveDrawingBuffer: true,
            alpha: true
        });
        this.renderer.setSize(1920, 1080); // TODO: is this too large or does it even matter?
        this.renderer.setClearColor(0x000000, 1);
        this.hideVrCanvas();
        this.camera = new Three.PerspectiveCamera(70, 1920 / 1080, 0.1, 1000);
        // skybox
        const cubeTexLoader = new Three.CubeTextureLoader();
        const skyboxTexture = cubeTexLoader.load([
            'https://penguinmod.com/vr/skybox_right.png',
            'https://penguinmod.com/vr/skybox_left.png',
            'https://penguinmod.com/vr/skybox_top.png',
            'https://penguinmod.com/vr/skybox_bottom.png',
            'https://penguinmod.com/vr/skybox_front.png',
            'https://penguinmod.com/vr/skybox_back.png',
        ]);
        this.scene.background = skyboxTexture;
        // platform
        const texLoader = new Three.TextureLoader();
        const platformTexture = texLoader.load('https://penguinmod.com/vr/platform.png');
        const geometry = new Three.PlaneGeometry(1, 1);
        const material = new Three.MeshBasicMaterial({
            map: platformTexture,
            side: Three.DoubleSide
        });
        const platformObject = new Three.Mesh(geometry, material);
        platformObject.position.set(0, 0, 0);
        platformObject.rotateX(toRad(90));
        this.scene.add(platformObject);
		// controllers
		const controller1 = this.renderer.xr.getController(0);
		// controller1.addEventListener( 'selectstart', onSelectStart );
		// controller1.addEventListener( 'selectend', onSelectEnd );
		this.scene.add(controller1);

		const controller2 = this.renderer.xr.getController(1);
		// controller2.addEventListener( 'selectstart', onSelectStart );
		// controller2.addEventListener( 'selectend', onSelectEnd );
		this.scene.add(controller2);

		const controllerModelFactory = new XRControllerModelFactory();

		const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
		controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
		this.scene.add(controllerGrip1);

		const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
		controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
		this.scene.add(controllerGrip2);

        // light
        const light = new Three.SpotLight(0xffffff, 60);
        light.position.set(0, 5, 2.5)
        this.scene.add(light);
    }
    start() {
        if (this.isStarted) return;
        if (this.session) return;
        return this._createImmersive();
    }
    close() {
        this.isStarted = false;
        if (!this.session) return;
        return this.session.end();
    }
}

export default VRHandler;