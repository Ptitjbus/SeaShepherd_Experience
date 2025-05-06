import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Object3D, Vector3 } from 'three'

export default class DoorPair {
    constructor(scene, position, width = 2, height = 4, colorLeft = 0xff0000, colorRight = 0x00ff00, epsilon = 0.01) {
        this.scene = scene
        this.width = width
        this.height = height
        this.isOpen = false
        this.isAnimating = false
        this.targetLeftRot = 0
        this.targetRightRot = 0

        // Pivots
        this.leftPivot = new Object3D()
        this.rightPivot = new Object3D()

        // Place les pivots pour que les portes soient côte à côte
        // Les pivots sont centrés sur Y et Z, et décalés sur X autour de la position centrale
        this.leftPivot.position.set(position.x - width, position.y, position.z)
        this.rightPivot.position.set(position.x + width, position.y, position.z)

        // Porte gauche
        const leftGeometry = new PlaneGeometry(width, height)
        const leftMaterial = new MeshBasicMaterial({ color: colorLeft, side: DoubleSide })
        this.leftDoor = new Mesh(leftGeometry, leftMaterial)
        this.leftDoor.position.set(width / 2 + epsilon, height / 2, 0) // Décalage pour le pivot sur le bord
        this.leftPivot.add(this.leftDoor)

        // Porte droite
        const rightGeometry = new PlaneGeometry(width, height)
        const rightMaterial = new MeshBasicMaterial({ color: colorRight, side: DoubleSide })
        this.rightDoor = new Mesh(rightGeometry, rightMaterial)
        this.rightDoor.position.set(-width / 2 - epsilon, height / 2, 0)
        this.rightPivot.add(this.rightDoor)

        this.scene.add(this.leftPivot)
        this.scene.add(this.rightPivot)
    }

    openAnimated() {
        if (this.isOpen || this.isAnimating) return
        this.targetLeftRot = -Math.PI / 2
        this.targetRightRot = Math.PI / 2
        this.isAnimating = true
    }

    closeAnimated() {
        if (!this.isOpen || this.isAnimating) return
        this.targetLeftRot = 0
        this.targetRightRot = 0
        this.isAnimating = true
    }

    update() {
        if (this.isAnimating) {
            this.leftPivot.rotation.y += (this.targetLeftRot - this.leftPivot.rotation.y) * 0.1
            this.rightPivot.rotation.y += (this.targetRightRot - this.rightPivot.rotation.y) * 0.1

            if (Math.abs(this.leftPivot.rotation.y - this.targetLeftRot) < 0.01 &&
                Math.abs(this.rightPivot.rotation.y - this.targetRightRot) < 0.01) {
                this.leftPivot.rotation.y = this.targetLeftRot
                this.rightPivot.rotation.y = this.targetRightRot
                this.isOpen = (this.targetLeftRot !== 0)
                this.isAnimating = false
            }
        }
    }

    isPlayerNear(playerPosition, threshold = 4) {
        // On prend le point central entre les deux pivots comme centre du binôme
        const center = new Vector3().addVectors(this.leftPivot.position, this.rightPivot.position).multiplyScalar(0.5)
        return center.distanceTo(playerPosition) < threshold
    }
}