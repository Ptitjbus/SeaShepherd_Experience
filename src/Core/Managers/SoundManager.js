import { Howl } from 'howler'
import App from '../../App'
import { Vector3 } from 'three'

export default class SoundManager {
    constructor() {
        this.app = new App()
        this.sound = null
        this.soundIds = []
        this.customSounds = {}
        this.isPaused = true
        this.speakers = []
    }

    initSound() {
        this.sound = new Howl({
            src: ['audio/background_music.mp3'],
            loop: true,
            volume: 1.0,
            onload: () => this.attachToSpeakers()
        })
    }

    attachToSpeakers() {
        this.app.scene.traverse((child) => {
            if (child.name.startsWith('HAUT-PARLEUR')) {
                const position = new Vector3()
                const worldPosition = child.getWorldPosition(position)

                this.app.debug.createHelper(child, this.app.scene, worldPosition)

                // Stocker les haut-parleurs pour une utilisation ultérieure
                this.speakers.push({
                    object: child,
                    position: worldPosition.clone()
                })

                const id = this.sound.play()
                
                this.sound.pos(position.x, position.y, position.z, id)
                this.sound.pannerAttr({
                    panningModel: 'HRTF',
                    distanceModel: 'inverse',
                    refDistance: 1,
                    maxDistance: 5,
                    rolloffFactor: 1
                }, id)

                this.soundIds.push(id)
            }
        })

        if (this.isPaused){
            this.pauseAll()
        }
    }

    updateListener() {
        const camera = this.app.camera
    
        if (!camera) return
    
        const position = new Vector3()
        const orientation = new Vector3()
    
        camera.mainCamera.getWorldPosition(position)
        camera.mainCamera.getWorldDirection(orientation)
    
        Howler.pos(position.x, position.y, position.z)
        Howler.orientation(
            orientation.x, orientation.y, orientation.z)
    }

    pauseAll() {
        if (this.sound && this.soundIds.length > 0) {
            this.soundIds.forEach((id) => {
                this.sound.pause(id)
            })
            this.isPaused = true
        }
    }

    resumeAll() {
        if (this.sound && this.soundIds.length > 0 && this.isPaused) {
            this.soundIds.forEach((id) => {
                this.sound.play(id)
            })
            this.isPaused = false
        }
    }

    /**
     * Joue un son spécifique depuis un fichier audio
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {boolean} options.loop - Si le son doit jouer en boucle
     * @param {number} options.volume - Volume du son (0.0 à 1.0)
     * @param {boolean} options.spatial - Si le son doit être spatialisé 3D
     * @param {Vector3} options.position - Position du son dans l'espace 3D
     * @returns {number} ID du son joué
     */
    playSound(name, src, options = {}) {
        const defaultOptions = {
            loop: false,
            volume: 1.0,
            spatial: false,
            position: null,
            onend: null
        }
        
        const finalOptions = { ...defaultOptions, ...options }
        
        if (this.customSounds[name]) {
            this.customSounds[name].stop()
            this.customSounds[name].unload()
        }
        
        const sound = new Howl({
            src: Array.isArray(src) ? src : [src],
            loop: finalOptions.loop,
            volume: finalOptions.volume,
            onend: finalOptions.onend
        })
        
        this.customSounds[name] = sound
        
        const id = sound.play()
        
        if (finalOptions.spatial && finalOptions.position) {
            sound.pos(
                finalOptions.position.x,
                finalOptions.position.y,
                finalOptions.position.z,
                id
            )
            
            sound.pannerAttr({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: 1,
                maxDistance: 10,
                rolloffFactor: 1
            }, id)
        }
        
        return id
    }
    
    /**
     * Joue un son sur tous les haut-parleurs de la scène
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @returns {Array} IDs des sons joués sur chaque haut-parleur
     */
    playSoundOnSpeakers(name, src, options = {}) {
        const defaultOptions = {
            loop: false,
            volume: 1.0,
            onend: null,
            maxDistance: 5,
            refDistance: 1,
            rolloffFactor: 1
        }
        
        const finalOptions = { ...defaultOptions, ...options }
        
        // Si le son existe déjà, on l'arrête et le nettoie
        if (this.customSounds[name]) {
            this.customSounds[name].forEach(sound => {
                sound.stop()
                sound.unload()
            })
        }
        
        this.customSounds[name] = []
        const ids = []
        
        // Jouer le son sur chaque haut-parleur
        this.speakers.forEach((speaker, index) => {
            const sound = new Howl({
                src: Array.isArray(src) ? src : [src],
                loop: finalOptions.loop,
                volume: finalOptions.volume,
                onend: finalOptions.onend
            })
            
            // Ajouter à notre collection
            this.customSounds[name].push(sound)
            
            // Jouer le son
            const id = sound.play()
            ids.push(id)
            
            // Configurer la position spatiale
            sound.pos(
                speaker.position.x,
                speaker.position.y,
                speaker.position.z,
                id
            )
            
            sound.pannerAttr({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: finalOptions.refDistance,
                maxDistance: finalOptions.maxDistance,
                rolloffFactor: finalOptions.rolloffFactor
            }, id)
        })
        
        return ids
    }
    
    /**
     * Arrête un son spécifique
     * @param {string} name - Identifiant du son à arrêter
     */
    stopSound(name) {
        if (this.customSounds[name]) {
            if (Array.isArray(this.customSounds[name])) {
                // Pour les sons joués sur les haut-parleurs
                this.customSounds[name].forEach(sound => sound.stop())
            } else {
                // Pour les sons joués normalement
                this.customSounds[name].stop()
            }
        }
    }
    
    /**
     * Arrête tous les sons personnalisés
     */
    stopAllCustomSounds() {
        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                // Pour les sons joués sur les haut-parleurs
                sound.forEach(s => s.stop())
            } else {
                // Pour les sons joués normalement
                sound.stop()
            }
        })
    }

    /**
     * Arrête tous les sons
     */
    stopAll() {
        if (this.sound) {
            this.sound.stop()
        }
        this.stopAllCustomSounds()
    }

    destroy() {
        this.stopAll()
        
        // Décharger tous les sons personnalisés
        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                // Pour les sons joués sur les haut-parleurs
                sound.forEach(s => s.unload())
            } else {
                // Pour les sons joués normalement
                sound.unload()
            }
        })
        this.customSounds = {}
        
        if (this.sound) {
            this.sound.unload()
        }
    }
}
