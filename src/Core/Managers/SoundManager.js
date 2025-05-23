import { Howl } from 'howler'
import App from '../../App'
import * as THREE from 'three'

export default class SoundManager {
    constructor() {
        this.app = new App()
        this.soundIds = []
        this.customSounds = {}
        this.musics = {}
        this.isPaused = true
        this.speakers = []
        this.subtitles = {}  // Store active subtitles by sound name
        this.subtitleElement = null  // Element to display subtitles
        this.initSubtitleDisplay()
    }

    /**
     * Crée un nouveau speaker dans la scène à la position spécifiée
     * @param {THREE.Vector3} position - Position du speaker dans la scène
     * @param {string} [name] - Nom optionnel pour identifier le speaker
     * @returns {Object3D} Le speaker créé
     */
    createSpeaker(position, name = null) {
        // Créer un objet 3D simple pour représenter le speaker sans matériau
        const speakerGeometry = new THREE.SphereGeometry(0.1, 16, 16)
        const speakerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 })
        const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial)
        
        // Positionner le speaker
        speaker.position.copy(position)
        
        // Marquer comme speaker pour l'identification
        speaker.userData.is_speaker = true
        if (name) {
            speaker.userData.name = name
            speaker.name = name // Ajouter aussi le nom à l'objet Three.js pour faciliter le debugging
        }
        
        // Ajouter à la scène
        this.app.scene.add(speaker)
        
        // Ajouter aux speakers gérés
        this.speakers.push({
            object: speaker,
            position: position.clone(),
            name: name
        })
        
        // Créer le helper de debug si nécessaire
        this.app.debug.createSpeakerHelper(speaker, this.app.scene, position)
        
        return speaker
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

    attachToSpeakers() {
        this.app.scene.traverse((child) => {
            if (child.userData.is_speaker) {
                const position = new THREE.Vector3()
                const worldPosition = child.getWorldPosition(position)

                this.app.debug.createSpeakerHelper(child, this.app.scene, worldPosition)

                // Stocker les haut-parleurs pour une utilisation ultérieure
                this.speakers.push({
                    object: child,
                    position: worldPosition.clone()
                })
            }
        })
    }

    removeSpeakersFromObject(object3D) {
        // Filtrer les haut-parleurs qui ne sont pas dans l'objet spécifié
        this.speakers = this.speakers.filter((speaker) => {
            const isChild = object3D.scene.children.includes(speaker.object) || speaker.object.parent === object3D.scene
            return !isChild
        })
    }

    updateListener() {
        const camera = this.app.camera
    
        if (!camera) return
    
        const position = new THREE.Vector3()
        const orientation = new THREE.Vector3()
    
        camera.mainCamera.getWorldPosition(position)
        camera.mainCamera.getWorldDirection(orientation)
    
        Howler.pos(position.x, position.y, position.z)
        Howler.orientation(
            orientation.x, orientation.y, orientation.z)
    }

    /**
     * Joue un son spécifique depuis un fichier audio
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {boolean} options.loop - Si le son doit jouer en boucle
     * @param {number} options.volume - Volume du son (0.0 à 1.0)
     * @param {boolean} options.spatial - Si le son doit être spatialisé 3D
     * @param {THREE.Vector3} options.position - Position du son dans l'espace 3D
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
     * Joue un son simple sans spatialisation
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {boolean} options.loop - Si le son doit jouer en boucle
     * @param {number} options.volume - Volume du son (0.0 à 1.0)
     * @param {Function} options.onend - Callback appelé quand le son se termine
     * @returns {number} ID du son joué
     */
    playSimpleSound(name, src, options = {}) {
        const defaultOptions = {
            loop: false,
            volume: 1.0,
            onend: null,
            stopAll: true 
        }
        
        const finalOptions = { ...defaultOptions, ...options }
        
        // Arrêter le son s'il existe déjà
        if (this.customSounds[name] && finalOptions.stopAll) {
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
        return sound.play()
    }
    
    /**
     * Joue un son spatialisé sur un speaker précis (Object3D)
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {Object3D} speaker - Speaker cible
     * @returns {number} ID du son joué
     */
    playSoundOnSpeaker(name, src, options = {}, speaker) {
        const defaultOptions = {
            loop: false,
            volume: 1.0,
            maxDistance: 10,
            refDistance: 1,
            rolloffFactor: 1,
            onend: null
        }
        const finalOptions = { ...defaultOptions, ...options }

        // Stop previous sound if exists
        if (this.customSounds[name]) {
            if (Array.isArray(this.customSounds[name])) {
                this.customSounds[name].forEach(sound => sound.stop())
            } else {
                this.customSounds[name].stop()
            }
        }

        const sound = new Howl({
            src: Array.isArray(src) ? src : [src],
            loop: finalOptions.loop,
            volume: finalOptions.volume,
            onend: finalOptions.onend
        })

        this.customSounds[name] = sound

        const id = sound.play()

        // Positionner le son sur le speaker
        if (speaker && speaker.getWorldPosition) {
            const pos = new THREE.Vector3()
            speaker.getWorldPosition(pos)
            sound.pos(pos.x, pos.y, pos.z, id)
            sound.pannerAttr({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: finalOptions.refDistance,
                maxDistance: finalOptions.maxDistance,
                rolloffFactor: finalOptions.rolloffFactor
            }, id)
        }

        return id
    }

    playSpotSound(name, volume = 10){
        const speaker = this.speakers.find(speaker => speaker.name === name)
        this.playSoundOnSpeaker(
            name,
            'audio/sfx/spots/turn_on.mp3',
            {
                volume: volume,
                maxDistance: 15,
            },
            speaker.object
        );
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

        // Cleanup
        if (this.customSounds[name]) {
            this.customSounds[name].forEach(sound => {
                sound.stop()
                sound.unload()
            })

            if (this.subtitles[name]) {
                clearTimeout(this.subtitles[name].timer)
                delete this.subtitles[name]
                this.hideSubtitle()
            }
        }

        this.customSounds[name] = []
        const ids = []

        let subtitleCues = []
        if (finalOptions.vttSrc) {
            subtitleCues = await this.loadVTT(finalOptions.vttSrc)
        }

        // Stocker toutes les instances et les promesses
        const loadPromises = []
        const soundsToPlay = []

        this.speakers.forEach((speaker) => {
            const sound = new Howl({
                src: Array.isArray(src) ? src : [src],
                loop: finalOptions.loop,
                volume: finalOptions.volume,
                autoplay: false,
                onend: finalOptions.onend
            })

            this.customSounds[name].push(sound)

            const loadPromise = new Promise((resolve) => {
                sound.once('load', () => resolve(sound))
            })

            loadPromises.push(loadPromise)
            soundsToPlay.push({ sound, speaker })
        })

        // Attendre que tous les sons soient prêts
        const loadedSounds = await Promise.all(loadPromises)

        // Synchroniser la lecture
        const syncStart = () => {
            loadedSounds.forEach((sound, index) => {
                const id = sound.play()
                ids.push(id)

                const { position } = this.speakers[index]

                sound.pos(position.x, position.y, position.z, id)
                sound.pannerAttr({
                    panningModel: 'HRTF',
                    distanceModel: 'inverse',
                    refDistance: finalOptions.refDistance,
                    maxDistance: finalOptions.maxDistance,
                    rolloffFactor: finalOptions.rolloffFactor
                }, id)

                if (index === 0 && subtitleCues.length > 0) {
                    this.initSubtitlesForSound(name, sound, id, subtitleCues)
                }
            })
        }

        // Démarrage synchrone au frame suivant
        requestAnimationFrame(syncStart)

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
            vttSrc: null,
            stopAll: true
        }
        
        const finalOptions = { ...defaultOptions, ...options }
        
        // Si le son existe déjà, on l'arrête
        if (this.musics[name] && finalOptions.stopAll) {
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
        console.log("play sound "+ name)
        return new Promise((resolve) => {
            this.playSoundOnSpeakers('voiceLine ' + name, `audio/voices/${name}.mp3`, {
                volume: 2,
                loop: false,
                maxDistance: 20,
                vttSrc: `audio/subtitles/${name}.vtt`,
                onend: () => {
                    resolve('end');
                },
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

    async playMoreMusic(name) {
        return new Promise((resolve) => {
            this.playMusicOnSpeakers('voiceLine ' + name, `audio/musics/${name}.mp3`, {
                volume: 0.5,
                loop: true,
                maxDistance: 8,
                stopAll: false,
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
        
    }
}
