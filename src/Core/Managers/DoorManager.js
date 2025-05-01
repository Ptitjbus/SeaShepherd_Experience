import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Object3D, Vector3 } from 'three'

import DoorPair from '../../Utils/DoorPairs'
import App from '../../App'

export default class DoorManager {
    constructor(scene) {
        this.scene = scene
        this.doorPairs = []
        this.app = new App()

        this.helpDiv = document.getElementById('door-help')
        
    }

    addDoorPair(position, width = 2, height = 4, colorLeft = 0xff0000, colorRight = 0x00ff00) {
        const pair = new DoorPair(this.scene, position, width, height, colorLeft, colorRight)
        this.doorPairs.push(pair)
        return pair
    }

    update() {
        const playerPosition = this.app.physicsManager.sphereBody.position
        const nearest = this.getNearestPairInRange(playerPosition, 4)
        
        if (nearest) {
            this.helpDiv.style.display = 'block'
        } else {
            this.helpDiv.style.display = 'none'
        }
        
        for (const pair of this.doorPairs) {
            pair.update()
            // Optionnel : tu peux ici gérer une animation d'ouverture automatique si le joueur est proche
            // if (pair.isPlayerNear(playerPosition)) { pair.openAnimated() }
        }
    }

    // Interaction manuelle : ouvre la porte la plus proche si assez proche
    openNearestPair(playerPosition) {
        let nearest = null
        let minDist = Infinity
        for (const pair of this.doorPairs) {
            const center = new Vector3().addVectors(pair.leftPivot.position, pair.rightPivot.position).multiplyScalar(0.5)
            const dist = center.distanceTo(playerPosition)
            if (dist < minDist) {
                minDist = dist
                nearest = pair
            }
        }
        if (nearest && nearest.isPlayerNear(playerPosition)) {
            nearest.openAnimated()
        }
    }

    closeNearestPair(playerPosition) {
        let nearest = null
        let minDist = Infinity
        for (const pair of this.doorPairs) {
            const center = new Vector3().addVectors(pair.leftPivot.position, pair.rightPivot.position).multiplyScalar(0.5)
            const dist = center.distanceTo(playerPosition)
            if (dist < minDist) {
                minDist = dist
                nearest = pair
            }
        }
        if (nearest && nearest.isPlayerNear(playerPosition)) {
            nearest.closeAnimated()
        }
    }

    getNearestPairInRange(playerPosition, threshold = 4) {
        let nearest = null
        let minDist = Infinity
        for (const pair of this.doorPairs) {
            const center = new Vector3().addVectors(pair.leftPivot.position, pair.rightPivot.position).multiplyScalar(0.5)
            const dist = center.distanceTo(playerPosition)
            if (dist < minDist) {
                minDist = dist
                nearest = pair
            }
        }
        if (nearest && nearest.isPlayerNear(playerPosition, threshold)) {
            return nearest
        }
        return null
    }
}