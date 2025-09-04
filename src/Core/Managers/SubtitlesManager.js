import EventEmitter from '../../Utils/EventEmitter.js'

export default class SubtitlesManager extends EventEmitter {
    constructor() {
        super()
        this.subtitles = {} // Store active subtitles by sound name
        this.subtitleElement = null // Element to display subtitles
        
        this.initSubtitleDisplay()
    }

    /**
     * Initialise l'affichage des sous-titres
     */
    initSubtitleDisplay() {
        // Get the existing subtitle container from HTML
        this.subtitleElement = document.getElementById('subtitle-container')
        
        if (!this.subtitleElement) {
            console.error('Subtitle container not found in HTML. Make sure #subtitle-container exists.')
        }
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
     * Arrête les sous-titres pour un son spécifique
     * @param {string} name - Nom du son
     */
    stopSubtitlesForSound(name) {
        if (this.subtitles[name]) {
            clearTimeout(this.subtitles[name].timer)
            delete this.subtitles[name]
            this.hideSubtitle()
        }
    }

    /**
     * Arrête tous les sous-titres
     */
    stopAllSubtitles() {
        Object.keys(this.subtitles).forEach(name => {
            this.stopSubtitlesForSound(name)
        })
        this.hideSubtitle()
    }

    /**
     * Charge et parse un fichier WebVTT
     * @param {string} vttUrl - URL du fichier WebVTT
     * @returns {Promise<Array>} Tableau d'objets de sous-titres
     */
    async loadVTT(vttUrl) {
        try {

            const lang = localStorage.getItem('language') || 'fr'
            const response = await fetch(`/audio/subtitles/${lang}/${vttUrl}.vtt`)
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

    /**
     * Vérifie si des sous-titres sont actifs pour un son
     * @param {string} name - Nom du son
     * @returns {boolean} True si des sous-titres sont actifs
     */
    hasActiveSubtitles(name) {
        return !!this.subtitles[name]
    }

    /**
     * Obtient les sous-titres actifs pour un son
     * @param {string} name - Nom du son
     * @returns {Object|null} Informations sur les sous-titres actifs
     */
    getActiveSubtitles(name) {
        return this.subtitles[name] || null
    }

    /**
     * Nettoie et détruit le manager
     */
    destroy() {
        this.stopAllSubtitles()
        
        // Reset the subtitle element reference
        this.subtitleElement = null
        this.subtitles = {}
    }
}
