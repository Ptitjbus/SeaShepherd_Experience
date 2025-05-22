import App from '../../App'
import * as THREE from 'three'
import { SaveManager } from './SaveManager'

export default class StoryManager {
    constructor() {
        this.app = new App()
        this.experienceStarted = false

        this.activeTasks = []
        this.saveManager = new SaveManager()
        this.savedStep = null
        this.endPanels = null
        this.activePanelIndex = null
        this.experienceEnded = false

        this.init()
    }

    init() {
        this.savedStep = this.saveManager.loadProgress()
    }

    async startOrResume() {
        if (!this.savedStep) {
            this.app.objectManager.add("Dauphins", new THREE.Vector3(0, 0, 0))
            this.teleportPlayerTo(new THREE.Vector3(30, 1.3, 0), new THREE.Vector3(0, Math.PI / 2, 0))
            return
        }
        switch (this.savedStep) {
            case 'aquarium':
                this.app.objectManager.add("Dauphins", new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(-14, 1.3, 0), new THREE.Vector3(0, Math.PI / 2, 0))
                break;
            case 'corridor':
                this.app.objectManager.add("Couloir", new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(-51, 1.3, -35.55))
                break;
            case 'aquaturtle':
                this.createTurtlesBottom()
                this.teleportPlayerTo(new THREE.Vector3(-72, 1.3, -121), new THREE.Vector3(0, Math.PI / 2, 0))
                break;
            case 'boat':
                this.initBoat();
                break;
            case 'end':
                this.initEnd();
                break;
            default:
                this.app.objectManager.add("Dauphins", new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(30, 1.3, 0), new THREE.Vector3(0, Math.PI / 2, 0))
        }
    }

    async startExperience() {
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.activeTasks.push('intro')
        await this.sleep(2000)

        this.app.mediaManager.showRoomTitle('Accueil du musée');
        this.app.soundManager.playMusic('background_intro')

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

        if (!this.checkActiveTask('intro')) return
        this.app.doorManager.triggerOpenDoorByIndex(0)
        this.activeTasks = this.activeTasks.filter(task => task !== 'intro')
    }

    async initAquarium() {
        await this.initRoom('aquarium')

        this.app.mediaManager.showRoomTitle('Aquarium des dauphins');

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

        this.app.objectManager.add("Couloir", new THREE.Vector3(0, 0, 0))

        await this.app.soundManager.playVoiceLine('5.4_FINDAUPHIN')

        this.app.doorManager.triggerOpenDoorByIndex(1)
        this.activeTasks = this.activeTasks.filter(task => task !== 'aquarium')
    }

    async initCorridor() {
        await this.initRoom('corridor')

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

        this.app.postProcessing.triggerGlitch()
        this.createTurtlesBottom()
        this.app.postProcessing.triggerGlitch()

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

        await this.app.doorManager.triggerOpenDoorByIndex(2)
    }

    async initTurtleBottom() {
        await this.initRoom('aquaturtle')

        this.app.soundManager.playMusic('aquaturtles')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.soundManager.playVoiceLine('7.1_TORTUES')
    }

    async initElevator() {
        const elevator = this.app.objectManager.get("Elevator")
        this.app.objectManager.add("AquaturtleHaut", new THREE.Vector3(0, 0, 0))

        await Promise.all(
            elevator.animations.map((clip) => {
                return new Promise((resolve) => {
                    const action = elevator.mixer.clipAction(clip)
                    action.reset()
                    action.setLoop(THREE.LoopOnce, 1)
                    action.clampWhenFinished = true
                    action.play()
                    elevator.mixer.addEventListener('finished', function onFinish(e) {
                        if (e.action === action) {
                            elevator.mixer.removeEventListener('finished', onFinish)
                            resolve()
                        }
                    })
                })
            })
        )

        this.app.objectManager.remove("Aquaturtle")
        this.app.objectManager.remove("Tortue")

        this.app.mediaManager.showRoomTitle('Tortues de Mayotte');
        if (!this.checkActiveTask('aquaturtle')) return
        await this.sleep(1000)
        await this.app.soundManager.playVoiceLine('7.2_TORTUES')

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('error1')
        await this.app.soundManager.playVoiceLine('7.3_VIDEO')

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('bigvideo')
        await this.app.soundManager.playVoiceLine('7.4_VIDEO')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.choicesManager.showChoices({
            choice1: "C'est trop mignon les tortues !",
            choice2: "Connaître la vérité"
        }).then(async (choiceIndex) => {
            this.app.mediaManager.playMediaWithGlitch('bigvideo')
        });
        await this.app.soundManager.playVoiceLine('7.5_FAKENEWS')
        this.app.postProcessing.triggerBigGlitch()

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('error1')
        await this.app.soundManager.playVoiceLine('7.6_INTOX')
        this.app.postProcessing.triggerGlitch()
    }

    async initBoat() {
        await this.initRoom('boat')

        this.app.objectManager.add("BoatScene", new THREE.Vector3(0, 0, 0))
    }

    async initEnd() {
        this.clearTasks();

        this.saveManager.saveProgress('end')
        this.activeTasks.push('end');

        const endRoomPosition = new THREE.Vector3(50, 0, -50);

        this.app.renderer.toneMapping = THREE.NoToneMapping;
        this.app.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

        if (this.app.scene.environment) {
            this.app.scene.environment = null
            this.app.scene.background = new THREE.Color(0x000000);
        }

        this.app.scene.traverse(object => {
            if (object.isLight && !object.name.includes('videoPanel')) {
                object.intensity *= 0.3;
            }
        });

        this.teleportPlayerTo(endRoomPosition);

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

        let panel1, panel2, panel3;

        const loader = new THREE.TextureLoader();
        const labelTexture = loader.load('images/ui/test_enter.png'); // Ton image "Appuyez sur Entrée"

        for (let i = 0; i < 3; i++) {
            const angle = -arcAngle / 2 + (i * arcAngle / 2);

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

            panel.lookAt(0, panel.position.y, 0); // Oriente le panel vers le centre de la scène (ou vers la caméra si tu veux)

            panelsContainer.add(panel);

            video.play().catch(e => console.error("Erreur lors de la lecture vidéo:", e));

            const spriteMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(2, 0.6, 1); // adapte la taille à ton besoin

            // Place le sprite juste devant le panel
            sprite.position.set(0, 0, -0.05); // 5cm derrière le panel
            panel.add(sprite);

            // Cache le sprite au début
            sprite.visible = false;

            // Stocke le sprite pour chaque panel
            if (!this.panelSprites) this.panelSprites = [];
            this.panelSprites.push(sprite);

            const labelGeometry = new THREE.PlaneGeometry(2, 0.6); // adapte la taille si besoin
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: labelTexture,
                transparent: true,
                depthTest: false // optionnel, pour éviter les soucis de z-fighting
            });
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

            // Place le label juste devant le panel, centré
            labelMesh.position.set(0, 0, 0.15); // 11cm devant le panel
            // Pas de rotation : il reste dans le repère local du panel

            labelMesh.visible = false; // caché par défaut

            panel.add(labelMesh);

            // Stocke le mesh pour chaque panel
            if (!this.panelLabelMeshes) this.panelLabelMeshes = [];
            this.panelLabelMeshes.push(labelMesh);

            if (i === 0) panel1 = panel;
            if (i === 1) panel2 = panel;
            if (i === 2) panel3 = panel;
        }

        this.endPanels = [
            { mesh: panel1, url: "https://google.com" },
            { mesh: panel2, url: "https://x.com" },
            { mesh: panel3, url: "https://instagram.com" }
        ];
        this.activePanelIndex = null;

        window.addEventListener('keydown', this.handleEndPanelEnter);

        this.app.soundManager.playMusic('end_ambience', { volume: 0.5 });

        await this.sleep(1000);
        if (!this.checkActiveTask('end')) return;
        await this.app.soundManager.playVoiceLine('6_FINAL_EXHIBIT');
    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    checkActiveTask(task) {
        return this.activeTasks.includes(task);
    }

    clearTasks(forceStopSounds = false) {
        if (forceStopSounds) {
            this.app.soundManager.stopAllCustomSounds(true, true)
            this.app.soundManager.stopAllMusicSounds(true, true)
        }
        this.activeTasks = []
    }

    endExperience() {
        if (this.experienceEnded) return
        this.experienceEnded = true
        this.saveManager.clearProgress();

        this.app.endOverlay.classList.remove('hidden')
        void this.app.endOverlay.offsetWidth
        this.app.canvas.style.opacity = '0'

        setTimeout(() => {
            this.app.endOverlay.classList.add('visible')
        }, 100)
    }

    destroy() {
        window.removeEventListener('keydown', this.handleEndPanelEnter);
    }

    teleportPlayerTo(position, rotation = new THREE.Vector3(0, 0, 0)) {
        this.app.physicsManager.controls.getObject().position.x = position.x
        this.app.physicsManager.controls.getObject().position.y = position.y
        this.app.physicsManager.controls.getObject().position.z = position.z
        this.app.physicsManager.controls.getObject().rotation.x = rotation.x
        this.app.physicsManager.controls.getObject().rotation.y = rotation.y
        this.app.physicsManager.controls.getObject().rotation.z = rotation.z
        this.app.physicsManager.sphereBody.position.set(position.x, position.y, position.z);
        this.app.physicsManager.sphereBody.velocity.set(0, 0, 0);
    }

    createTurtlesBottom() {
        this.app.objectManager.add("Aquaturtle", new THREE.Vector3(0, 0, 0))
        this.app.objectManager.add("Elevator", new THREE.Vector3(0, 0, 0), {
            playAnimation: false,
            dynamicCollision: true,
        })
        this.app.objectManager.add("Tortue", new THREE.Vector3(0, 0, 0))
    }

    async initRoom(roomName) {
        switch (roomName) {
            case 'intro':
                this.activeTasks.push(roomName)
                break
            case 'aquarium':
                this.clearTasks(true)
                this.activeTasks.push(roomName)
                this.saveManager.saveProgress(roomName)
                this.app.doorManager.triggerCloseDoorByIndex(0)
                break
            case 'corridor':
                this.clearTasks()
                this.activeTasks.push(roomName)
                this.saveManager.saveProgress(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.doorManager.triggerCloseDoorByIndex(1)
                await this.sleep(2000)
                this.app.postProcessing.triggerGlitch()
                this.app.objectManager.remove("Dauphins")
                this.app.objectManager.removeBoids()
                break
            case 'aquaturtle':
                this.clearTasks()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.doorManager.triggerCloseDoorByIndex(2)
                await this.sleep(2000)
                this.app.postProcessing.triggerGlitch()
                this.app.objectManager.remove("Dauphins")
                this.app.objectManager.removeBoids()
                this.app.objectManager.remove("Couloir")
                break
            case 'boat':
                this.clearTasks()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.postProcessing.triggerGlitch()
                this.app.objectManager.remove("Dauphins")
                this.app.objectManager.removeBoids()
                this.app.objectManager.remove("Couloir")
                this.app.objectManager.remove("Aquaturtle")
                this.app.objectManager.remove("Elevator")
                this.app.objectManager.remove("Tortue")
                this.app.objectManager.remove("AquaturtleHaut")
            case 'end':
                this.clearTasks()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.postProcessing.triggerGlitch()
                this.app.objectManager.remove("Dauphins")
                this.app.objectManager.removeBoids()
                this.app.objectManager.remove("Couloir")
                this.app.objectManager.remove("Aquaturtle")
                this.app.objectManager.remove("Elevator")
                this.app.objectManager.remove("Tortue")
                this.app.objectManager.remove("AquaturtleHaut")
        }
    }

    updateEndPanelsCTA() {
        if (!this.endPanels) return;

        const playerPos = this.app.physicsManager.controls.getObject().position;
        let found = false;
        let closestIndex = null;
        let minDist = Infinity;

        // Cache tous les labels au début
        this.panelLabelMeshes.forEach(mesh => mesh.visible = false);

        this.endPanels.forEach((panel, idx) => {
            const panelPos = new THREE.Vector3();
            panel.mesh.getWorldPosition(panelPos);
            const dist = panelPos.distanceTo(playerPos);
            if (dist < 4.5 && dist < minDist) {
                found = true;
                closestIndex = idx;
                minDist = dist;
            }
        });

        if (found && closestIndex !== null) {
            this.panelLabelMeshes[closestIndex].visible = true;
            this.activePanelIndex = closestIndex;
        } else {
            this.activePanelIndex = null;
        }
    }

    handleEndPanelEnter = (e) => {
        if (e.key === "Enter" && this.activePanelIndex !== null) {
            const url = this.endPanels[this.activePanelIndex].url;
            window.open(url, "_blank");
        }
    }

    update() {
        if (this.activeTasks.includes('end') && this.endPanels) {
            this.updateEndPanelsCTA();
        }
    }
}
