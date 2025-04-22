import { PerspectiveCamera, Vector3, Euler, Quaternion } from "three";
import EventEmitter from "../Utils/EventEmitter";
import App from "../App";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import CameraManager from "./Managers/CameraManager";

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

        this.mouse = { x: 0, y: 0 }
        this.maxLookAngle = 0.05 // en radians, tu peux ajuster (environ 3°)
        this.lookSmoothness = 0.05 // plus petit = plus fluide
        this.lookAroundEnabled = true;
        this.baseRotation = new Map(); 

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

        this.baseTarget = new Vector3().copy(this.controls.target)
        this.currentTarget = new Vector3().copy(this.controls.target)

        window.addEventListener('mousemove', this.onMouseMove.bind(this))

        this.app.canvasSize.on('resize', this.resizeHandlerBound)

        this.animate()
    }

    resizeHandler(data) {
        const {aspect} = data

        this.mainCamera.aspect = aspect
        this.mainCamera.updateProjectionMatrix()
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -((event.clientY / window.innerHeight) * 2 - 1);
    }    

    switchCamera() {
        const index = (this.allCameras.indexOf(this.mainCamera) + 1) % this.allCameras.length;
        this.mainCamera = this.allCameras[index];

        if (!this.baseRotation.has(this.mainCamera)) {
            this.baseRotation.set(this.mainCamera, this.mainCamera.quaternion.clone());
        }

        // Si la caméra vient d'un modèle et a une matrice appliquée, force l'update
        this.mainCamera.updateMatrixWorld(true);
    }

    applyLookAroundOffset() {
        if (!this.lookAroundEnabled || !this.mainCamera) return;
    
        const xAngle = this.mouse.x * this.maxLookAngle;
        const yAngle = this.mouse.y * this.maxLookAngle;
    
        const euler = new Euler(-yAngle, xAngle, 0, 'YXZ');
        const offsetQuat = new Quaternion().setFromEuler(euler);
    
        // Important : il faut récupérer la rotation actuelle (mise à jour par l'animation), pas celle sauvegardée !
        const baseQuat = this.mainCamera.quaternion.clone();
        const targetQuat = baseQuat.clone().multiply(offsetQuat);
    
        this.mainCamera.quaternion.slerp(targetQuat, this.lookSmoothness);
    }

    animate() {
        requestAnimationFrame(this.animation);
    
        // Respiration (uniquement sur la caméra perspective de base)
        if (this.breathing && this.mainCamera === this.perspective) {
            this.time = Date.now() * this.breathingSpeed;
            const breathingOffset = Math.sin(this.time) * (this.breathingAmplitude * 0.001);
            this.mainCamera.position.y += breathingOffset;
        }
    
        // Effet "look around"
        if (this.lookAroundEnabled) {
            const xAngle = this.mouse.x * this.maxLookAngle;
            const yAngle = this.mouse.y * this.maxLookAngle;
    
            // Création d'un quaternion d'offset basé sur la souris
            const euler = new Euler(-yAngle, xAngle, 0, 'YXZ');
            const offsetQuat = new Quaternion().setFromEuler(euler);
    
            // Récupère la rotation de base de la caméra (initiale ou sauvegardée)
            const baseQuat = this.baseRotation.get(this.mainCamera) || this.mainCamera.quaternion.clone();
    
            // Applique l'offset à la rotation de base
            const targetQuat = baseQuat.clone().multiply(offsetQuat);
    
            // Interpolation fluide (slerp)
            this.mainCamera.quaternion.slerp(targetQuat, this.lookSmoothness);
        }
    
        // Si OrbitControls sont utilisés, on met à jour le target (utile pour la PerspectiveCamera)
        if (this.mainCamera === this.perspective) {
            const targetOffset = new Vector3(
                this.mouse.x * this.maxLookAngle,
                this.mouse.y * this.maxLookAngle,
                0
            );
    
            const newTarget = new Vector3().copy(this.baseTarget).add(targetOffset);
            this.currentTarget.lerp(newTarget, this.lookSmoothness);
            this.controls.target.copy(this.currentTarget);
            this.controls.update();
        }
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