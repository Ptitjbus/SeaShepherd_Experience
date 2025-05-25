import App from '../../App'
import EventEmitter from '../../Utils/EventEmitter'

export default class VideoManager extends EventEmitter {
    constructor() {
        super()

        this.app = new App()
        this.videoElement = null
        this.videoContainer = null
        this.isVideoPlaying = false
        this.videoEnded = false

        this.init()
    }

    init() {
        this.videoContainer = document.getElementById('video-loading-container')
        this.videoElement = document.getElementById('intro-video')

        const skipButton = document.getElementById('skip-video-btn')

        skipButton.addEventListener('click', () => this.skipVideo())

        // Ajouter les écouteurs d'événements
        this.videoElement.addEventListener('ended', () => this.handleVideoEnded())

        this.videoElement.addEventListener('error', e => {
            console.error('Erreur video:', e)
            this.handleVideoEnded() // Continuer en cas d'erreur
        })
    }

    loadVideo(videoSrc) {
        console.log(`Loading video: ${videoSrc}`)
        // Vérifier si le chemin commence par '/'
        if (videoSrc.startsWith('/')) {
            // S'assurer que le chemin est relatif à la racine du site
            const baseUrl = window.location.origin
            videoSrc = baseUrl + videoSrc
        }

        this.videoElement.src = videoSrc
        this.videoElement.load()

        // Essayer d'activer immédiatement le son, même si cela peut échouer sans interaction
        this.videoElement.muted = false
        this.videoElement.volume = 1.0

        // Ajouter un timeout de sécurité au cas où la vidéo ne charge pas
        setTimeout(() => {
            if (!this.isVideoPlaying && !this.videoEnded) {
                console.warn("Timeout - la vidéo n'a pas démarré automatiquement")
                this.startVideo()
            }
        }, 3000)
    }

    startVideo() {
        if (!this.isVideoPlaying && !this.videoEnded) {
            console.log('Starting video playback')
            this.isVideoPlaying = true

            // Assurer que le son est activé
            this.videoElement.muted = false
            this.videoElement.volume = 1.0

            const playPromise = this.videoElement.play()
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Video playback started successfully')
                    })
                    .catch(error => {
                        console.error('Video playback failed:', error)

                        // Si la lecture échoue, créer un overlay pour informer l'utilisateur
                        const clickToPlayOverlay = document.createElement('div')
                        clickToPlayOverlay.style.cssText = `
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.7);
                            color: white;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-family: sans-serif;
                            font-size: 24px;
                            cursor: pointer;
                            z-index: 1002;
                        `
                        clickToPlayOverlay.textContent = 'Cliquez pour lancer la vidéo avec son'
                        clickToPlayOverlay.addEventListener('click', () => {
                            this.videoElement.muted = false
                            this.videoElement
                                .play()
                                .then(() => {
                                    clickToPlayOverlay.remove()
                                })
                                .catch(e => {
                                    console.error(
                                        'Impossible de jouer la vidéo après interaction:',
                                        e
                                    )
                                    this.handleVideoEnded() // Passer à l'expérience si la vidéo ne peut toujours pas être lue
                                    clickToPlayOverlay.remove()
                                })
                        })

                        this.videoContainer.appendChild(clickToPlayOverlay)
                    })
            }
        }
    }

    showSkipButton() {
        const skipButton = document.getElementById('skip-video-btn')
        skipButton.style.opacity = '1'
        skipButton.disabled = false
    }

    handleVideoEnded() {
        console.log('Video ended')
        this.videoEnded = true
        this.app.assetManager.showMainScreen()
    }

    skipVideo() {
        if (this.videoElement) {
            this.videoElement.pause()
            this.handleVideoEnded()
        }
    }

    hideVideoScreen() {
        this.videoContainer.style.opacity = '0'
        this.videoContainer.style.transition = 'opacity 1s ease'

        setTimeout(
            () => {
                if (this.videoContainer && this.videoContainer.parentNode) {
                    this.videoContainer.parentNode.removeChild(this.videoContainer)
                }
            },
            this.app.debug.active ? 0 : 1000
        )
    }

    destroy() {
        if (this.videoElement) {
            this.videoElement.pause()
            this.videoElement.removeAttribute('src')
            this.videoElement = null
        }

        if (this.videoContainer && this.videoContainer.parentNode) {
            this.videoContainer.parentNode.removeChild(this.videoContainer)
        }

        this.videoContainer = null
    }
}
