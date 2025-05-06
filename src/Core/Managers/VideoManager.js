import App from '../../App';
import EventEmitter from '../../Utils/EventEmitter';

export default class VideoManager extends EventEmitter {
    constructor() {
        super();
        
        this.app = new App();
        this.videoElement = null;
        this.videoContainer = null;
        this.isVideoPlaying = false;
        this.videoEnded = false;
        this.assetsLoaded = false;
        
        this.init();
    }
    
    init() {
        // Masquer le loader existant s'il existe
        const existingLoader = document.querySelector('.loading-bar');
        if (existingLoader) {
            existingLoader.style.display = 'none';
        }
        
        // Créer le conteneur pour la vidéo en plein écran
        this.videoContainer = document.createElement('div');
        this.videoContainer.id = 'video-loading-container';
        this.videoContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            background-color: #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;
        
        // Créer l'élément vidéo
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'intro-video';
        this.videoElement.playsInline = true;
        // Désactiver le mode muet pour avoir du son
        this.videoElement.muted = false;
        this.videoElement.controls = false;
        this.videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        
        // Ajouter un bouton "Passer"
        const skipButton = document.createElement('button');
        skipButton.textContent = 'Passer l\'introduction';
        skipButton.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            padding: 10px 15px;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            border: 1px solid white;
            border-radius: 4px;
            cursor: pointer;
            font-family: sans-serif;
            z-index: 1001;
        `;
        skipButton.addEventListener('click', () => this.skipVideo());
        
        this.videoContainer.appendChild(this.videoElement);
        this.videoContainer.appendChild(skipButton);
        document.body.appendChild(this.videoContainer);
        
        // Ajouter les écouteurs d'événements
        this.videoElement.addEventListener('ended', () => this.handleVideoEnded());
        this.videoElement.addEventListener('canplaythrough', () => {
            // Attendre que la vidéo soit prête à jouer
            console.log('Video can play through');
            this.startVideo();
        });
        this.videoElement.addEventListener('error', (e) => {
            console.error('Erreur video:', e);
            this.handleVideoEnded(); // Continuer en cas d'erreur
        });
        
        // Ajouter un écouteur d'événement sur le document pour activer le son
        // après la première interaction utilisateur
        const enableAudio = () => {
            if (this.videoElement && !this.videoElement.muted) {
                this.videoElement.muted = false;
                this.videoElement.volume = 1.0;
                
                if (this.isVideoPlaying) {
                    // Redémarrer la vidéo si elle est déjà en cours pour activer le son
                    const currentTime = this.videoElement.currentTime;
                    this.videoElement.pause();
                    this.videoElement.currentTime = currentTime;
                    this.videoElement.play().catch(e => console.error('Impossible de jouer la vidéo avec son:', e));
                }
                
                // Retirer les écouteurs une fois activés
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
                document.removeEventListener('keydown', enableAudio);
            }
        };
        
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
        document.addEventListener('keydown', enableAudio);
    }
    
    loadVideo(videoSrc) {
        console.log(`Loading video: ${videoSrc}`);
        // Vérifier si le chemin commence par '/'
        if (videoSrc.startsWith('/')) {
            // S'assurer que le chemin est relatif à la racine du site
            const baseUrl = window.location.origin;
            videoSrc = baseUrl + videoSrc;
        }
        
        this.videoElement.src = videoSrc;
        this.videoElement.load();
        
        // Essayer d'activer immédiatement le son, même si cela peut échouer sans interaction
        this.videoElement.muted = false;
        this.videoElement.volume = 1.0;
        
        // Ajouter un timeout de sécurité au cas où la vidéo ne charge pas
        setTimeout(() => {
            if (!this.isVideoPlaying && !this.videoEnded) {
                console.warn('Timeout - la vidéo n\'a pas démarré automatiquement');
                this.startVideo();
            }
        }, 3000);
    }
    
    startVideo() {
        if (!this.isVideoPlaying) {
            console.log('Starting video playback');
            this.isVideoPlaying = true;
            
            // Assurer que le son est activé
            this.videoElement.muted = false;
            this.videoElement.volume = 1.0;
            
            const playPromise = this.videoElement.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Video playback started successfully');
                    })
                    .catch(error => {
                        console.error('Video playback failed:', error);
                        
                        // Si la lecture échoue, créer un overlay pour informer l'utilisateur
                        const clickToPlayOverlay = document.createElement('div');
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
                        `;
                        clickToPlayOverlay.textContent = 'Cliquez pour lancer la vidéo avec son';
                        clickToPlayOverlay.addEventListener('click', () => {
                            this.videoElement.muted = false;
                            this.videoElement.play()
                                .then(() => {
                                    clickToPlayOverlay.remove();
                                })
                                .catch(e => {
                                    console.error('Impossible de jouer la vidéo après interaction:', e);
                                    this.handleVideoEnded(); // Passer à l'expérience si la vidéo ne peut toujours pas être lue
                                    clickToPlayOverlay.remove();
                                });
                        });
                        
                        this.videoContainer.appendChild(clickToPlayOverlay);
                    });
            }
        }
    }
    
    handleVideoEnded() {
        console.log('Video ended');
        this.videoEnded = true;
        this.checkReadyToStart();
    }
    
    updateLoadingProgress(progress) {
        // Nous n'affichons plus la barre de chargement
        console.log(`Chargement: ${Math.round(progress * 100)}%`);
    }
    
    notifyAssetsLoaded() {
        console.log('Assets loaded');
        this.assetsLoaded = true;
        this.checkReadyToStart();
    }
    
    checkReadyToStart() {
        console.log(`Check ready - Video ended: ${this.videoEnded}, Assets loaded: ${this.assetsLoaded}`);
        // Démarrer l'expérience quand la vidéo est terminée ET les ressources sont chargées
        if (this.videoEnded && this.assetsLoaded) {
            this.hideVideoScreen();
            this.trigger('ready');
        }
    }
    
    skipVideo() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.handleVideoEnded();
        }
    }
    
    hideVideoScreen() {
        this.videoContainer.style.opacity = '0';
        this.videoContainer.style.transition = 'opacity 1s ease';
        
        setTimeout(() => {
            if (this.videoContainer && this.videoContainer.parentNode) {
                this.videoContainer.parentNode.removeChild(this.videoContainer);
            }
        }, 1000);
    }
    
    destroy() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.removeAttribute('src');
            this.videoElement.load();
            this.videoElement = null;
        }
        
        if (this.videoContainer && this.videoContainer.parentNode) {
            this.videoContainer.parentNode.removeChild(this.videoContainer);
        }
        
        this.videoContainer = null;
    }
}