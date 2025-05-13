import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Object3D, Vector3 } from 'three'

import DoorPair from '../../Utils/DoorPairs'
import App from '../../App'

export default class DoorManager {
    constructor(scene) {
        this.scene = scene
        this.doorPairs = []
        this.app = new App()
    }

    addDoorPair(position, width = 3, height = 5, colorLeft = 0x707070, colorRight = 0x707070, canBeOpened = true) {
        const pair = new DoorPair(this.scene, position, width, height, colorLeft, colorRight, true) // Sliding doors
        pair.setOpenable(canBeOpened); // Définir si la porte peut être ouverte
        this.doorPairs.push(pair)
        return pair
    }

    update() {
        const playerPosition = this.app.physicsManager.sphereBody.position
        const nearest = this.getNearestPairInRange(playerPosition, 7)
        // Mettre à jour toutes les paires de portes avec la position du joueur
        for (const pair of this.doorPairs) {
            pair.update(playerPosition)
        }
    }

    // Interaction manuelle : ouvre la porte la plus proche si assez proche
    openNearestPair(playerPosition) {
        let nearest = this.getNearestPairInRange(playerPosition);
        if (nearest && nearest.isOpenable()) {
            nearest.openAnimated();
        }
    }

    closeNearestPair(playerPosition) {
        let nearest = null
        let minDist = Infinity
        for (const pair of this.doorPairs) {
            const center = new Vector3().addVectors(pair.leftDoor.position, pair.rightDoor.position).multiplyScalar(0.5)
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
            const center = new Vector3().addVectors(pair.leftDoor.position, pair.rightDoor.position).multiplyScalar(0.5)
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

    
    // Ouvre une paire de portes spécifique par index pour la mise en scène
    triggerOpenDoorByIndex(index) {
        if (index >= 0 && index < this.doorPairs.length) {
            this.doorPairs[index].openAnimated();
            return true;
        }
        console.warn(`DoorManager: Impossible d'ouvrir la porte d'index ${index}, hors limites.`);
        return false;
    }

    // Ferme une paire de portes spécifique par index pour la mise en scène
    triggerCloseDoorByIndex(index) {
        if (index >= 0 && index < this.doorPairs.length) {
            this.doorPairs[index].closeAnimated();
            return true;
        }
        console.warn(`DoorManager: Impossible de fermer la porte d'index ${index}, hors limites.`);
        return false;
    }
}