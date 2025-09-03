import { Howl } from 'howler'
import App from '../../App'
import * as THREE from 'three'
import soundAssets from '../../Assets/sounds.js'
import EventEmitter from '../../Utils/EventEmitter.js'
import { disposeHierarchy } from '../../Utils/Memory.js'
import SubtitlesManager from './SubtitlesManager.js'

export default class SoundManager extends EventEmitter {
    constructor() {
        super()
        this.app = new App()
        this.customSounds = {}
        this.musics = {}
        this.speakers = []
        this.sounds = {}
        
        // Volume settings
        this.masterMusicVolume = 0.5
        this.masterSfxVolume = 0.7
        
        // Initialize subtitles manager
        this.subtitlesManager = new SubtitlesManager()
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
        } catch (error) {
            console.error('Error loading sounds:', error)
        }
    }

    createSpeaker(position, name = null) {
        const speaker = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
        )
        
        speaker.position.copy(position)
        speaker.userData.is_speaker = true
        if (name) {
            speaker.userData.name = name
            speaker.name = name
        }

        this.app.scene.add(speaker)
        this.speakers.push({ object: speaker, position: position.clone(), name })
        
        return speaker
    }



    attachToSpeakers() {
        this.app.scene.traverse(child => {
            if (child.userData.is_speaker) {
                const position = new THREE.Vector3()
                const worldPosition = child.getWorldPosition(position)
                this.speakers.push({ object: child, position: worldPosition.clone() })
            }
        })
    }

    removeSpeakersFromObject(object3D) {
        this.speakers = this.speakers.filter(speaker => {
            const isChild = object3D.scene.children.includes(speaker.object) || 
                           speaker.object.parent === object3D.scene
            return !isChild
        })
    }

    removeAllSpeakers() {
        this.speakers.forEach(speaker => {
            disposeHierarchy(speaker.object.scene)
        })
        this.speakers = []
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

        const finalOptions = { 
            loop: false, 
            volume: 1.0, 
            onend: null, 
            stopAll: false,
            ...sound.options, 
            ...options 
        }
        
        const adjustedVolume = finalOptions.volume * this.masterSfxVolume
        sound.howl.volume(adjustedVolume)

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

        const finalOptions = { 
            loop: false, 
            volume: 1.0, 
            maxDistance: 10, 
            refDistance: 1, 
            rolloffFactor: 1, 
            onend: null,
            ...sound.options, 
            ...options 
        }

        if (this.customSounds[name]) {
            if (Array.isArray(this.customSounds[name])) {
                this.customSounds[name].forEach(sound => sound.howl.stop())
            } else {
                this.customSounds[name].howl.stop()
            }
        }

        this.customSounds[name] = sound
        const id = sound.howl.play()

        if (speaker && speaker.getWorldPosition) {
            const pos = new THREE.Vector3()
            speaker.getWorldPosition(pos)
            sound.howl.pos(pos.x, pos.y, pos.z, id)
            sound.howl.pannerAttr({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: finalOptions.refDistance,
                maxDistance: finalOptions.maxDistance,
                rolloffFactor: finalOptions.rolloffFactor,
            }, id)
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

        const finalOptions = { 
            loop: false, 
            volume: 1.0, 
            onend: null, 
            maxDistance: 5, 
            refDistance: 1, 
            rolloffFactor: 1, 
            vttSrc: null, 
            isMusic: false, 
            stopAll: true,
            ...sound.options, 
            ...options 
        }

        const masterVolume = finalOptions.isMusic ? this.masterMusicVolume : this.masterSfxVolume
        const adjustedVolume = finalOptions.volume * masterVolume
        sound.howl.volume(adjustedVolume)

        if (finalOptions.onend) {
            sound.howl.once('end', finalOptions.onend)
        }

        if (!finalOptions.isMusic && this.customSounds[name] && finalOptions.stopAll) {
            this.customSounds[name].forEach(sound => {
                sound.stop()
                sound.unload()
            })
            this.subtitlesManager.stopSubtitlesForSound(name)
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
            subtitleCues = await this.subtitlesManager.loadVTT(finalOptions.vttSrc)
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
            sound.howl.pannerAttr({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: finalOptions.refDistance,
                maxDistance: finalOptions.maxDistance,
                rolloffFactor: finalOptions.rolloffFactor,
            }, id)

            if (index === 0 && subtitleCues.length > 0 && !finalOptions.isMusic) {
                this.subtitlesManager.initSubtitlesForSound(name, sound.howl, id, subtitleCues)
            }
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
                this.customSounds[name].forEach(sound => sound.stop())
            } else {
                this.customSounds[name].stop()
            }
            this.subtitlesManager.stopSubtitlesForSound(name)
        }
    }

    fadeOut(sound, from, to, duration, downPitch = false) {
        return new Promise(resolve => {
            if (sound && sound.playing()) {
                sound.fade(from, to, duration)

                if (downPitch) {
                    const node = sound._sounds[0]?._node
                    const bufferSource = node?.bufferSource

                    if (bufferSource && bufferSource.playbackRate) {
                        const now = Howler.ctx.currentTime
                        bufferSource.playbackRate.setValueAtTime(1.0, now)
                        bufferSource.playbackRate.linearRampToValueAtTime(0.3, now + duration / 1000)
                    }
                }

                setTimeout(() => {
                    sound.stop()
                    resolve()
                }, duration)
            } else {
                resolve()
            }
        })
    }

    /**
     * Arrête tous les sons personnalisés
     */
    stopAllCustomSounds(fade = false, downPitch = false, duration = 1000) {
        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                sound.forEach(s => {
                    if (fade) {
                        if (s.howl) {
                            this.fadeOut(s.howl, s.howl.volume(), 0, duration, downPitch)
                        } else {
                            this.fadeOut(s, s.volume(), 0, duration, downPitch)
                        }
                    } else {
                        s.stop()
                    }
                })
            } else {
                if (fade) {
                    if (sound.howl) {
                        this.fadeOut(sound.howl, sound.howl.volume(), 0, duration, downPitch)
                    } else {
                        this.fadeOut(sound, sound.volume(), 0, duration, downPitch)
                    }
                } else {
                    sound.stop()
                }
            }
            this.subtitlesManager.stopSubtitlesForSound(name)
        })

        this.subtitlesManager.hideSubtitle()
    }

    stopAllMusicSounds(fade = false, downPitch = false, duration = 1000) {
        Object.entries(this.musics).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                sound.forEach(s => {
                    if (fade) {
                        if (s.howl) {
                            this.fadeOut(s.howl, s.howl.volume(), 0, duration, downPitch)
                        } else {
                            this.fadeOut(s, s.volume(), 0, duration, downPitch)
                        }
                    } else {
                        s.stop()
                    }
                })
            } else {
                if (fade) {
                    if (sound.howl) {
                        this.fadeOut(sound.howl, sound.howl.volume(), 0, duration, downPitch)
                    } else {
                        this.fadeOut(sound, sound.volume(), 0, duration, downPitch)
                    }
                } else {
                    sound.stop()
                }
            }
        })
    }

    async playVoiceLine(name, isPitchDown = false, duration = 1000) {
        this.stopAllCustomSounds(true, isPitchDown, duration)
        return new Promise(resolve => {
            this.playSoundOnSpeakers(name, {
                onend: () => resolve('end')
            })
        })
    }

    async playMusic(name) {
        this.stopAllMusicSounds(true)
        return new Promise(resolve => {
            this.playSoundOnSpeakers(name, {
                loop: true,
                isMusic: true,
                onend: () => resolve('end')
            })
        })
    }

    stopAll() {
        this.stopAllCustomSounds()
        this.stopAllMusicSounds()
    }



    /**
     * Met à jour le volume principal de la musique
     * @param {number} volume - Volume entre 0 et 1
     */
    setMasterMusicVolume(volume) {
        this.masterMusicVolume = Math.max(0, Math.min(1, volume))
        
        Object.entries(this.musics).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                sound.forEach(s => {
                    const originalVolume = this.sounds[name]?.options?.volume || 1.0
                    s.volume(originalVolume * this.masterMusicVolume)
                })
            } else if (sound.howl) {
                const originalVolume = this.sounds[name]?.options?.volume || 1.0
                sound.howl.volume(originalVolume * this.masterMusicVolume)
            }
        })
    }

    /**
     * Met à jour le volume principal des effets sonores
     * @param {number} volume - Volume entre 0 et 1
     */
    setMasterSfxVolume(volume) {
        this.masterSfxVolume = Math.max(0, Math.min(1, volume))
        
        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                sound.forEach(s => {
                    const originalVolume = this.sounds[name]?.options?.volume || 1.0
                    if (s.howl) {
                        s.howl.volume(originalVolume * this.masterSfxVolume)
                    } else {
                        s.volume(originalVolume * this.masterSfxVolume)
                    }
                })
            } else if (sound.howl) {
                const originalVolume = this.sounds[name]?.options?.volume || 1.0
                sound.howl.volume(originalVolume * this.masterSfxVolume)
            }
        })
    }

    /**
     * Obtient le volume principal de la musique
     * @returns {number} Volume entre 0 et 1
     */
    getMasterMusicVolume() {
        return this.masterMusicVolume
    }

    /**
     * Obtient le volume principal des effets sonores
     * @returns {number} Volume entre 0 et 1
     */
    getMasterSfxVolume() {
        return this.masterSfxVolume
    }

    isAnyAudioPlaying() {
        for (const [name, soundData] of Object.entries(this.customSounds)) {
            if (soundData.howl && soundData.howl.playing()) {
                return true
            }
        }

        for (const [name, soundData] of Object.entries(this.musics)) {
            if (soundData.howl && soundData.howl.playing()) {
                return true
            }
        }

        for (const [name, soundData] of Object.entries(this.sounds)) {
            if (soundData.howl && soundData.howl.playing()) {
                return true
            }
        }

        return false
    }

    getCurrentVolume() {
        let maxVolume = 0
        let playingSounds = 0

        for (const [name, soundData] of Object.entries(this.customSounds)) {
            if (soundData.howl && soundData.howl.playing()) {
                playingSounds++
                maxVolume = Math.max(maxVolume, soundData.howl.volume())
            }
        }

        for (const [name, soundData] of Object.entries(this.musics)) {
            if (soundData.howl && soundData.howl.playing()) {
                playingSounds++
                maxVolume = Math.max(maxVolume, soundData.howl.volume())
            }
        }

        if (playingSounds > 0) {
            return Math.min(maxVolume * (1 + Math.log(playingSounds) * 0.3), 1.0)
        }

        return 0
    }

    destroy() {
        this.stopAll()

        Object.entries(this.customSounds).forEach(([name, sound]) => {
            if (Array.isArray(sound)) {
                sound.forEach(s => s.unload())
            } else {
                sound.unload()
            }
        })
        this.customSounds = {}

        if (this.subtitlesManager) {
            this.subtitlesManager.destroy()
        }
    }
}
