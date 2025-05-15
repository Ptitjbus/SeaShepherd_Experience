import App from '../../App'
import * as THREE from 'three'
export default class StoryManager {
    constructor() {
        this.app = null
        this.experienceStarted = false

        this.activeTasks = []

        this.init()
    }

    init() {}

    async resumeExperience() {
        const savedStep = this.loadProgress();
        if (!savedStep) {
            this.startExperience();
        }

        switch (savedStep) {
        case 'aquarium':
            this.initAquarium();
            break;
        case 'corridor':
            this.initCorridor();
            break;
        case 'aquaturtle':
            this.initTurtleBottom();
            break;
        case 'boat':
            this.initBoat();
            break;
        case 'end':
            this.initEnd();
            break;
        default:
            // Si l'étape n'est pas reconnue, démarrer depuis le début
            this.startExperience();
    }
    }
    
    async startExperience() {
        this.app = new App();
        
        
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.activeTasks.push('intro')
        this.app.mediaManager.showRoomTitle('Accueil du musée');

        this.app.startOverlay.classList.add('hidden')
        this.app.canvas.style.opacity = '1'
        this.app.soundManager.attachToSpeakers()

        this.app.soundManager.playMusic('background_intro')

        // A COMMENTER POUR ALLER PLUS VITE
        /*
        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('1_INTRO')

        if (!this.checkActiveTask('intro')) return
        await this.app.choicesManager.showChoices({
            title: "J'imagine que vous mourez  d'envie de savoir qui je suis ?",
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
            title: "Vous avez hâte, hein ....?",
            choice1: "Pour l'instant je suis pas convaincu …",
            choice2: "Ouais carrément !"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('3.2_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('3.3_CHOIX2');
            }
        })

        if (!this.checkActiveTask('intro')) return
        this.app.soundManager.stopAllMusicSounds(true, true)
        await this.app.mediaManager.playMediaWithGlitch('connexion')

        if (!this.checkActiveTask('intro')) return
        this.app.postProcessing.triggerGlitch()

        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('4_CONNEXION')
        */
        // ---
        
        if (!this.checkActiveTask('intro')) return
        this.app.doorManager.triggerOpenDoorByIndex(0)
        this.activeTasks = this.activeTasks.filter(task => task !== 'intro')
    }

    async initAquarium(){
        this.clearTasks(true)
        this.saveProgress('aquarium')

        this.activeTasks.push('aquarium')
        this.app.mediaManager.showRoomTitle('Aquarium des dauphins');
        this.app.doorManager.triggerCloseDoorByIndex(0)
        
        this.app.soundManager.playMusic('aquarium')

        // A COMMENTER POUR ALLER PLUS VITE
        /*
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
        */
        // ---

        this.app.objectManager.add("Couloir", new THREE.Vector3(0, 0, 0))

        // A COMMENTER POUR ALLER PLUS VITE

        await this.app.soundManager.playVoiceLine('5.4_FINDAUPHIN')

        // ---
        this.app.doorManager.triggerOpenDoorByIndex(1)
        this.activeTasks = this.activeTasks.filter(task => task !== 'aquarium')
    }

    async initCorridor(){
        this.clearTasks()
        this.saveProgress('corridor')

        this.activeTasks.push('corridor')
        this.app.soundManager.attachToSpeakers()
        this.app.soundManager.stopAllMusicSounds(true,false)
        await this.app.doorManager.triggerCloseDoorByIndex(1)
        await this.sleep(2000)
        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.remove("Dauphins")
        this.app.objectManager.removeBoids()

        // A COMMENTER POUR ALLER PLUS VITE

        if (!this.checkActiveTask('corridor')) return
        await this.app.soundManager.playVoiceLine('6.1_PUB')

        if (!this.checkActiveTask('corridor')) return
        await this.app.choicesManager.showChoices({
            choice1: "Lancer la publicité",
            choice2: "Ne pas supporter le musée"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 2) {
                await this.app.soundManager.playVoiceLine('6.2_VIDEO');
            }
        });

        const screenControls = this.app.objectManager.applyVideoToMultipleScreens(
            "Couloir",
            ["Cube_1", "Cube013_1"],
            "pub",
            "pub"
        )
        if (!this.checkActiveTask('corridor')) return
        await screenControls.turnOn()

        // ---

        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.add("Aquaturtle", new THREE.Vector3(0, 0, 0))
        this.app.objectManager.add("Elevator", new THREE.Vector3(0, 0, 0), {
            playAnimation : false,
            dynamicCollision: true,
        })
        this.app.objectManager.add("Tortue", new THREE.Vector3(0, 0, 0))
        this.app.objectManager.add("AquaturtleHaut", new THREE.Vector3(0, 0, 0))
        this.app.postProcessing.triggerGlitch()

        // A COMMENTER POUR ALLER PLUS VITE

        if (!this.checkActiveTask('corridor')) return
        await this.app.soundManager.playVoiceLine('6.3_NARRATEURINCOMPREHENSION')

        if (!this.checkActiveTask('corridor')) return
        await this.app.choicesManager.showChoices({
            choice1: "Oui, allons-y !",
            choice2: "J'ai l'impression qu'on ne me dit pas tout"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('6.4_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('6.5_CHOIX2');
            }
        });

        // ---

        await this.app.doorManager.triggerOpenDoorByIndex(2)
    }

    async initTurtleBottom(){
        this.clearTasks()
        this.saveProgress('aquaturtle')

        this.activeTasks.push('aquaturtle')
        this.app.soundManager.attachToSpeakers()
        this.app.soundManager.stopAllMusicSounds(true,false)
        await this.app.doorManager.triggerCloseDoorByIndex(2)
        await this.sleep(2000)
        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.remove("Couloir")

        this.app.soundManager.playMusic('aquaturtles')
        // this.app.objectManager.add("BoatScene", new THREE.Vector3(0, 0, 0))
        
        // A COMMENTER POUR ALLER PLUS VITE

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.soundManager.playVoiceLine('7.1_TORTUES')
    
        // ---
    }

    async initElevator(){
        const elevator = this.app.objectManager.get("Elevator")

        // Jouer toutes les animations et attendre qu'elles soient terminées
        await Promise.all(
            elevator.animations.map((clip) => {
            return new Promise((resolve) => {
                const action = elevator.mixer.clipAction(clip)
                action.reset()
                action.setLoop(THREE.LoopOnce, 1)
                action.clampWhenFinished = true
                action.play()
                // Résoudre la promesse à la fin de l'animation
                elevator.mixer.addEventListener('finished', function onFinish(e) {
                if (e.action === action) {
                    elevator.mixer.removeEventListener('finished', onFinish)
                    resolve()
                }
                })
            })
            })
        )

        console.log("en haut")

        this.app.objectManager.remove("Aquaturtle")

        // A COMMENTER POUR ALLER PLUS VITE
        this.app.mediaManager.showRoomTitle('Tortues de Mayotte');
        if (!this.checkActiveTask('aquaturtle')) return
        await this.sleep(1000)
        await this.app.soundManager.playVoiceLine('7.1_TORTUES2')

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('error1')
        await this.app.soundManager.playVoiceLine('7.2_VIDEO')

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('bigvideo')
        await this.app.soundManager.playVoiceLine('7.2_BUG')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.choicesManager.showChoices({
            choice1: "C'est trop mignon les tortues !",
            choice2: "Connaître la vérité"
        }).then(async (choiceIndex) => {
            this.app.mediaManager.playMediaWithGlitch('bigvideo')
        });
        await this.app.soundManager.playVoiceLine('7.3_FAKENEWS')
        this.app.postProcessing.triggerBigGlitch()

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('error1')
        await this.app.soundManager.playVoiceLine('7.4_INTOX')
        this.app.postProcessing.triggerGlitch()

        // ---

        // this.initBoat()

    }

    async initBoat(){
        this.clearTasks()

        this.saveProgress('boat')
        this.activeTasks.push('boat')
        this.app.soundManager.attachToSpeakers()
        this.app.soundManager.stopAllMusicSounds(true,false)
        await this.sleep(2000)
        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.remove("AquaturtleHaut")
        this.app.objectManager.remove("Elevator")
        this.app.objectManager.remove("Tortue")
        this.app.objectManager.remove("Aquaturtle")

        this.app.objectManager.add("BoatScene", new THREE.Vector3(0, 0, 0))

    }

    async initEnd() {
        this.clearTasks();

        this.saveProgress('end')
        this.activeTasks.push('end');

        const endRoomPosition = new THREE.Vector3(50, 0, -50); // Position plus éloignée, légèrement au-dessus du sol
        
        this.app.renderer.toneMapping = THREE.NoToneMapping;
        this.app.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

        if (this.app.scene.environment) {
            this.app.scene.environment = null
            this.app.scene.background = new THREE.Color(0x000000);
        }

        if (this.app.ocean) {
            this.app.ocean.setColor(0x000000);

            if (this.app.ocean.water && this.app.ocean.water.material) {
                const waterUniforms = this.app.ocean.water.material.uniforms;

                if (waterUniforms.waterColor) {
                    waterUniforms.waterColor.value.setRGB(0, 0, 0.005);
                }
                
                if (waterUniforms.sunColor) {
                    waterUniforms.sunColor.value.setRGB(0, 0, 0);
                }
                
                if (waterUniforms.distortionScale) {
                    waterUniforms.distortionScale.value = 5.0; 
                }
                
                if (waterUniforms.size) {
                    waterUniforms.size.value = 2.0;
                }
                
                if (this.app.ocean.water.material.opacity !== undefined) {
                    this.app.ocean.water.material.opacity = 1.0;
                }
                
                if (this.app.ocean.water.material.metalness !== undefined) {
                    this.app.ocean.water.material.metalness = 0.9;
                }
                
                if (this.app.ocean.water.material.roughness !== undefined) {
                    this.app.ocean.water.material.roughness = 0.1;
                }
            }
        }

        this.app.scene.traverse(object => {
            if (object.isLight && !object.name.includes('videoPanel')) {
                object.intensity *= 0.3;
            }
        });

        this.app.physicsManager.sphereBody.position.copy(endRoomPosition);
        this.app.physicsManager.sphereBody.velocity.set(0, 0, 0);
        
        await this.sleep(500);
        
        const panelsContainer = new THREE.Object3D();
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
            
            const videoTexture = new THREE.VideoTexture(video);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            
            const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
            const panelMaterial = new THREE.MeshBasicMaterial({
                map: videoTexture,
                side: THREE.DoubleSide
            });
            
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            
            panel.position.set(x, panelHeight / 2, z);
            panel.rotation.y = Math.PI - angle;
            panel.name = `videoPanel_${i}`;
            
            panelsContainer.add(panel);
            
            video.play().catch(e => console.error("Erreur lors de la lecture vidéo:", e));
        }
        
        const triggerCenter = new THREE.Vector3(
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

    async clearTasks(forceStopSounds = false){
        if(forceStopSounds){
            this.app.soundManager.stopAllCustomSounds(true,true)
            this.app.soundManager.stopAllMusicSounds(true,true)
        }
        this.activeTasks = []
    }

    endExperience() {
        if (this.experienceEnded) return
        this.experienceEnded = true
        this.clearProgress();

        this.app.endOverlay.classList.remove('hidden')

        void this.app.endOverlay.offsetWidth

        this.app.canvas.style.opacity = '0'

        setTimeout(() => {
            this.app.endOverlay.classList.add('visible')
        }, 100)
    }

    destroy() {}

    saveProgress(step) {
        try {
            const savedData = {
                step: step,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('seaShepherdProgress', JSON.stringify(savedData));
            console.log(`Progression sauvegardée: ${step}`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la progression:', error);
        }
    }

    loadProgress() {
        try {
            const savedData = localStorage.getItem('seaShepherdProgress');
            if (!savedData) return null;
            
            const parsedData = JSON.parse(savedData);
            
            // Vérifier si la sauvegarde date de moins de 7 jours
            const currentTime = new Date().getTime();
            const savedTime = parsedData.timestamp || 0;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
            
            if (currentTime - savedTime > maxAge) {
                console.log('Sauvegarde expirée, suppression...');
                this.clearProgress();
                return null;
            }
            
            console.log(`Progression chargée: ${parsedData.step}`);
            return parsedData.step;
        } catch (error) {
            console.error('Erreur lors du chargement de la progression:', error);
            return null;
        }
    }
    
    clearProgress() {
        try {
            localStorage.removeItem('seaShepherdProgress');
            console.log('Progression effacée');
        } catch (error) {
            console.error('Erreur lors de la suppression de la progression:', error);
        }
    }
}
