import * as CANNON from 'cannon-es'
import App from '../../App'
import { PointerLockControlsCannon } from '../PointerLockControlsCannon'

let physicsManagerInstance = null

export default class PhysicsManager {
    constructor() {
        if (physicsManagerInstance !== null) {
            return physicsManagerInstance
        }
        physicsManagerInstance = this
        this.app = new App()

        this.world = null
        this.physicsMaterial = null
        this.sphereBody = null
        this.controls = null
        this.timeStep = 1 / 60

        this.bodies = []

        this.initCannon()
        this.initPointerLock()
    }

    initCannon() {
        this.world = new CANNON.World()

        // Tweak contact properties.
        // Contact stiffness - use to make softer/harder contacts
        this.world.defaultContactMaterial.contactEquationStiffness = 1e9

        // Stabilization time in number of timesteps
        this.world.defaultContactMaterial.contactEquationRelaxation = 4

        const solver = new CANNON.GSSolver()
        solver.iterations = 7
        solver.tolerance = 0.1
        this.world.solver = new CANNON.SplitSolver(solver)
        // use this to test non-split solver
        // this.world.solver = solver

        this.world.gravity.set(0, -50, 0)

        // Create a slippery material (friction coefficient = 0.0)
        this.physicsMaterial = new CANNON.Material('physics')
        const physics_physics = new CANNON.ContactMaterial(
            this.physicsMaterial,
            this.physicsMaterial,
            {
                friction: 0.0,
                restitution: 0.3,
            }
        )

        // We must add the contact materials to the world
        this.world.addContactMaterial(physics_physics)

        // Create the user collision sphere
        const radius = 1.3
        const sphereShape = new CANNON.Sphere(radius)
        this.sphereBody = new CANNON.Body({ mass: 25, material: this.physicsMaterial })
        this.sphereBody.addShape(sphereShape)
        this.sphereBody.position.set(0, 1, 0)
        this.sphereBody.linearDamping = 0.9
        this.world.addBody(this.sphereBody)

        // Create the ground plane
        const groundShape = new CANNON.Plane()
        const groundBody = new CANNON.Body({ mass: 0, material: this.physicsMaterial })
        groundBody.addShape(groundShape)
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        this.world.addBody(groundBody)
    }

    initPointerLock() {
        this.controls = new PointerLockControlsCannon(this.app.camera.mainCamera, this.sphereBody)
        this.controls.canJump = false

        this.app.scene.add(this.controls.getObject())

        this.app.canvas.addEventListener('click', () => {
            this.controls.lock()
        })

        this.controls.addEventListener('lock', () => {
            this.controls.enabled = true
        })

        this.controls.addEventListener('unlock', () => {
            this.controls.enabled = false
        })
    }

    freezePlayer() {
        this.app.physicsManager.controls.moveForward = false
        this.app.physicsManager.controls.moveBackward = false
        this.app.physicsManager.controls.moveLeft = false
        this.app.physicsManager.controls.moveRight = false
        this.app.physicsManager.controls.moveUp = false
        this.app.physicsManager.controls.moveDown = false
        this.app.physicsManager.controls.velocityFactor = 0
    }

    unfreezePlayer() {
        this.app.physicsManager.controls.moveForward = true
        this.app.physicsManager.controls.moveBackward = true
        this.app.physicsManager.controls.moveLeft = true
        this.app.physicsManager.controls.moveRight = true
        this.app.physicsManager.controls.moveUp = true
        this.app.physicsManager.controls.moveDown = true
        this.app.physicsManager.controls.velocityFactor = 1
    }

    addBody(body) {
        this.world.addBody(body)
        this.bodies.push(body)
    }

    removeBody(body) {
        if (!body) return
        this.world.removeBody(body)
        this.bodies = this.bodies.filter(b => b !== body)
    }

    update(deltaTime) {
        this.world.step(this.timeStep, deltaTime, 3)
        this.controls.update(deltaTime)
        this.controls.getObject().updateMatrixWorld(true)
    }

    createBox(dimensions, options, mesh) {
        const shape = new CANNON.Box(
            new CANNON.Vec3(dimensions.width / 2, dimensions.height / 2, dimensions.depth / 2)
        )

        const body = new CANNON.Body({
            mass: options.mass || 0,
            position: new CANNON.Vec3(options.position.x, options.position.y, options.position.z),
            shape: shape,
            material: new CANNON.Material({
                friction: options.material?.friction || 0.3,
                restitution: options.material?.restitution || 0.3,
            }),
        })

        // Stocker le mesh associé pour faciliter la synchronisation
        body.mesh = mesh

        this.world.addBody(body)
        return body
    }

    updateBodyPosition(body, position) {
        if (!body) return

        body.position.set(position.x, position.y, position.z)
        body.wakeUp() // Réveiller le corps pour qu'il réagisse aux collisions
    }
}
