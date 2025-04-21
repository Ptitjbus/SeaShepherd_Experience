import { PerspectiveCamera } from "three";
import EventEmitter from "../Utils/EventEmitter";
import App from "../App";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import CameraManager from "./CameraManager";

export default class Camera extends EventEmitter {
    constructor() {
        super()

        this.app = new App()

        this.mainCamera = null

        this.perspective = null
        this.controls = null
        this.cameraManager = null;

        this.resizeHandlerBound = this.resizeHandler.bind(this)
        this.animation = this.animate.bind(this)

        this.breathing = true
        this.initialY = 1.5
        this.breathingAmplitude = 0.3
        this.breathingSpeed = 0.0015
        this.breathingRotation = 0.0015
        this.time = 0

        this.allCameras = []

        this.init()
    }

    async init() {
        this.perspective = new PerspectiveCamera(70, this.app.canvasSize.aspect, 0.1, 1000)
        this.perspective.position.set(2, 1, 12)

        this.mainCamera = this.perspective

        this.allCameras.push(this.perspective)

        this.controls = new OrbitControls(this.perspective, this.app.canvas)
        // set the center of the orbit to the center of the scene
        this.controls.target.set(0, 1, 14)

        // this.cameraManager = new CameraManager(this);

        this.app.canvasSize.on('resize', this.resizeHandlerBound)

        this.animate()
    }

    resizeHandler(data) {
        const {aspect} = data

        this.mainCamera.aspect = aspect
        this.mainCamera.updateProjectionMatrix()
    }

    switchCamera() {
        const index = (this.allCameras.indexOf(this.mainCamera) + 1) % this.allCameras.length;
        this.mainCamera = this.allCameras[index];

        // Si la caméra vient d'un modèle et a une matrice appliquée, force l'update
        this.mainCamera.updateMatrixWorld(true);

        // Si tu veux que OrbitControls suive aussi cette nouvelle caméra
        // this.controls.object = this.mainCamera;
        // this.controls.update();
    }

    animate() {

        if (this.breathing) {
            this.time = Date.now() * this.breathingSpeed 
            const breathingOffset = Math.sin(this.time) * (this.breathingAmplitude * 0.001)
            this.mainCamera.position.y += breathingOffset
        }

        requestAnimationFrame(this.animation)
        
    }

    destroy() {
        this.app.canvasSize.off('resize')

        this.mainCamera = null
        this.controls = null
        this.breathing = null

        this.resizeHandlerBound = null
        this.breathingRotation = null

        this.app = null
    }
} 