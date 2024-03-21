import * as Three from "three";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";
import Direction from "./util/direction";
import VHTMLRenderer from "./htmlrenderer";
import NineSlices from "./htmlrenderer/texture/nineslice";
// import BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
// import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
// import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const SESSION_TYPE = "immersive-vr";

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
         * @type {VHTMLRenderer}
         */
        this.htmlRenderer = new VHTMLRenderer(this);

        /**
         * Whether or not a session has been created.
         * @type {boolean}
         */
        this.isStarted = false;
        /**
         * @type {XRSession}
         */
        this.session = null;

        /**
         * @type {Three.Group}
         */
        this.group = null;
        /**
         * @type {Three.Group}
         */
        this.htmlPage = null;

        /**
         * @type {Three.Raycaster}
         */
        this.raycaster = null;
        this.tempMatrix = new Three.Matrix4();

        this.audioElements = {
            background: new Audio("https://penguinmod.com/vr/wind.mp3"),

            type: new Audio("https://penguinmod.com/vr/type.mp3"),
            hover: new Audio("https://penguinmod.com/vr/hover.mp3"),
            enter: new Audio("https://penguinmod.com/vr/enter.mp3"),
            deselect: new Audio("https://penguinmod.com/vr/deselect.mp3"),
        };
    }

    static isSupported() {
        if (!("xr" in navigator)) return false;
        return navigator.xr.isSessionSupported(SESSION_TYPE);
    }

    pauseAudioElements() {
        for (const audioElement in this.audioElements) {
            /**
             * @type {HTMLAudioElement}
             */
            const audio = this.audioElements[audioElement];
            if (audio) {
                audio.pause();
            }
        }
    }
    static requestMessage(key) {
        console.warn('VRHandler.requestMessage should be overridden, or don\'t use translation keys in this application.');
        return `!! ${key} !!`;
    }

    _disposeImmersive() {
        this.session = null;
        this.hideVrCanvas();
        this.pauseAudioElements();
        if (!this.renderer) return;
        this.renderer.xr.enabled = false;
    }
    async _createImmersive() {
        const renderer = this.renderer;
        if (!renderer) return false;

        const sessionInit = {
            optionalFeatures: [
                "local-floor",
                "bounded-floor",
                "hand-tracking",
                "layers",
            ],
        };
        const session = await navigator.xr.requestSession(
            SESSION_TYPE,
            sessionInit
        );
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
        };
        session.requestAnimationFrame(drawFrame);

        // reference space
        session.requestReferenceSpace("local").then((space) => {
            this.localSpace = space;
        });

        // play audio
        this.playSessionAudio();

        return session;
    }
    showVrCanvas() {
        try {
            const canvas = this.renderer.domElement;
            canvas.style.display = "";
        } catch {
            console.warn("tried to show VR canvas");
        }
    }
    hideVrCanvas() {
        try {
            const canvas = this.renderer.domElement;
            canvas.style.display = "none";
        } catch {
            console.warn("tried to hide VR canvas");
        }
    }

    playSessionAudio() {
        this.audioElements.background.loop = true;
        this.audioElements.background.volume = 0.125;
        this.audioElements.background.play();
    }

    async initialize() {
        // load required textures
        await NineSlices.loadImages();

        this.scene = new Three.Scene();
        this.renderer = new Three.WebGLRenderer({
            // TODO: is this appropriate config for our use-case?
            preserveDrawingBuffer: true,
            alpha: true,
        });
        this.renderer.setSize(1920, 1080); // TODO: is this too large or does it even matter?
        this.renderer.setClearColor(0x000000, 1);
        this.hideVrCanvas();
        this.camera = new Three.PerspectiveCamera(70, 1920 / 1080, 0.1, 1000);
        // skybox
        const cubeTexLoader = new Three.CubeTextureLoader();
        const skyboxTexture = cubeTexLoader.load([
            "https://penguinmod.com/vr/skybox_right.png",
            "https://penguinmod.com/vr/skybox_left.png",
            "https://penguinmod.com/vr/skybox_top.png",
            "https://penguinmod.com/vr/skybox_bottom.png",
            "https://penguinmod.com/vr/skybox_front.png",
            "https://penguinmod.com/vr/skybox_back.png",
        ]);
        this.scene.background = skyboxTexture;

        this.group = new Three.Group();
        this.scene.add(this.group);
        this.htmlPage = new Three.Group();
        this.group.add(this.htmlPage);

        this.htmlRenderer.group = this.htmlPage;

        // platform
        const texLoader = new Three.TextureLoader();
        const platformTexture = texLoader.load(
            "https://penguinmod.com/vr/platform.png"
        );
        const platformGeometry = new Three.PlaneGeometry(1, 1);
        const platformMaterial = new Three.MeshBasicMaterial({
            map: platformTexture,
            side: Three.DoubleSide,
        });
        const platformObject = new Three.Mesh(platformGeometry, platformMaterial);
        platformObject.position.set(0, 0, 0);
        platformObject.rotateX(Direction.toRad(90));
        this.scene.add(platformObject);

        // controllers
        const controller1 = this.renderer.xr.getController(0);
        controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.scene.add(controller1);

        const controller2 = this.renderer.xr.getController(1);
        controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
        controller2.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.scene.add(controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        controllerGrip1.add(
            controllerModelFactory.createControllerModel(controllerGrip1)
        );
        this.scene.add(controllerGrip1);

        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        controllerGrip2.add(
            controllerModelFactory.createControllerModel(controllerGrip2)
        );
        this.scene.add(controllerGrip2);

        // light
        const light = new Three.SpotLight(0xffffff, 120);
        light.position.set(0, 5, 2.5);
        this.scene.add(light);

        // line
        const lineGeometry = new Three.BufferGeometry().setFromPoints([
            new Three.Vector3(0, 0, 0),
            new Three.Vector3(0, 0, -1),
        ]);

        const line = new Three.Line(lineGeometry);
        line.name = "line";
        line.scale.z = 5;

        controller1.add(line.clone());
        controller2.add(line.clone());

        this.raycaster = new Three.Raycaster();
        
        // exit button
        const exitTexture = texLoader.load("https://penguinmod.com/vr/exit.png");
        const exitProgressTexture = texLoader.load("https://penguinmod.com/vr/white.png");
        const exitMaterial = new Three.MeshBasicMaterial({
            map: exitTexture,
            transparent: true,
            side: Three.DoubleSide,
        });
        const exitProgressMaterial = new Three.MeshBasicMaterial({
            map: exitProgressTexture,
            side: Three.DoubleSide,
        });
        const exitObject = new Three.Mesh(platformGeometry, exitMaterial);
        const exitProgressObject = new Three.Mesh(platformGeometry, exitProgressMaterial);
        // exitObject.userData.button = true;
        // exitObject.userData.buttonOpcode = 'exiting';
        exitProgressObject.userData.interactable = false;

        exitObject.position.set(0, 2, 3);
        exitProgressObject.position.set(0, 2, 2.999);
        exitProgressObject.scale.set(1, 0, 1);

        this.group.add(exitObject);
        this.group.add(exitProgressObject);
    }

    start() {
        if (this.isStarted) return;
        if (this.session) return;
        return this._createImmersive();
    }
    close() {
        this.isStarted = false;
        this.hideVrCanvas();
        this.pauseAudioElements();
        if (!this.session) return;
        return this.session.end();
    }
    loadPage(html) {
        this.htmlRenderer.clear();
        this.htmlRenderer.create(html);
    }

    onSelectStart(event) {
        const controller = event.target;
        const intersections = this.getIntersections(controller);
        console.log(intersections);
        if (intersections.length > 0) {
            const intersection = intersections[0];

            const object = intersection.object;
            this.audioElements.hover.currentTime = 0;
            this.audioElements.hover.play();
            controller.attach(object);

            controller.userData.selected = object;
        }
        controller.userData.targetRayMode = event.data.targetRayMode;
    }
    onSelectEnd(event) {
        const controller = event.target;

        if (controller.userData.selected !== undefined) {
            const object = controller.userData.selected;
            this.audioElements.hover.pause();
            this.audioElements.deselect.currentTime = 0;
            this.audioElements.deselect.play();
            this.group.attach(object);

            controller.userData.selected = undefined;
        }
    }
    getIntersections(controller) {
		controller.updateMatrixWorld();
		this.tempMatrix.identity().extractRotation(controller.matrixWorld);
		this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
		this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this.tempMatrix);
		return this.raycaster.intersectObjects(this.group.children, false);
	}
}

export default VRHandler;
