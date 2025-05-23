import * as THREE from 'three'
import * as CANNON from 'cannon-es'

class PointerLockControlsCannon extends THREE.EventDispatcher {
  constructor(camera, cannonBody) {
    super()

    this.enabled = false

    this.cannonBody = cannonBody

    this.smoothWalk = false

    // var eyeYPos = 2 // eyes are 2 meters above the ground
    this.velocityFactor = 0.5
    this.speed = 1.5
    this.jumpVelocity = 20

    this.pitchObject = new THREE.Object3D()
    this.pitchObject.add(camera)
    this.camera = camera

    this.yawObject = new THREE.Object3D()
    this.yawObject.position.y = 2
    this.yawObject.add(this.pitchObject)

    this.quaternion = new THREE.Quaternion()

    this.moveForward = false
    this.moveBackward = false
    this.moveLeft = false
    this.moveRight = false
    this.moveUp = false
    this.moveDown = false
    this.sprint = false

    this.canJump = false

    this.isLocked = true

    this.flyMode = false

    const contactNormal = new CANNON.Vec3() // Normal in the contact, pointing *out* of whatever the player touched
    const upAxis = new CANNON.Vec3(0, 1, 0)
    this.cannonBody.addEventListener('collide', (event) => {
      const { contact } = event
      // contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
      // We do not yet know which one is which! Let's check.
      if (contact.bi.id === this.cannonBody.id) {
        // bi is the player body, flip the contact normal
        contact.ni.negate(contactNormal)
      } else {
        // bi is something else. Keep the normal as it is
        contactNormal.copy(contact.ni)
      }

      // If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
      if (contactNormal.dot(upAxis) > 0.5) {
        // Use a "good" threshold value between 0 and 1 here!
        // this.canJump = true
      }
    })

    this.velocity = this.cannonBody.velocity

    // Moves the camera to the cannon.js object position and adds velocity to the object if the run key is down
    this.inputVelocity = new THREE.Vector3()
    this.euler = new THREE.Euler()

    this.lockEvent = { type: 'lock' }
    this.unlockEvent = { type: 'unlock' }

    this.connect()
  }

  connect() {
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerlockChange)
    document.addEventListener('pointerlockerror', this.onPointerlockError)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  disconnect() {
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('pointerlockchange', this.onPointerlockChange)
    document.removeEventListener('pointerlockerror', this.onPointerlockError)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }

  dispose() {
    this.disconnect()
  }

  lock() {
    document.body.requestPointerLock()
  }

  unlock() {
    document.exitPointerLock()
  }

  setFlyMode(enabled) {
    
    this.flyMode = enabled
  
    this.cannonBody.gravityScale = enabled ? 0 : 1  // Nécessite cannon-es >= 0.20
    this.cannonBody.velocity.set(0, 0, 0)
  
    if (enabled) {
      this.cannonBody.type = CANNON.Body.KINEMATIC  // Ignore les collisions dynamiques
    } else {
      this.cannonBody.type = CANNON.Body.DYNAMIC
    }
    console.log(`Fly mode: ${enabled ? 'enabled' : 'disabled'}`)
  }

  onPointerlockChange = () => {
    if (document.pointerLockElement) {
      this.dispatchEvent(this.lockEvent)

      this.isLocked = true
    } else {
      this.dispatchEvent(this.unlockEvent)

      this.isLocked = false
    }
  }

  onPointerlockError = () => {
    console.error('PointerLockControlsCannon: Unable to use Pointer Lock API')
  }

  onMouseMove = (event) => {
    if (!this.enabled) {
      return
    }

    const { movementX, movementY } = event

    this.yawObject.rotation.y -= movementX * 0.002
    this.pitchObject.rotation.x -= movementY * 0.002

    this.pitchObject.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitchObject.rotation.x))
  }

  onKeyDown = (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true
        break

      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true
        break

      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true
        break

      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true
        break

        case 'ShiftLeft':
        case 'ShiftRight':
          this.sprint = true
          break

        case 'KeyE':
          this.moveUp = true
          break

        case 'KeyQ':
          this.moveDown = true
          break

      case 'Space':
        if (this.canJump) {
          this.velocity.y = this.jumpVelocity
        }
        this.canJump = false
        break
    }
  }

  onKeyUp = (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false
        break

      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false
        break

      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false
        break

      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false
        break

      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprint = false
        break

      case 'KeyE':
        this.moveUp = false
        break
          
      case 'KeyQ':
        this.moveDown = false
        break
    }
  }

  getObject() {
    return this.yawObject
  }

  getDirection() {
    const vector = new CANNON.Vec3(0, 0, -1)
    vector.applyQuaternion(this.quaternion)
    return vector
  }

  update(delta) {
    if (!this.enabled) return

    delta = Math.max(0.016, Math.min(delta, 0.04))
    const speedFactor = delta * this.speed * (this.sprint ? 2 : 1) * 500

    this.inputVelocity.set(0, 0, 0)

    if (this.moveForward) {
      this.inputVelocity.z = -this.velocityFactor * speedFactor
    }
    if (this.moveBackward) {
      this.inputVelocity.z = this.velocityFactor * speedFactor
    }

    if (this.moveLeft) {
      this.inputVelocity.x = -this.velocityFactor * speedFactor
    }
    if (this.moveRight) {
      this.inputVelocity.x = this.velocityFactor * speedFactor
    }

    if (this.moveUp && this.flyMode) this.inputVelocity.y = this.velocityFactor * speedFactor
    if (this.moveDown && this.flyMode) this.inputVelocity.y = -this.velocityFactor * speedFactor
    
    // Add to the object
    if (this.flyMode){
      const yawEuler = new THREE.Euler(0, this.yawObject.rotation.y, 0, 'YXZ')
      const yawQuaternion = new THREE.Quaternion().setFromEuler(yawEuler)
      this.inputVelocity.applyQuaternion(yawQuaternion)

      this.velocity.x = this.inputVelocity.x * 2
      this.velocity.y = this.inputVelocity.y * 2
      this.velocity.z = this.inputVelocity.z * 2
    } else {
      // Convert velocity to world coordinates
      this.euler.x = this.pitchObject.rotation.x
      this.euler.y = this.yawObject.rotation.y
      this.euler.order = 'XYZ'
      this.quaternion.setFromEuler(this.euler)
      this.inputVelocity.applyQuaternion(this.quaternion)

      if (this.smoothWalk){
        this.velocity.x += this.inputVelocity.x 
        this.velocity.z += this.inputVelocity.z
      } else {
        this.velocity.x = this.inputVelocity.x 
        this.velocity.z = this.inputVelocity.z 
      }
    }

    this.yawObject.position.copy(this.cannonBody.position)
    this.yawObject.updateMatrixWorld(true);
    this.pitchObject.updateMatrixWorld(true);

  }
}

export { PointerLockControlsCannon }