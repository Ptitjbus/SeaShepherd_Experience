import App from '../../App';
import { PlaneGeometry, Mesh, MeshBasicMaterial, VideoTexture } from 'three';

export default class MediaManager {
    constructor() {
        this.app = new App();
        this.mediaElements = new Map();
        this.currentMedia = null;
        this.postProcessingManager = null;
    }

    init(scene) {
        this.scene = scene;
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

    playMedia(id) {
        if (!this.mediaElements.has(id)) {
            console.error(`MediaManager: Media with id ${id} not found`);
            return;
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
                    transparent: true
                });
                
                const mesh = new Mesh(geometry, material);
                mesh.scale.set(0.2, 0.2, 0.2);
                mesh.position.set(0, 1.5, -1); // Position in front of camera
                mesh.name = `media-${id}`;
                
                mediaData.mesh = mesh;
                this.scene.add(mesh);
            } else {
                // Show existing mesh
                mediaData.mesh.visible = true;
            }

            // Play the video
            element.currentTime = 0;
            element.play();
            
            // Trigger the glitch effect
            if (config.glitchType === 'big') {
                this.postProcessingManager.triggerBigGlitch();
            } else {
                this.postProcessingManager.triggerGlitch();
            }

            // Set as current media
            this.currentMedia = id;

            // Set a timeout to hide the media after the specified duration
            if (config.duration) {
                setTimeout(() => {
                    this.hideMedia(id);
                }, config.duration);
            }
        }
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
        }
    }

    stopAllMedia() {
        this.mediaElements.forEach((mediaData, id) => {
            this.hideMedia(id);
        });
    }

    // This method positions media in relation to the camera
    update(camera) {
        if (this.currentMedia) {
            const mediaData = this.mediaElements.get(this.currentMedia);
            if (mediaData && mediaData.mesh) {
                // Position the media in front of the camera
                const direction = camera.getWorldDirection(camera.position.clone());
                mediaData.mesh.position.copy(camera.position).add(direction.multiplyScalar(2));
                mediaData.mesh.lookAt(camera.position);
            }
        }
    }

    // Add a convenience method to play media and trigger glitch simultaneously
    playMediaWithGlitch(id) {
        this.playMedia(id);
    }

    destroy() {
        this.stopAllMedia();
        
        this.mediaElements.forEach((mediaData) => {
            if (mediaData.mesh) {
                this.scene.remove(mediaData.mesh);
                mediaData.mesh.geometry.dispose();
                mediaData.mesh.material.dispose();
            }
        });
        
        this.mediaElements.clear();
        this.scene = null;
        this.postProcessingManager = null;
    }
}