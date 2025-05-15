import { contain } from 'three/src/extras/TextureUtils.js';
import App from '../../App';
import { PlaneGeometry, Mesh, MeshBasicMaterial, VideoTexture, Vector3 } from 'three';

export default class MediaManager {
    constructor() {
        this.app = null;
        this.mediaElements = new Map();
        this.currentMedia = null;
        this.postProcessingManager = null;
        
        // Ajout d'un drapeau pour suivre les mises à jour
        this.needsUpdate = false;
        
        // Attacher la méthode update au contexte de cette instance
        this.update = this.update.bind(this);
    }

    init(scene) {
        this.app = new App();
        this.scene = scene;
        
        // Commencer la boucle d'animation dès l'initialisation
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        // Vérifier si l'animation loop existe ET contient une méthode addCallback
        if (this.app && this.app.animationLoop && typeof this.app.animationLoop.addCallback === 'function') {
            this.app.animationLoop.addCallback(this.update);
        } else {
            // Fallback si l'animationLoop n'est pas disponible ou n'a pas la méthode addCallback
            console.warn("MediaManager: animationLoop.addCallback not found, using requestAnimationFrame fallback");
            
            const animate = () => {
                if (this.currentMedia && this.needsUpdate) {
                    this.updateMediaPosition();
                }
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    connectToPostProcessingManager(postProcessingManager) {
        this.postProcessingManager = postProcessingManager;
    }

    preloadMedia(mediaConfig) {
        Object.entries(mediaConfig).forEach(([id, config]) => {
            if (config.type === 'video') {
                const video = document.createElement('video');
                video.src = config.src;
                video.loop = config.loop || false;
                video.muted = config.muted || false;
                video.preload = 'auto';
                
                this.mediaElements.set(id, {
                    element: video,
                    config: config,
                    mesh: null
                });
            }
        });
    }

    async playMedia(id) {
        if (!this.mediaElements.has(id)) {
            console.error(`MediaManager: Media with id ${id} not found`);
            return false;
        }

        const mediaData = this.mediaElements.get(id);
        const { element, config } = mediaData;

        // If there's currently a media playing, hide it
        if (this.currentMedia) {
            this.hideMedia(this.currentMedia);
        }

        // Play the video
        if (config.type === 'video') {
            if (!mediaData.mesh) {
                // Create video texture and mesh if not already created
                const videoTexture = new VideoTexture(element);
                const geometry = new PlaneGeometry(16, 9);
                const material = new MeshBasicMaterial({ 
                    map: videoTexture,
                    transparent: true,
                    opacity: 1.0,
                    depthTest: false, // Désactiver le test de profondeur pour toujours afficher au-dessus
                    depthWrite: false // Ne pas écrire dans le buffer de profondeur
                });
                
                const mesh = new Mesh(geometry, material);
                mesh.scale.set(0.5, 0.5, 0.5); // Taille initiale
                mesh.renderOrder = 999; // S'assurer qu'il est rendu en dernier
                mesh.name = `media-${id}`;
                mesh.frustumCulled = false; // Ne jamais cacher même hors du frustum
                
                mediaData.mesh = mesh;
                this.scene.add(mesh);
            } else {
                // Show existing mesh
                mediaData.mesh.visible = true;
            }

            // Play the video
            element.currentTime = 0;
            try {
                await element.play();
            } catch (e) {
                console.error("Failed to play video:", e);
                return false;
            }
            
            // Trigger the glitch effect
            if (this.postProcessingManager) {
                if (config.glitchType === 'big') {
                    this.postProcessingManager.triggerBigGlitch();
                } else {
                    this.postProcessingManager.triggerGlitch();
                }
            }

            // Set as current media
            this.currentMedia = id;
            this.needsUpdate = true;
            
            // Forcer une première mise à jour de position
            this.updateMediaPosition();

            // Return a promise that resolves when the video ends
            return new Promise((resolve) => {
                const onEnded = () => {
                    element.removeEventListener('ended', onEnded);
                    this.hideMedia(id);
                    resolve(true);
                };
                element.addEventListener('ended', onEnded);

                // Set a timeout to hide the media after the specified duration (if provided)
                if (config.duration) {
                    setTimeout(() => {
                        element.removeEventListener('ended', onEnded);
                        this.hideMedia(id);
                        resolve(true);
                    }, config.duration);
                }
            });
        }

        return false;
    }

    hideMedia(id) {
        if (!this.mediaElements.has(id)) return;
        
        const mediaData = this.mediaElements.get(id);
        const { element, config, mesh } = mediaData;

        if (config.type === 'video') {
            element.pause();
            if (mesh) {
                mesh.visible = false;
            }
        }

        if (this.currentMedia === id) {
            this.currentMedia = null;
            this.needsUpdate = false;
        }
    }

    stopAllMedia() {
        this.mediaElements.forEach((mediaData, id) => {
            this.hideMedia(id);
        });
    }

    // Méthode pour mettre à jour la position de la vidéo par rapport à la caméra
    updateMediaPosition() {
        const camera = this.app.camera;
        if (!camera || !camera.mainCamera) return;
        
        const mediaData = this.mediaElements.get(this.currentMedia);
        if (!mediaData || !mediaData.mesh) return;
        
        // Approche plus directe: attacher directement le mesh à la caméra comme enfant
        if (mediaData.mesh.parent !== camera.mainCamera) {
            // Retirer d'abord du parent actuel
            if (mediaData.mesh.parent) {
                mediaData.mesh.parent.remove(mediaData.mesh);
            }
            
            // Ajouter comme enfant direct de la caméra
            camera.mainCamera.add(mediaData.mesh);
            
            // Positionner la vidéo plus loin pour qu'elle soit moins imposante
            mediaData.mesh.position.set(0, 0, -0.3);
            
            // Réinitialiser la rotation locale
            mediaData.mesh.rotation.set(0, 0, 0);
            
            // Définir une taille beaucoup plus petite
            mediaData.mesh.scale.set(0.03, 0.03, 1);
        }
    }

    // This method is called every frame to update media position
    update() {
        if (this.currentMedia && this.needsUpdate) {
            this.updateMediaPosition();
        }
    }

    // Add a convenience method to play media and trigger glitch simultaneously
    async playMediaWithGlitch(id) {
        await this.playMedia(id);
    }

    destroy() {
        // Arrêter la boucle d'animation
        if (this.app && this.app.animationLoop) {
            this.app.animationLoop.removeCallback(this.update);
        }
        
        this.stopAllMedia();
        
        this.mediaElements.forEach((mediaData) => {
            if (mediaData.mesh) {
                this.scene.remove(mediaData.mesh);
                mediaData.mesh.geometry.dispose();
                mediaData.mesh.material.dispose();
                if (mediaData.mesh.material.map) {
                    mediaData.mesh.material.map.dispose();
                }
            }
        });
        
        this.mediaElements.clear();
        this.scene = null;
        this.postProcessingManager = null;
    }

    // Ajoute cette méthode dans ta classe MediaManager (ou StoryManager si tu préfères)
    showRoomTitle(title) {
        const container = document.getElementById('room-title-container');
        const titleElem = document.getElementById('room-title');
        if (!container || !titleElem) return;

        // Change le texte
        titleElem.textContent = title;

        // Affiche le conteneur
        container.style.opacity = '1';
        container.style.filter = 'blur(0px)';

        // Masque après 2 secondes
        setTimeout(() => {
            setTimeout(() => {
                container.style.opacity = '0';
                container.style.filter = 'blur(5px)';
            }, 500); // Laisse le temps à l'animation d'opacité si besoin
        }, 2000);
    }
}