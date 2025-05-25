import { Howl } from 'howler'
import App from '../../App'
import * as THREE from 'three'
import soundAssets from '../../Assets/sounds.js'
import EventEmitter from '../../Utils/EventEmitter.js'

export default class SoundManager extends EventEmitter {
    constructor() {
        super()
        this.app = new App()
        this.soundIds = []
        this.customSounds = {}
        this.musics = {}
        this.preloadedSounds = {} // Store preloaded sounds
        this.isPaused = true
        this.speakers = []
        this.subtitles = {} // Store active subtitles by sound name
        this.subtitleElement = null // Element to display subtitles
        this.sounds = {} // Store preloaded sounds
        this.initSubtitleDisplay()
    }

    /**
     * Initialise et précharge tous les sons définis dans sounds.js
     * @returns {Promise} Promesse résolue quand tous les sons sont chargés
     */
    async initSounds() {
        const loadPromises = soundAssets.map(sound => {
            return new Promise((resolve, reject) => {
                const howl = new Howl({
                    src: [sound.path],
                    loop: sound.options.loop,
                    volume: sound.options.volume,
                    onload: () => {
                        this.sounds[sound.name] = {
                            howl,
                            options: sound.options,
                        }
                        console.log(`SoundManager :: new item stored : ${sound.name}`)
                        resolve()
                    },
                    onloaderror: (id, error) => {
                        console.error(`Failed to load sound ${sound.name}:`, error)
                        reject(error)
                    },
                })
            })
        })

        try {
            await Promise.all(loadPromises)
            this.trigger('ready')
            console.log('All sounds loaded successfully')
        } catch (error) {
            console.error('Error loading sounds:', error)
        }
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
        const speakerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0,
        })
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
            name: name,
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
        this.app.scene.traverse(child => {
            if (child.userData.is_speaker) {
                const position = new THREE.Vector3()
                const worldPosition = child.getWorldPosition(position)

                this.app.debug.createSpeakerHelper(child, this.app.scene, worldPosition)

                // Stocker les haut-parleurs pour une utilisation ultérieure
                this.speakers.push({
                    object: child,
                    position: worldPosition.clone(),
                })
            }
        })
    }

    removeSpeakersFromObject(object3D) {
        // Filtrer les haut-parleurs qui ne sont pas dans l'objet spécifié
        this.speakers = this.speakers.filter(speaker => {
            const isChild =
                object3D.scene.children.includes(speaker.object) ||
                speaker.object.parent === object3D.scene
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
        Howler.orientation(orientation.x, orientation.y, orientation.z)
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
    playSimpleSound(name, options = {}) {
        const sound = this.sounds[name]
        if (!sound) {
            console.error(`Sound ${name} not found`)
            return null
        }

        const defaultOptions = {
            loop: false,
            volume: 1.0,
            onend: null,
            stopAll: false,
        }

        const finalOptions = { ...defaultOptions, ...sound.options, ...options }

        this.customSounds[name] = sound.howl
        return sound.howl.play()
    }

    /**
     * Joue un son spatialisé sur un speaker précis (Object3D)
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {Object3D} speaker - Speaker cible
     * @returns {number} ID du son joué
     */
    playSoundOnSpeaker(name, speaker, options = {}) {
        const sound = this.sounds[name]
        if (!sound) {
            console.error(`Sound ${name} not found`)
            return null
        }

        const defaultOptions = {
            loop: false,
            volume: 1.0,
            maxDistance: 10,
            refDistance: 1,
            rolloffFactor: 1,
            onend: null,
        }
        const finalOptions = { ...defaultOptions, ...sound.options, ...options }

        // Stop previous sound if exists
        if (this.customSounds[name]) {
            if (Array.isArray(this.customSounds[name])) {
                this.customSounds[name].forEach(sound => sound.howl.stop())
            } else {
                this.customSounds[name].howl.stop()
            }
        }

        this.customSounds[name] = sound

        const id = sound.howl.play()

        // Positionner le son sur le speaker
        if (speaker && speaker.getWorldPosition) {
            const pos = new THREE.Vector3()
            speaker.getWorldPosition(pos)
            sound.howl.pos(pos.x, pos.y, pos.z, id)
            sound.howl.pannerAttr(
                {
                    panningModel: 'HRTF',
                    distanceModel: 'inverse',
                    refDistance: finalOptions.refDistance,
                    maxDistance: finalOptions.maxDistance,
                    rolloffFactor: finalOptions.rolloffFactor,
                },
                id
            )
        }

        return id
    }

    playSpotSound(name) {
        const speaker = this.speakers.find(speaker => speaker.name === name)
        this.playSoundOnSpeaker('spot_boat', speaker.object)
    }

    /**
     * Joue un son sur tous les haut-parleurs de la scène
     * @param {string} name - Identifiant unique pour ce son
     * @param {string|string[]} src - Chemin(s) vers le(s) fichier(s) audio
     * @param {Object} options - Options supplémentaires pour le son
     * @param {string} [options.vttSrc] - Chemin vers le fichier de sous-titres WebVTT
     * @returns {Array} IDs des sons joués sur chaque haut-parleur
     */
    async playSoundOnSpeakers(name, options = {}) {
        const sound = this.sounds[name]
        if (!sound) {
            console.error(`Sound ${name} not found`)
            return null
        }

        const defaultOptions = {
            loop: false,
            volume: 1.0,
            onend: null,
            maxDistance: 5,
            refDistance: 1,
            rolloffFactor: 1,
            vttSrc: null,
            isMusic: false,
            stopAll: true,
        }

        const finalOptions = { ...defaultOptions, ...sound.options, ...options }

        if (finalOptions.onend) {
            sound.howl.once('end', finalOptions.onend)
        }

        // Cleanup
        if (!finalOptions.isMusic && this.customSounds[name] && finalOptions.stopAll) {
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

        if (finalOptions.isMusic && this.musics[name] && finalOptions.stopAll) {
            this.musics[name].forEach(sound => {
                sound.stop()
                sound.unload()
            })
        }

        if (finalOptions.isMusic) {
            this.musics[name] = []
        } else {
            this.customSounds[name] = []
        }
        const ids = []

        let subtitleCues = []
        if (finalOptions.vttSrc) {
            subtitleCues = await this.loadVTT(finalOptions.vttSrc)
        }

        this.speakers.forEach((speaker, index) => {
            if (!finalOptions.isMusic) {
                this.customSounds[name].push(sound.howl)
            } else {
                this.musics[name].push(sound.howl)
            }

            const id = sound.howl.play()
            ids.push(id)

            const { position } = speaker

            sound.howl.pos(position.x, position.y, position.z, id)
            sound.howl.pannerAttr(
                {
                    panningModel: 'HRTF',
                    distanceModel: 'inverse',
                    refDistance: finalOptions.refDistance,
                    maxDistance: finalOptions.maxDistance,
                    rolloffFactor: finalOptions.rolloffFactor,
                },
                id
            )

            if (index === 0 && subtitleCues.length > 0 && !finalOptions.isMusic) {
                this.initSubtitlesForSound(name, sound.howl, id, subtitleCues)
            }
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
            soundId: id,
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
        return new Promise(resolve => {
            // Vérifier si le son est valide et actif
            if (sound && sound.playing()) {
                // Démarrer le fade du volume
                sound.fade(from, to, duration)

                // Appliquer une baisse progressive du pitch
                if (downPitch) {
                    const node = sound._sounds[0]?._node
                    const bufferSource = node?.bufferSource

                    if (bufferSource && bufferSource.playbackRate) {
                        const now = Howler.ctx.currentTime

                        // Baisser le pitch de 1.0 à 0.3 pendant la durée
                        bufferSource.playbackRate.setValueAtTime(1.0, now)
                        bufferSource.playbackRate.linearRampToValueAtTime(
                            0.3,
                            now + duration / 1000
                        )
                    }
                }

                // Arrêter le son après le fade-out
                setTimeout(() => {
                    sound.stop()
                    resolve()
                }, duration)
            } else {
                resolve() // Si le son n'est pas actif, résoudre immédiatement
            }
        })
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
                        if (s.howl) {
                            this.fadeOut(s.howl, s.howl.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                        } else {
                            this.fadeOut(s, s.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                        }
                    } else {
                        s.stop()
                    }
                })
            } else {
                if (fade) {
                    if (sound.howl) {
                        this.fadeOut(sound.howl, sound.howl.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                    } else {
                        this.fadeOut(sound, sound.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                    }
                } else {
                    sound.stop()
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
                        if (s.howl) {
                            this.fadeOut(s.howl, s.howl.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                        } else {
                            this.fadeOut(s, s.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                        }
                    } else {
                        s.stop()
                    }
                })
            } else {
                if (fade) {
                    if (sound.howl) {
                        this.fadeOut(sound.howl, sound.howl.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                    } else {
                        this.fadeOut(sound, sound.volume(), 0, 1000, downPitch) // Durée de 1 seconde
                    }
                } else {
                    sound.stop()
                }
            }
        })

        // Attendre que tous les fade-outs soient terminés
    }

    async playVoiceLine(name) {
        this.stopAllCustomSounds(true)

        return new Promise(resolve => {
            this.playSoundOnSpeakers(name, {
                onend: () => {
                    resolve('end')
                },
            })
        })
    }

    async playMusic(name) {
        this.stopAllMusicSounds(true)

        return new Promise(resolve => {
            this.playSoundOnSpeakers(name, {
                loop: true,
                isMusic: true,
                onend: () => {
                    resolve('end')
                },
            })
        })
    }

    async playMoreMusic(name) {
        return new Promise(resolve => {
            this.playSoundOnSpeakers(name, {
                loop: true,
                maxDistance: 8,
                stopAll: false,
                onend: () => {
                    resolve('end')
                },
            })
        })
    }

    /**
     * Arrête tous les sons
     */
    stopAll() {
        this.stopAllCustomSounds()
        this.stopAllMusicSounds()
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
                            text: cueText,
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

    destroy() {
        this.stopAll()

        // Décharger tous les sons personnalisés
        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                sound.forEach(s => s.unload())
            } else {
                sound.unload()
            }
        })
        this.customSounds = {}
    }
}
