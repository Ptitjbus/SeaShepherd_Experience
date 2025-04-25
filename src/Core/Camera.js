    import { PerspectiveCamera, Vector3, Euler, Quaternion } from "three"
    import EventEmitter from "../Utils/EventEmitter"
    import App from "../App"
    import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'


    export default class Camera extends EventEmitter {
        constructor() {
            super()

            this.app = new App()

            this.mainCamera = null

            this.perspective = null
            this.controls = null

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

            this.init()
        }

        async init() {
            this.perspective = new PerspectiveCamera(70, this.app.canvasSize.aspect, 0.1, 500)
            this.perspective.position.set(-20, 2, 0)
            this.perspective.rotation.set(0, 90, 0)

            this.mainCamera = this.perspective
            this.allCameras.push(this.perspective)
            this.app.canvasSize.on('resize', this.resizeHandlerBound)

            this.animate()
        }

        initControls() {
            this.controls = new PointerLockControls(this.perspective, this.app.canvas)
        
            document.addEventListener('pointerlockchange', () => {
                this.isPointerLocked = document.pointerLockElement === this.app.canvas
            })
                
            this.app.canvas.addEventListener('mousedown', (e) => {
                if (!this.isPointerLocked) {
                    this.app.canvas.requestPointerLock()
                }
            })
        
            // document.addEventListener('mouseup', () => {
            //     if (this.isPointerLocked) {
            //         document.exitPointerLock()
            //     }
            // })

            document.addEventListener('keydown', (e) => {
                this.keysPressed.add(e.key.toLowerCase())
            })
            
            document.addEventListener('keyup', (e) => {
                this.keysPressed.delete(e.key.toLowerCase())
            })
        
            // Optionnel : bloquer le clic droit
            this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
        }
        

        resizeHandler(data) {
            const {aspect} = data

            this.mainCamera.aspect = aspect
            this.mainCamera.updateProjectionMatrix()
        }

        switchCamera() {
            const index = (this.allCameras.indexOf(this.mainCamera) + 1) % this.allCameras.length
            this.mainCamera = this.allCameras[index]

            // Si la caméra vient d'un modèle et a une matrice appliquée, force l'update
            this.mainCamera.updateMatrixWorld(true)
        }

        animate() {
            
            if (this.breathing) {
                this.time = Date.now() * this.breathingSpeed 
                const breathingOffset = Math.sin(this.time) * (this.breathingAmplitude * 0.001)
                this.mainCamera.position.y += breathingOffset
            }

            if (this.isPointerLocked) {
                const direction = new Vector3()
                const velocity = new Vector3()
            
                this.controls.getDirection(direction)
            
                // Déplacement horizontal
                if (this.keysPressed.has('z')) velocity.add(direction)
                if (this.keysPressed.has('s')) velocity.sub(direction)
            
                const right = new Vector3().crossVectors(this.mainCamera.up, direction).normalize()
                if (this.keysPressed.has('q')) velocity.add(right)
                if (this.keysPressed.has('d')) velocity.sub(right)
            
                // Déplacement vertical
                if (this.keysPressed.has('e')) velocity.y += 1
                if (this.keysPressed.has('a')) velocity.y -= 1

                const isSprinting = this.keysPressed.has('shift')
                const speed = this.moveSpeed * (isSprinting ? this.sprintMultiplier : 1)

                velocity.normalize().multiplyScalar(speed)
                this.perspective.position.add(velocity)
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