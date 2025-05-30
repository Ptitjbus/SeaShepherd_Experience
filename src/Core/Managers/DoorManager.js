import { Vector3 } from 'three'

import DoorPair from '../../Utils/DoorPairs'
import App from '../../App'
import { disposeHierarchy } from '../../Utils/Memory'

export default class DoorManager {
    constructor(scene) {
        this.scene = scene
        this.doorPairs = []
        this.app = new App()

        // Tableau pour suivre les portes ouvertes par script
        this.scriptOpenedDoors = []
    }

    addDoorPair(
        position,
        width = 3,
        height = 5,
        colorLeft = 0x707070,
        colorRight = 0x707070,
        canBeOpened = true,
        canBeTriggered = false
    ) {
        const pair = new DoorPair(this.scene, position, width, height, colorLeft, colorRight, true) // Sliding doors
        pair.setOpenable(canBeOpened) // Définir si la porte peut être ouverte
        pair.setCanBeTriggered(canBeTriggered)
        this.doorPairs.push(pair)
        return pair
    }

    removeDoorsFromScene() {
        this.doorPairs.forEach(pair => {
            disposeHierarchy(pair.leftDoor)
            disposeHierarchy(pair.rightDoor)
            disposeHierarchy(pair.leftCollisionHelper)
            disposeHierarchy(pair.rightCollisionHelper)

            this.app.physicsManager.world.removeBody(pair.leftBody)
            this.app.physicsManager.world.removeBody(pair.rightBody)
        })
        this.doorPairs = []
    }

    update() {
        const playerPosition = this.app.physicsManager.sphereBody.position

        // Mettre à jour toutes les paires de portes avec la position du joueur
        // Mais ignorer celles ouvertes par script
        for (const pair of this.doorPairs) {
            // Si cette porte a été ouverte par script, ne pas la mettre à jour automatiquement
            if (!this.isScriptOpened(pair)) {
                pair.update(playerPosition)
            }
        }
    }

    // Vérifier si une porte a été ouverte par script
    isScriptOpened(doorPair) {
        return this.scriptOpenedDoors.includes(doorPair)
    }

    // Interaction manuelle : ouvre la porte la plus proche si assez proche
    openNearestPair(playerPosition) {
        let nearest = this.getNearestPairInRange(playerPosition)
        if (nearest && nearest.isOpenable()) {
            nearest.openAnimated()
        }
    }

    closeNearestPair(playerPosition) {
        let nearest = null
        let minDist = Infinity
        for (const pair of this.doorPairs) {
            const center = new Vector3()
                .addVectors(pair.leftDoor.position, pair.rightDoor.position)
                .multiplyScalar(0.5)
            const dist = center.distanceTo(playerPosition)
            if (dist < minDist) {
                minDist = dist
                nearest = pair
            }
        }
        if (nearest && nearest.isPlayerNear(playerPosition)) {
            nearest.closeAnimated()

            // Si cette porte était ouverte par script, la retirer de la liste
            const index = this.scriptOpenedDoors.indexOf(nearest)
            if (index !== -1) {
                this.scriptOpenedDoors.splice(index, 1)
            }
        }
    }

    getNearestPairInRange(playerPosition, threshold = 4) {
        let nearest = null
        let minDist = Infinity
        for (const pair of this.doorPairs) {
            const center = new Vector3()
                .addVectors(pair.leftDoor.position, pair.rightDoor.position)
                .multiplyScalar(0.5)
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
    // et la marque comme ouverte par script pour qu'elle reste ouverte
    triggerOpenDoorByIndex(index) {
        if (index >= 0 && index < this.doorPairs.length) {
            const door = this.doorPairs[index]
            door.openAnimated()

            // Ajouter à la liste des portes ouvertes par script
            if (!this.isScriptOpened(door)) {
                this.scriptOpenedDoors.push(door)
            }

            return true
        }
        return false
    }

    async triggerCloseDoorByIndex(index) {
        if (index >= 0 && index < this.doorPairs.length) {
            const door = this.doorPairs[index]
            await door.closeAnimated()

            // Si cette porte était ouverte par script, la retirer de la liste
            const index = this.scriptOpenedDoors.indexOf(nearest)
            if (index !== -1) {
                this.scriptOpenedDoors.splice(index, 1)
            }

            return true
        }
        return false
    }

    // Ferme une paire de portes spécifique par index pour la mise en scène
    triggerCloseDoorByIndex(index) {
        if (index >= 0 && index < this.doorPairs.length) {
            const door = this.doorPairs[index]
            door.closeAnimated()

            // Retirer de la liste des portes ouvertes par script
            const scriptIndex = this.scriptOpenedDoors.indexOf(door)
            if (scriptIndex !== -1) {
                this.scriptOpenedDoors.splice(scriptIndex, 1)
            }

            return true
        }
        console.warn(`DoorManager: Impossible de fermer la porte d'index ${index}, hors limites.`)
        return false
    }

    // Nouvelle méthode pour rendre une porte à nouveau automatique
    resetDoorAutomation(index) {
        if (index >= 0 && index < this.doorPairs.length) {
            const door = this.doorPairs[index]

            // Retirer de la liste des portes ouvertes par script
            const scriptIndex = this.scriptOpenedDoors.indexOf(door)
            if (scriptIndex !== -1) {
                this.scriptOpenedDoors.splice(scriptIndex, 1)
            }

            return true
        }
        console.warn(
            `DoorManager: Impossible de réinitialiser l'automation de la porte d'index ${index}, hors limites.`
        )
        return false
    }
}
