import { Howl } from 'howler'
import App from '../../App'
import { Vector3 } from 'three'

export default class SoundManager {
    constructor() {
        this.app = new App()
        this.sound = null
        this.soundIds = []
        this.customSounds = {}
        this.musics = {}
        this.isPaused = true
        this.speakers = []
        this.subtitles = {}  // Store active subtitles by sound name
        this.subtitleElement = null  // Element to display subtitles
        this.initSubtitleDisplay()
    }

    initSubtitleDisplay() {
        // Create subtitle container if it doesn't exist
        if (!document.getElementById('subtitle-container')) {
            this.subtitleElement = document.createElement('div')
            this.subtitleElement.id = 'subtitle-container'
            this.subtitleElement.style.cssText = `
                position: absolute;
                bottom: 10%;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.5);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                font-family: sans-serif;
                text-align: center;
                max-width: 80%;
                z-index: 1000;
                display: none;
            `
            document.body.appendChild(this.subtitleElement)
        } else {
            this.subtitleElement = document.getElementById('subtitle-container')
        }
    }

    initSound() {
        this.sound = new Howl({
            src: ['audio/voices/1_INTRO.mp3'],
            loop: true,
            volume: 1.0,
            onload: () => this.attachToSpeakers()
        })
    }

    attachToSpeakers() {
        this.app.scene.traverse((child) => {
            if (child.userData.is_speaker) {
                const position = new Vector3()
                const worldPosition = child.getWorldPosition(position)

                this.app.debug.createSpeakerHelper(child, this.app.scene, worldPosition)

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
     * Charge et parse un fichier WebVTT
     * @param {string} vttUrl - URL du fichier WebVTT
     * @returns {Promise<Array>} Tableau d'objets de sous-titres
     */
    async loadVTT(vttUrl) {
        try {
            const response = await fetch(vttUrl)
            const text = await response.text()
            
            // Parse VTT content
            const cues = []
            const lines = text.trim().split('\n')
            
            let i = 0
            // Skip WebVTT header
            while (i < lines.length && !lines[i].includes('-->')) {
                i++
            }
            
            while (i < lines.length) {
                // Find a line with timing information
                if (lines[i].includes('-->')) {
                    const timeParts = lines[i].split('-->')
                    
                    // Parse start and end times
                    const startTime = this.parseVttTime(timeParts[0].trim())
                    const endTime = this.parseVttTime(timeParts[1].trim())
                    
                    // Get the cue text (may be multiple lines)
                    let cueText = ''
                    i++
                    while (i < lines.length && lines[i].trim() !== '') {
                        cueText += (cueText ? '\n' : '') + lines[i]
                        i++
                    }
                    
                    if (cueText) {
                        cues.push({
                            start: startTime,
                            end: endTime,
                            text: cueText
                        })
                    }
                } else {
                    i++
                }
            }
            
            return cues
        } catch (error) {
            console.error('Failed to load VTT file:', error)
            return []
        }
    }

    /**
     * Convertit le timestamp VTT en secondes
     * @param {string} timeString - Timestamp au format VTT (00:00:00.000)
     * @returns {number} Temps en secondes
     */
    parseVttTime(timeString) {
        const parts = timeString.split(':')
        let seconds = 0
        
        if (parts.length === 3) {
            // Format: 00:00:00.000
            seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
        } else if (parts.length === 2) {
            // Format: 00:00.000
            seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1])
        }
        
        return seconds
    }

    /**
     * Affiche un sous-titre
     * @param {string} text - Texte du sous-titre
     */
    showSubtitle(text) {
        if (this.subtitleElement) {
            this.subtitleElement.textContent = text
            this.subtitleElement.style.display = 'block'
        }
    }

    /**
     * Cache les sous-titres
     */
    hideSubtitle() {
        if (this.subtitleElement) {
            this.subtitleElement.style.display = 'none'
        }
    }

    /**
     * Joue un son sur tous les haut-parleurs de la scène
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {string} [options.vttSrc] - Chemin vers le fichier de sous-titres WebVTT
     * @returns {Array} IDs des sons joués sur chaque haut-parleur
     */
    async playSoundOnSpeakers(name, src, options = {}) {
        const defaultOptions = {
            loop: false,
            volume: 1.0,
            onend: null,
            maxDistance: 5,
            refDistance: 1,
            rolloffFactor: 1,
            vttSrc: null
        }
        
        const finalOptions = { ...defaultOptions, ...options }
        
        // Si le son existe déjà, on l'arrête et on nettoie les sous-titres
        if (this.customSounds[name]) {
            this.customSounds[name].forEach(sound => {
                sound.stop()
                sound.unload()
            })
            
            // Arrêter les sous-titres actifs
            if (this.subtitles[name]) {
                clearTimeout(this.subtitles[name].timer)
                delete this.subtitles[name]
                this.hideSubtitle()
            }
        }
        
        this.customSounds[name] = []
        const ids = []
        
        // Charger les sous-titres VTT si spécifiés
        let subtitleCues = []
        if (finalOptions.vttSrc) {
            subtitleCues = await this.loadVTT(finalOptions.vttSrc)
        }
        
        // Jouer le son sur chaque haut-parleur
        this.speakers.forEach((speaker, index) => {
            const sound = new Howl({
                src: Array.isArray(src) ? src : [src],
                loop: finalOptions.loop,
                volume: finalOptions.volume,
                onend: () => {
                    // Nettoyer les sous-titres à la fin du son
                    if (this.subtitles[name]) {
                        clearTimeout(this.subtitles[name].timer)
                        delete this.subtitles[name]
                        this.hideSubtitle()
                    }
                    
                    // Appeler le callback onend original si fourni
                    if (finalOptions.onend) finalOptions.onend();
                }
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
            
            // Si c'est le premier haut-parleur et qu'on a des sous-titres, initialiser le système de sous-titres
            if (index === 0 && subtitleCues.length > 0) {
                this.initSubtitlesForSound(name, sound, id, subtitleCues)
            }
        })
        
        return ids
    }

    /**
     * Joue une musique sur tous les haut-parleurs de la scène
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {string} [options.vttSrc] - Chemin vers le fichier de sous-titres WebVTT
     * @returns {Array} IDs des sons joués sur chaque haut-parleur
     */
    async playMusicOnSpeakers(name, src, options = {}) {
        const defaultOptions = {
            loop: false,
            volume: 1.0,
            onend: null,
            maxDistance: 5,
            refDistance: 1,
            rolloffFactor: 1,
            vttSrc: null
        }
        
        const finalOptions = { ...defaultOptions, ...options }
        
        // Si le son existe déjà, on l'arrête
        if (this.musics[name]) {
            this.musics[name].forEach(sound => {
                sound.stop()
                sound.unload()
            })
        }
        
        this.musics[name] = []
        const ids = []
        
        // Jouer le son sur chaque haut-parleur
        this.speakers.forEach((speaker, index) => {
            const sound = new Howl({
                src: Array.isArray(src) ? src : [src],
                loop: finalOptions.loop,
                volume: finalOptions.volume,
                onend: () => {
                    if (finalOptions.onend) finalOptions.onend();
                }
            })
            
            // Ajouter à notre collection
            this.musics[name].push(sound)
            
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
     * Initialise le système de sous-titres pour un son
     * @param {string} name - Nom du son
     * @param {Howl} sound - Instance Howl
     * @param {number} id - ID du son joué
     * @param {Array} cues - Sous-titres parsés
     */
    initSubtitlesForSound(name, sound, id, cues) {
        // Stocker les informations de sous-titres
        this.subtitles[name] = {
            cues: cues,
            currentIndex: 0,
            timer: null,
            sound: sound,
            soundId: id
        }
        
        // Démarrer le traitement des sous-titres
        this.processNextSubtitle(name)
    }

    /**
     * Traite le prochain sous-titre pour un son
     * @param {string} name - Nom du son
     */
    processNextSubtitle(name) {
        if (!this.subtitles[name]) return
        
        const subtitle = this.subtitles[name]
        const cues = subtitle.cues
        const currentIndex = subtitle.currentIndex
        
        if (currentIndex >= cues.length) {
            // Plus de sous-titres à afficher
            this.hideSubtitle()
            return
        }
        
        const currentCue = cues[currentIndex]
        const sound = subtitle.sound
        const soundId = subtitle.soundId
        
        // Obtenir la position actuelle du son
        const currentTime = sound.seek(soundId)
        
        if (currentTime >= currentCue.start && currentTime < currentCue.end) {
            // Afficher le sous-titre actuel
            this.showSubtitle(currentCue.text)
            
            // Programmer la fin de ce sous-titre
            const timeUntilEnd = (currentCue.end - currentTime) * 1000
            subtitle.timer = setTimeout(() => {
                this.hideSubtitle()
                subtitle.currentIndex++
                this.processNextSubtitle(name)
            }, timeUntilEnd)
        } else if (currentTime < currentCue.start) {
            // Programmer l'affichage de ce sous-titre
            const timeUntilStart = (currentCue.start - currentTime) * 1000
            subtitle.timer = setTimeout(() => {
                this.processNextSubtitle(name)
            }, timeUntilStart)
        } else {
            // Ce sous-titre est déjà passé, passer au suivant
            subtitle.currentIndex++
            this.processNextSubtitle(name)
        }
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
            
            // Nettoyer les sous-titres
            if (this.subtitles[name]) {
                clearTimeout(this.subtitles[name].timer)
                delete this.subtitles[name]
                this.hideSubtitle()
            }
        }
    }

    fadeOut(sound, from, to, duration, downPitch = false) {
        return new Promise((resolve) => {
            // Vérifier si le son est valide et actif
            if (sound && sound.playing()) {
                // Démarrer le fade du volume
                sound.fade(from, to, duration);

                // Appliquer une baisse progressive du pitch
                if(downPitch){
                    const node = sound._sounds[0]?._node;
                    const bufferSource = node?.bufferSource;
    
                    if (bufferSource && bufferSource.playbackRate) {
                        const now = Howler.ctx.currentTime;
    
                        // Baisser le pitch de 1.0 à 0.3 pendant la durée
                        bufferSource.playbackRate.setValueAtTime(1.0, now);
                        bufferSource.playbackRate.linearRampToValueAtTime(0.3, now + duration / 1000);
                    }
                }

                // Arrêter le son après le fade-out
                setTimeout(() => {
                    sound.stop();
                    resolve();
                }, duration);
            } else {
                resolve(); // Si le son n'est pas actif, résoudre immédiatement
            }
        });
    }
    
    /**
     * Arrête tous les sons personnalisés
     */
    stopAllCustomSounds(fade = false, downPitch = false) {
        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                // Pour les sons joués sur les haut-parleurs
                sound.forEach(s => {
                    if (fade) {
                        this.fadeOut(s, s.volume(), 0, 1000, downPitch); // Durée de 1 seconde
                    } else {
                        s.stop();
                    }
                });
            } else {
                if (fade) {
                    this.fadeOut(sound, sound.volume(), 0, 1000, downPitch); // Durée de 1 seconde
                } else {
                    sound.stop();
                }
            }
            
            // Nettoyer les sous-titres
            if (this.subtitles[name]) {
                clearTimeout(this.subtitles[name].timer)
                delete this.subtitles[name]
            }
        })
        
        // Cacher les sous-titres
        this.hideSubtitle()
    }

    stopAllMusicSounds(fade = false, downPitch = false) {
        Object.entries(this.musics).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                // Pour les sons joués sur les haut-parleurs
                sound.forEach(s => {
                    if (fade) {
                        this.fadeOut(s, s.volume(), 0, 1000, downPitch); // Durée de 1 seconde
                    } else {
                        s.stop();
                    }
                });
            } else {
                if (fade) {
                    this.fadeOut(sound, sound.volume(), 0, 1000, downPitch); // Durée de 1 seconde
                } else {
                    sound.stop();
                }
            }
        });

        // Attendre que tous les fade-outs soient terminés
    }

    async playVoiceLine(name) {
        this.stopAllCustomSounds()
        return new Promise((resolve) => {
            this.playSoundOnSpeakers('voiceLine ' + name, `audio/voices/${name}.mp3`, {
                volume: 10,
                loop: false,
                maxDistance: 8,
                vttSrc: `audio/subtitles/${name}.vtt`,
                onend: () => {
                    resolve('end');
                }
            });
        });
    }

     async playMusic(name) {
        this.stopAllMusicSounds()
        return new Promise((resolve) => {
            this.playMusicOnSpeakers('voiceLine ' + name, `audio/musics/${name}.mp3`, {
                volume: 1,
                loop: true,
                maxDistance: 8,
                onend: () => {
                    resolve('end');
                }
            });
        });
    }

    /**
     * Arrête tous les sons
     */
    stopAll() {
        if (this.sound) {
            this.sound.stop()
        }
        this.stopAllCustomSounds()
        this.stopAllMusicSounds()
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
