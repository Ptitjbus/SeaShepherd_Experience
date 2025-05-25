import { PerspectiveCamera, Vector3, Raycaster } from 'three'
import EventEmitter from '../Utils/EventEmitter'
import App from '../App'

export default class Camera extends EventEmitter {
    constructor() {
        super()

        this.app = new App()

        this.mainCamera = null
        this.followCamera = null

        this.perspective = null

        this.resizeHandlerBound = this.resizeHandler.bind(this)
        this.animation = this.animate.bind(this)

        this.breathing = true
        this.initialY = 1.5
        this.breathingAmplitude = 0.3
        this.breathingSpeed = 0.0015
        this.breathingRotation = 0.0015
        this.time = 0

        this.allCameras = []

        this.isPointerLocked = false
        this.moveSpeed = 0.1
        this.sprintMultiplier = 4.0
        this.keysPressed = new Set()

        this.raycaster = new Raycaster()

        this.init()
    }

    async init() {
        this.perspective = new PerspectiveCamera(70, this.app.canvasSize.aspect, 0.1, 300)
        this.perspective.position.set(0, this.initialY, 0)

        this.mainCamera = this.perspective
        this.allCameras.push(this.perspective)
        this.app.canvasSize.on('resize', this.resizeHandlerBound)

        this.animate()
    }

    resizeHandler(data) {
        const { aspect } = data

        this.mainCamera.aspect = aspect
        this.mainCamera.updateProjectionMatrix()
    }

    switchCamera() {
        const index = (this.allCameras.indexOf(this.mainCamera) + 1) % this.allCameras.length
        this.mainCamera = this.allCameras[index]

        // Si la caméra vient d'un modèle et a une matrice appliquée, force l'update
        this.mainCamera.updateMatrixWorld(true)
        if (!this.app.physicsManager) return

        if (index === 0) {
            this.app.physicsManager.controls.enabled = true
        } else {
            this.app.physicsManager.controls.enabled = false
        }
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
        this.breathing = null

        this.resizeHandlerBound = null
        this.breathingRotation = null

        this.app = null
    }
}
