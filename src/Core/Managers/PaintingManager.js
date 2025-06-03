import * as THREE from 'three'
import { BugShader } from '../../Shaders/BugShader.js'
import App from '../../App.js'
import { disposeMaterial } from '../../Utils/Memory.js'

export default class PaintingManager {
    constructor() {
        this.app = new App()
        this.paintings = []
        this.currentNearPainting = null
        this.interactionDistance = 4
        
        this.handleKeyPress = this.handleKeyPress.bind(this)
        document.addEventListener('keydown', this.handleKeyPress)

        this.transitionMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0.5 }, 
                uTexture: { value: null },
                uGlitchIntensity: { value: 3.0 },
                uResolution: { value: new THREE.Vector2(1024, 1024) },
                uRandom: { value: Math.random() * 10 },
                uEnableFade: { value: 0.0 },
                uDisappearTime: { value: 0.3 },
                uChaosLevel: { value: 2.0 }
            },
            vertexShader: BugShader.vertexShader,
            fragmentShader: BugShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        })
        
        this.transitionTimeouts = new Map()
    }

    handleKeyPress(event) {
        event.preventDefault()
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
        
        // Annuler toute transition en cours pour ce tableau
        if (this.transitionTimeouts.has(painting.id)) {
            clearTimeout(this.transitionTimeouts.get(painting.id))
            this.transitionTimeouts.delete(painting.id)
        }
        
        const nextTextureIndex = (painting.currentTextureIndex + 1) % painting.textures.length
        const newTexture = painting.textures[nextTextureIndex]
        
        if (newTexture) {
            const originalMaterial = painting.mesh.material
            
            this.transitionMaterial.uniforms.uTexture.value = painting.mesh.material.map
            painting.mesh.material = this.transitionMaterial
            painting.mesh.material.needsUpdate = true
            
            const startTime = Date.now()
            const transitionDuration = 300 
            
            const animateTransition = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / transitionDuration, 1)
                
                if (this.transitionMaterial.uniforms) {
                    this.transitionMaterial.uniforms.uTime.value = elapsed * 0.001
                    const intensity = Math.sin(progress * Math.PI) * 3.0
                    this.transitionMaterial.uniforms.uGlitchIntensity.value = intensity
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateTransition)
                }
            }
            
            this.app.postProcessing.triggerGlitch()
            animateTransition()
            
            const timeoutId = setTimeout(() => {
                painting.currentTextureIndex = nextTextureIndex
                const finalMaterial = originalMaterial.clone()
                finalMaterial.map = newTexture
                finalMaterial.needsUpdate = true
                
                painting.mesh.material = finalMaterial
                painting.mesh.material.needsUpdate = true
                
                disposeMaterial(this.transitionMaterial)
                
                this.transitionTimeouts.delete(painting.id)
                
            }, transitionDuration)
            
            this.transitionTimeouts.set(painting.id, timeoutId)
        }
    }

    update(playerPosition) {
        let nearPainting = null

        // Vérifier la distance avec chaque tableau
        this.paintings.forEach(painting => {
            const distance = playerPosition.distanceTo(painting.mesh.position)
            
            if (distance < this.interactionDistance) {
                nearPainting = painting
            }
        })

        // Gérer l'affichage du keyhint
        if (nearPainting && nearPainting !== this.currentNearPainting) {
            this.currentNearPainting = nearPainting
            
            if (this.app.uiManager && typeof this.app.uiManager.showKeyHint === 'function') {
                this.app.uiManager.showKeyHint('⏎', 'Découvrir la vérité')
            }
        } else if (!nearPainting && this.currentNearPainting) {
            this.currentNearPainting = null
            if (this.app.uiManager && typeof this.app.uiManager.hideKeyHint === 'function') {
                this.app.uiManager.hideKeyHint()
            }
        }
    }

    destroy() {
        // Annuler tous les timeouts en cours
        this.transitionTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId)
        })
        this.transitionTimeouts.clear()
        
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