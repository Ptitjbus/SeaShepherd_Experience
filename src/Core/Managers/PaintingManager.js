import { Vector3, Raycaster } from 'three'
import EventEmitter from '../../Utils/EventEmitter'

export default class PaintingManager extends EventEmitter {
    constructor(app) {
        super()
        this.app = app
        this.paintings = []
        this.currentNearPainting = null
        this.interactionDistance = 3
        this.raycaster = new Raycaster()
        
        // Bind de la méthode pour pouvoir la supprimer plus tard
        this.handleKeyPress = this.handleKeyPress.bind(this)
        document.addEventListener('keydown', this.handleKeyPress)
    }

    handleKeyPress(event) {
        if (event.code === 'Enter' && this.currentNearPainting) {
            this.changePaintingTexture(this.currentNearPainting)
        }
    }

    addPainting(position, paintingTextures, mesh) {
        // Créer un tableau de textures incluant la texture originale
        const allTextures = []
        
        // Ajouter la texture originale en premier
        if (mesh.material && mesh.material.map) {
            allTextures.push(mesh.material.map)
        }
        
        // Ajouter les textures alternatives
        paintingTextures.forEach(texture => {
            if (texture && texture !== mesh.material.map) {
                allTextures.push(texture)
            }
        })
        
        const painting = {
            id: this.paintings.length,
            position: mesh.position.clone(),
            textures: allTextures, // Utiliser le tableau complet
            currentTextureIndex: 0, // Commencer par la texture originale
            mesh: mesh,
            originalMaterial: mesh.material.clone()
        }
        
        this.paintings.push(painting)
        return painting.id
    }

    changePaintingTexture(painting) {
        if (painting.textures.length <= 1) {
            return
        }
        
        this.app.postProcessing.triggerBigGlitch()
        painting.currentTextureIndex = (painting.currentTextureIndex + 1) % painting.textures.length
        
        const newTexture = painting.textures[painting.currentTextureIndex]
        if (newTexture) {
            painting.mesh.material.map = newTexture
            painting.mesh.material.needsUpdate = true
        }
    }

    update(playerPosition) {
        let nearPainting = null
        let closestDistance = this.interactionDistance

        // Vérifier la distance avec chaque tableau
        this.paintings.forEach(painting => {
            const distance = playerPosition.distanceTo(painting.mesh.position)
            
            if (distance < closestDistance) {
                nearPainting = painting
                closestDistance = distance
            }
        })

        // Gérer l'affichage du keyhint
        if (nearPainting && nearPainting !== this.currentNearPainting) {
            this.currentNearPainting = nearPainting
            
            if (this.app.uiManager && typeof this.app.uiManager.showKeyHint === 'function') {
                this.app.uiManager.showKeyHint('⏎')
            }
        } else if (!nearPainting && this.currentNearPainting) {
            this.currentNearPainting = null
            if (this.app.uiManager && typeof this.app.uiManager.hideKeyHint === 'function') {
                this.app.uiManager.hideKeyHint()
            }
        }
    }

    destroy() {
        this.paintings.forEach(painting => {
            if (painting.originalMaterial) {
                painting.originalMaterial.dispose()
            }
        })
        this.paintings = []
        if (this.app.uiManager && typeof this.app.uiManager.hideKeyHint === 'function') {
            this.app.uiManager.hideKeyHint()
        }
        
        // Supprimer correctement l'event listener
        document.removeEventListener('keydown', this.handleKeyPress)
    }
}