import App from '../../App'
import { Object3D, Vector3, PlaneGeometry, MeshBasicMaterial, NoToneMapping, LinearSRGBColorSpace ,Color, Mesh, DoubleSide, VideoTexture, LinearFilter } from 'three'

export default class StoryManager {
    constructor() {
        this.app = new App()
        this.experienceStarted = false

        this.activeTasks = []

        this.init()
    }

    init() {}

    async startExperience() {
        
        
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.activeTasks.push('intro')

        this.app.startOverlay.classList.add('hidden')
        this.app.canvas.style.opacity = '1'

        this.app.soundManager.playMusic('background_intro')

        await this.initEnd()
        /*
        if (!this.checkActiveTask('intro')) return
        
        await this.app.soundManager.playVoiceLine('1_INTRO')

        if (!this.checkActiveTask('intro')) return
        
        await this.app.choicesManager.showChoices({
            choice1: "Dites moi",
            choice2: "Non pas vraiment"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('2.1_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('2.2_CHOIX2');
            }
        });

        if (!this.checkActiveTask('intro')) return

        await this.app.soundManager.playVoiceLine('3.1_VOUSAVEZHATE')

        if (!this.checkActiveTask('intro')) return

        await this.app.choicesManager.showChoices({
            choice1: "Pour l'instant je suis pas convaincu …",
            choice2: "Ouais carrément !"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('3.2_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('3.3_CHOIX2');
            }
        });

       

        if (!this.checkActiveTask('intro')) return
        this.app.soundManager.stopAllMusicSounds(true, true)
        await this.app.mediaManager.playMediaWithGlitch('connexion')
        if (!this.checkActiveTask('intro')) return
        this.app.postProcessing.triggerGlitch()
        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('4_CONNEXION')
        if (!this.checkActiveTask('intro')) return
        this.app.doorManager.triggerOpenDoorByIndex(0)
        this.activeTasks = this.activeTasks.filter(task => task !== 'intro')
        */
    }

    async initAquarium(){
        this.clearTasks()

        this.activeTasks.push('aquarium')
        
        this.app.soundManager.playMusic('aquarium')
        await this.sleep(2000)
        if (!this.checkActiveTask('aquarium')) return
        await this.app.soundManager.playVoiceLine('5.1_DAUPHINS')

        if (!this.checkActiveTask('aquarium')) return
        await this.app.choicesManager.showChoices({
            choice1: "Dites m'en plus je veux tout savoir !",
            choice2: "Vous avez rien de plus intéressant ?"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('5.2_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('5.3_CHOIX2');
            }
        });

        if (!this.checkActiveTask('aquarium')) return
        await this.sleep(2000)
        await this.app.soundManager.playVoiceLine('5.4_FINDAUPHIN')
        this.app.doorManager.triggerOpenDoorByIndex(1)
        this.activeTasks = this.activeTasks.filter(task => task !== 'aquarium')
    }

    async initEnd() {
        this.clearTasks();
        this.activeTasks.push('end');

        const endRoomPosition = new Vector3(50, 0, -50); // Position plus éloignée, légèrement au-dessus du sol
        
        this.app.renderer.toneMapping = NoToneMapping;
        this.app.renderer.outputColorSpace = LinearSRGBColorSpace;

        if (this.app.scene.environment) {
            this.app.scene.environment = null
            this.app.scene.background = new Color(0x000000);
        }

        if (this.app.ocean) {
            // Set absolute black color
            this.app.ocean.setColor(0x000000);

            if (this.app.ocean.water && this.app.ocean.water.material) {
                const waterUniforms = this.app.ocean.water.material.uniforms;
                
                // Make water much darker with minimal color
                if (waterUniforms.waterColor) {
                    waterUniforms.waterColor.value.setRGB(0, 0, 0.005); // Almost pure black with tiny hint of blue
                }
                
                // Adjust reflection highlights to be more subtle but crisp
                if (waterUniforms.sunColor) {
                    waterUniforms.sunColor.value.setRGB(0.2, 0.2, 0.3); // More subtle reflections
                }
                
                // Increase distortion for more dramatic waves
                if (waterUniforms.distortionScale) {
                    waterUniforms.distortionScale.value = 5.0; // Higher distortion
                }
                
                // Reduce water transparency/clarity
                if (waterUniforms.size) {
                    waterUniforms.size.value = 2.0; // Less transparent
                }
                
                // Adjust standard material properties for more darkness
                if (this.app.ocean.water.material.opacity !== undefined) {
                    this.app.ocean.water.material.opacity = 1.0; // Fully opaque
                }
                
                if (this.app.ocean.water.material.metalness !== undefined) {
                    this.app.ocean.water.material.metalness = 0.9; // More metallic for sharper reflections
                }
                
                if (this.app.ocean.water.material.roughness !== undefined) {
                    this.app.ocean.water.material.roughness = 0.1; // Less rough for more pronounced highlights
                }
            }
        }

        // Ensure all lights are dimmed to enhance darkness
        this.app.scene.traverse(object => {
            if (object.isLight && !object.name.includes('videoPanel')) {
                object.intensity *= 0.3; // Reduce all light intensity
            }
        });

        this.app.physicsManager.sphereBody.position.copy(endRoomPosition);
        this.app.physicsManager.sphereBody.velocity.set(0, 0, 0);
        
        await this.sleep(500);
        
        const panelsContainer = new Object3D();
        panelsContainer.name = "endPanelsContainer";
        panelsContainer.position.copy(endRoomPosition);
        this.app.scene.add(panelsContainer);
        
        const videos = [
            { id: 'fishing-video', src: '/videos/720p/PUBDEMERDE.mp4' },
            { id: 'dolphins-video', src: '/videos/720p/PUBDEMERDE.mp4' },
            { id: 'turtle-video', src: '/videos/720p/PUBDEMERDE.mp4' }
        ];
        
        const radius = 8;
        const arcAngle = Math.PI * 0.5;
        const panelWidth = 4;
        const panelHeight = 6;
        
        for (let i = 0; i < 3; i++) {
            const angle = -arcAngle/2 + (i * arcAngle/2);
            
            const x = radius * Math.sin(angle);
            const z = -radius * Math.cos(angle);
            
            const video = document.createElement('video');
            video.id = videos[i].id;
            video.src = videos[i].src;
            video.loop = true;
            video.volume = 0.5
            video.playsInline = true;
            video.autoplay = true;
            
            const videoTexture = new VideoTexture(video);
            videoTexture.minFilter = LinearFilter;
            videoTexture.magFilter = LinearFilter;
            
            const panelGeometry = new PlaneGeometry(panelWidth, panelHeight);
            const panelMaterial = new MeshBasicMaterial({
                map: videoTexture,
                side: DoubleSide
            });
            
            const panel = new Mesh(panelGeometry, panelMaterial);
            
            panel.position.set(x, panelHeight / 2, z);
            panel.rotation.y = Math.PI - angle;
            panel.name = `videoPanel_${i}`;
            
            panelsContainer.add(panel);
            
            video.play().catch(e => console.error("Erreur lors de la lecture vidéo:", e));
        }
        
        const triggerCenter = new Vector3(
            endRoomPosition.x, 
            endRoomPosition.y, 
            endRoomPosition.z - 4
        );
        
        const triggerRadius = 3;
        this.app.objectManager.addEventTrigger(
            triggerCenter,
            triggerRadius * 2,
            4,
            triggerRadius * 2,
            () => {
                if (this.checkActiveTask('end')) {
                    this.app.soundManager.playVoiceLine('final_message');
                    //this.endExperience();
                }
            }
        );
        
        // Jouer la musique d'ambiance pour la finale
        this.app.soundManager.playMusic('end_ambience', { volume: 0.5 });
        
        // Voix explicative de l'exposition finale
        await this.sleep(1000);
        if (!this.checkActiveTask('end')) return;
        await this.app.soundManager.playVoiceLine('6_FINAL_EXHIBIT');
    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async checkActiveTask(task){
        if (!this.activeTasks.includes(task)) return false
        return true
    }

    async clearTasks(){
        this.app.soundManager.stopAllCustomSounds(true,true)
        this.app.soundManager.stopAllMusicSounds(true,true)
        this.activeTasks = []
    }

    endExperience() {
        if (this.experienceEnded) return
        this.experienceEnded = true

        this.endOverlay.classList.remove('hidden')

        void this.endOverlay.offsetWidth

        this.canvas.style.opacity = '0'

        setTimeout(() => {
            this.endOverlay.classList.add('visible')
        }, 100)
    }

    destroy() {}
}
