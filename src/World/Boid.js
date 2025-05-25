import * as THREE from 'three'
import { utils } from '../Utils/BoidUtils'
import App from '../App'

const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
})

export default class Boid {
    constructor(scene, position, origin, radius, quaternion, colour) {
        this.app = new App()
        this.scene = scene
        const { mesh, geometry } = this.getBoid(position, quaternion, colour)
        this.mesh = mesh
        this.geometry = geometry
        this.origin = origin
        this.boundaryRadius = radius

        //parametters
        this.minSpeed = 0.03
        this.maxSpeed = 0.03
        this.numSamplesForSmoothing = 10
        this.cohesionWeight = 0.5
        this.separationWeight = 0.5
        this.alignmentWeight = 0.2
        this.visionRange = 0.5

        // re-usable acceleration vector
        this.acceleration = new THREE.Vector3()

        // velocity is speed in a given direction, and in the update method we'll
        // compute an acceleration that will change the velocity
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        )

        // remember the last however many velocities so we can smooth the heading of the boid
        this.velocitySamples = []

        this.wanderTarget = new THREE.Vector3(mesh.position.x, mesh.position.y, 300)

        this.counter = 0
        this.wanderCounter = 0
        this.arrows = []
    }

    getBoid(position = new THREE.Vector3(0, 0, 0), quaternion = null, color = 0x156289) {
        const fishAsset = this.app.assetManager.getItem('FishModel1') // ou autre nom selon ton AssetManager

        let baseMesh = null
        fishAsset.scene.traverse(child => {
            if (child.isMesh && !baseMesh) {
                baseMesh = child
            }
        })

        if (!baseMesh) {
            console.warn('No mesh found in FishBoid, fallback to cone')
            const geometry = new THREE.ConeGeometry(0.2, 0.5, 5)
            geometry.rotateX(THREE.MathUtils.degToRad(90))
            const material = new THREE.MeshPhongMaterial({
                color,
                emissive: 0x072534,
                side: THREE.DoubleSide,
                flatShading: true,
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.copy(position)
            if (quaternion) mesh.quaternion.copy(quaternion)
            return { mesh, geometry }
        }

        if (!baseMesh.geometry.userData.rotationFixed) {
            baseMesh.geometry.rotateY(-Math.PI / 2)
            baseMesh.geometry.rotateZ(Math.PI / 2)
            baseMesh.geometry.userData.rotationFixed = true // ← flag de sécurité
        }
        const mesh = new THREE.Mesh(baseMesh.geometry, baseMesh.material)
        mesh.matrixAutoUpdate = true
        mesh.castShadow = true
        mesh.receiveShadow = true

        mesh.scale.setScalar(0.1)

        mesh.position.copy(position)
        if (quaternion) {
            mesh.quaternion.copy(quaternion)
        }

        return {
            mesh,
            geometry: baseMesh.geometry,
        }
    }

    /**
     * The boid will update its "steer vector" based on:
     * - Collision Avoidance: avoid collisions with nearby flockmates (and other obstacles)
     * - Velocity Matching: attempt to match velocity with nearby flockmates
     * - Flock Centering: attempt to stay close to nearby flockmates
     *
     * Alternative definitions for the above terms are:
     * - separation: steer to avoid crowding local flockmates
     * - alignment: steer towards the average heading of local flockmates
     * - cohesion: steer to move towards the average position (center of mass) of local flockmates
     */
    update(delta, neighbours, obstacles) {
        this.counter++
        this.wanderCounter++

        this.stayInBoundary(delta)

        // steering behaviour: alignment
        this.acceleration.add(
            this.alignment(delta, neighbours).multiplyScalar(this.alignmentWeight)
        )

        // steering behaviour: cohesion
        this.acceleration.add(this.cohesion(delta, neighbours).multiplyScalar(this.cohesionWeight))

        // steering behaviour: separation
        this.acceleration.add(
            this.separation(delta, neighbours).multiplyScalar(this.separationWeight)
        )

        // avoid collisions with world obstacles
        var originPoint = this.mesh.position.clone()
        const positionAttribute = this.geometry.attributes.position
        var localVertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, 0)
        var globalVertex = localVertex.applyMatrix4(this.mesh.matrix)
        var directionVector = globalVertex.sub(this.mesh.position)
        var raycaster = new THREE.Raycaster(
            originPoint,
            directionVector.clone().normalize(),
            0,
            this.visionRange
        )

        // obstacle meshes are Group, and the first child is the mesh we want to ray-trace
        var collisionResults = raycaster.intersectObjects(obstacles.map(o => o))
        if (collisionResults.length > 0) {
            // flee from the object
            var seek = this.seek(delta, collisionResults[0].point)
            this.acceleration.add(seek.negate().multiplyScalar(100))

            // gently dodge object
            for (var i = 0; i < utils.sphereCastDirections.length; i++) {
                const direction = utils.sphereCastDirections[i]
                raycaster = new THREE.Raycaster(originPoint, direction, 0, this.visionRange)
                var spectrumCollision = raycaster.intersectObject(collisionResults[0].object)
                if (spectrumCollision.length === 0) {
                    this.acceleration.add(direction.clone().multiplyScalar(100))
                    break
                }
            }
        }

        this.applyAcceleration(delta)

        this.lookWhereGoing()
    }

    stayInBoundary(delta) {
        const toCenter = this.origin.clone().sub(this.mesh.position)
        const distance = toCenter.length()

        if (distance > this.boundaryRadius) {
            // Appliquer une force pour revenir au centre
            toCenter.normalize()
            toCenter.multiplyScalar(this.maxSpeed)
            const steer = toCenter.sub(this.velocity)
            const maxForce = delta * 5
            steer.clampLength(0, maxForce)
            this.acceleration.add(steer)
        }
    }

    applyAcceleration(delta) {
        this.velocity.add(this.acceleration)
        this.acceleration.set(0, 0, 0) // reset
        this.velocity.clampLength(this.minSpeed, this.maxSpeed)
        this.mesh.position.add(this.velocity)
    }

    /**
     * Once the boid reaches a stationary target, and the target doesn't change, it will flip/flop on the spot.
     * That's because the old velocity is retained.
     * @param {*} delta
     * @param {*} target
     */
    seek(delta, target) {
        var steerVector = target.clone().sub(this.mesh.position)
        steerVector.normalize()
        steerVector.multiplyScalar(this.maxSpeed)
        steerVector.sub(this.velocity)

        var maxForce = delta * 5
        steerVector.clampLength(0, maxForce)
        return steerVector
    }

    /**
     * From the paper:
     * Collision Avoidance: avoid collisions with nearby flockmates (aka separation)
     *
     * Simply look at each neighbour, and if it's within a defined small distance (say 100 units),
     * then move it as far away again as it already is. This is done by subtracting from a vector
     * "steerVector" (initialised to zero) the displacement of each neighbour which is nearby.
     */
    separation(delta, neighbours, range = 3) {
        const steerVector = new THREE.Vector3()

        var neighbourInRangeCount = 0

        neighbours.forEach(neighbour => {
            // skip same object
            if (neighbour.mesh.id === this.mesh.id) return

            const distance = neighbour.mesh.position.distanceTo(this.mesh.position)
            if (distance <= range) {
                var diff = this.mesh.position.clone().sub(neighbour.mesh.position)
                diff.divideScalar(distance) // weight by distance
                steerVector.add(diff)
                neighbourInRangeCount++
            }
        })

        if (neighbourInRangeCount !== 0) {
            steerVector.divideScalar(neighbourInRangeCount)
            steerVector.normalize()
            steerVector.multiplyScalar(this.maxSpeed)
            var maxForce = delta * 5
            steerVector.clampLength(0, maxForce)
        }

        return steerVector
    }

    /**
     * Produces a steering force that keeps a boid's heading aligned with its neighbours.
     * (average velocity)
     *
     * @param {*} neighbours
     */
    alignment(delta, neighbours, range = 5) {
        let steerVector = new THREE.Vector3()
        const averageDirection = new THREE.Vector3()

        var neighboursInRangeCount = 0

        neighbours.forEach(neighbour => {
            // skip same object
            if (neighbour.mesh.id === this.mesh.id) return

            const distance = neighbour.mesh.position.distanceTo(this.mesh.position)
            if (distance <= range) {
                neighboursInRangeCount++
                averageDirection.add(neighbour.velocity.clone())
            }
        })

        if (neighboursInRangeCount > 0) {
            averageDirection.divideScalar(neighboursInRangeCount)
            averageDirection.normalize()
            averageDirection.multiplyScalar(this.maxSpeed)

            steerVector = averageDirection.sub(this.velocity)
            var maxForce = delta * 5
            steerVector.clampLength(0, maxForce)
        }

        return steerVector
    }

    /**
     * Produces a steering force that moves a boid toward the average position of its neighbours.
     *
     * @param {*} neighbours
     */
    cohesion(delta, neighbours, range = 5) {
        const centreOfMass = new THREE.Vector3()

        var neighboursInRangeCount = 0

        neighbours.forEach(neighbour => {
            // skip same object
            if (neighbour.mesh.id === this.mesh.id) return

            const distance = neighbour.mesh.position.distanceTo(this.mesh.position)
            if (distance <= range) {
                neighboursInRangeCount++
                centreOfMass.add(neighbour.mesh.position)
            }
        })

        if (neighboursInRangeCount > 0) {
            centreOfMass.divideScalar(neighboursInRangeCount)

            // "seek" the centre of mass
            return this.seek(delta, centreOfMass)
        } else {
            return new THREE.Vector3()
        }
    }

    rndCoord(origin) {
        return (Math.random() - 0.5) * this.boundaryRadius * 2
    }

    wander(delta) {
        var distance = this.mesh.position.distanceTo(this.wanderTarget)
        if (distance < 5) {
            // when we reach the target, set a new random target
            this.wanderTarget = new THREE.Vector3(
                this.rndCoord(this.origin.x),
                this.rndCoord(this.origin.y),
                this.rndCoord(this.origin.z)
            )
            this.wanderCounter = 0
        } else if (this.wanderCounter > 500) {
            this.wanderTarget = new THREE.Vector3(
                this.rndCoord(this.origin.x),
                this.rndCoord(this.origin.y),
                this.rndCoord(this.origin.z)
            )
            this.wanderCounter = 0
        }

        return this.seek(delta, this.wanderTarget)
    }

    lookWhereGoing(smoothing = true) {
        var direction = this.velocity.clone()
        if (smoothing) {
            if (this.velocitySamples.length == this.numSamplesForSmoothing) {
                this.velocitySamples.shift()
            }

            this.velocitySamples.push(this.velocity.clone())
            direction.set(0, 0, 0)
            this.velocitySamples.forEach(sample => {
                direction.add(sample)
            })
            direction.divideScalar(this.velocitySamples.length)
        }

        direction.add(this.mesh.position)
        this.mesh.lookAt(direction)
    }

    destroy() {
        // Remove the mesh from the scene
        if (this.scene && this.mesh) {
            this.scene.remove(this.mesh)
        }

        // Dispose of the geometry and material to free up memory
        if (this.geometry) {
            this.geometry.dispose()
        }
        if (this.mesh && this.mesh.material) {
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => material.dispose())
            } else {
                this.mesh.material.dispose()
            }
        }

        // Clear references
        this.mesh = null
        this.geometry = null
        this.scene = null
    }
}
