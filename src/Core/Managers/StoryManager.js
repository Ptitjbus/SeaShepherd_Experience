import App from '../../App'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
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

        this.corridorRoomLoaded = false

        this.init()
    }

    init() {
        this.savedStep = this.saveManager.loadProgress()
        
        // NOUVEAU: Ajouter l'event listener pour les clics
        this.handleClickBound = this.handleClick.bind(this)
        document.addEventListener('click', this.handleClickBound)
        
        // NOUVEAU: Ajouter l'event listener pour les touches
        this.handleKeyDownBound = this.handleKeyDown.bind(this)
        document.addEventListener('keydown', this.handleKeyDownBound)
    }

    // NOUVEAU: Méthode pour gérer les clics
    handleClick(event) {
        // Vérifier qu'on est dans la phase end
        if (!this.activeTasks.includes('end')) return
        
        // NOUVEAU: Vérifier que le pointer lock est activé
        if (!document.pointerLockElement) return

        // Vérifier s'il y a un panel regardé (avec contour blanc)
        if (this.currentLookedPanel && this.currentLookedPanel.url) {
            window.open(this.currentLookedPanel.url, '_blank')
            return
        }

        // Vérifier s'il y a un bouton en hover
        if (this.endButtons) {
            const hoveredButton = this.endButtons.find(button => 
                button.material.map === button.hoverTexture
            )
            
            if (hoveredButton && hoveredButton.url) {
                window.open(hoveredButton.url, '_blank')
                return
            }
        }
    }

    // NOUVEAU: Méthode pour gérer les touches
    handleKeyDown(event) {
        // Vérifier qu'on est dans la phase end et qu'on a des panels
        if (!this.activeTasks.includes('end') || !this.endPanels) return
        
        // Gérer la touche Entrée pour les panels
        if (event.code === 'Enter' && this.currentLookedPanel) {
            console.log('Ouverture du panel:', this.currentLookedPanel.url) // Debug
            window.open(this.currentLookedPanel.url, '_blank')
            return
        }
        
        // NOUVEAU: Gérer la touche Entrée pour les boutons en hover
        if (event.code === 'Enter' && this.endButtons) {
            const hoveredButton = this.endButtons.find(button => 
                button.material.map === button.hoverTexture
            )
            
            if (hoveredButton && hoveredButton.url) {
                window.open(hoveredButton.url, '_blank')
                return
            }
        }
    }

    async startOrResume(room = null) {
        if (!this.savedStep && !room) {
            this.app.objectManager.add('Dauphins', new THREE.Vector3(0, 0, 0))
            this.app.objectManager.add('Dauphin', new THREE.Vector3(0, 0, 0))
            this.teleportPlayerTo(
                new THREE.Vector3(24, 1.3, 14),
                new THREE.Vector3(0, Math.PI, 0)
            )
            return
        }
        switch (room ? room : this.savedStep) {
            case 'aquarium':
                this.app.objectManager.add('Dauphins', new THREE.Vector3(0, 0, 0))
                this.app.objectManager.add('Dauphin', new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(
                    new THREE.Vector3(-14, 1.3, 0),
                    new THREE.Vector3(0, Math.PI / 2, 0)
                )
                break
            case 'corridor':
                this.app.objectManager.add('Couloir', new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(-51, 1.3, -35.55))
                this.app.soundManager.playMusic('corridor_ambiance')
                break
            case 'aquaturtle':
                this.createTurtlesBottom()
                this.teleportPlayerTo(
                    new THREE.Vector3(-72, 1.3, -121),
                    new THREE.Vector3(0, Math.PI / 2, 0)
                )
                break
            case 'boat':
                this.initBoat()
                break
            case 'end':
                this.initEnd()
                break
            default:
                this.app.objectManager.add('Dauphins', new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(
                    new THREE.Vector3(24, 1.3, 14),
                    new THREE.Vector3(0, Math.PI, 0)
                )
        }
    }

    async startExperience() {
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.activeTasks.push('intro')
        await this.sleep(2000)

        this.app.mediaManager.showRoomTitle('Accueil du musée')
        this.app.soundManager.playMusic('background_intro')

        if (!this.checkActiveTask('intro')) return
        setTimeout(() => {
            this.app.uiManager.showTutorial()
        }, 3000)
        await this.app.soundManager.playVoiceLine('1_INTRO')

        if (!this.checkActiveTask('intro')) return
        await this.app.uiManager
            .showChoices({
                title: "J'imagine que vous mourez  d'envie de savoir qui je suis ?",
                choice1: 'Dites moi',
                choice2: 'Non pas vraiment',
            })
            .then(async choiceIndex => {
                if (choiceIndex === 1) {
                    await this.app.soundManager.playVoiceLine('2.1_CHOIX1')
                } else {
                    await this.app.soundManager.playVoiceLine('2.2_CHOIX2')
                }
            })

        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('3.1_VOUSAVEZHATE')

        if (!this.checkActiveTask('intro')) return
        await this.app.uiManager
            .showChoices({
                title: 'Vous avez hâte, hein ....?',
                choice1: "Pour l'instant je suis pas convaincu …",
                choice2: 'Ouais carrément !',
            })
            .then(async choiceIndex => {
                if (choiceIndex === 1) {
                    await this.app.soundManager.playVoiceLine('3.2_CHOIX1')
                } else {
                    await this.app.soundManager.playVoiceLine('3.3_CHOIX2')
                }
            })

        if (!this.checkActiveTask('intro')) return
        await this.app.mediaManager.playMediaWithGlitch('connexion', 3)

        if (!this.checkActiveTask('intro')) return
        this.app.postProcessing.triggerGlitch()
        this.app.eventsManager.displayAlert('Nous vous montrerons ce que ce musée ne veut pas vous dévoiler.')

        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('4_CONNEXION')

        if (!this.checkActiveTask('intro')) return
        this.app.doorManager.triggerOpenDoorByIndex(0)
        this.activeTasks = this.activeTasks.filter(task => task !== 'intro')
    }

    async initAquarium() {
        await this.initRoom('aquarium')

        this.app.mediaManager.showRoomTitle('Aquarium des dauphins')

        this.app.soundManager.playMusic('aquarium')

        await this.sleep(2000)
        if (!this.checkActiveTask('aquarium')) return
        await this.app.soundManager.playVoiceLine('5.1_DAUPHINS')

        if (!this.checkActiveTask('aquarium')) return
        await this.app.uiManager
            .showChoices({
                title: "...",
                choice1: "Dites m'en plus je veux tout savoir !",
                choice2: 'Vous avez rien de plus intéressant ?',
            })
            .then(async choiceIndex => {
                if (choiceIndex === 1) {
                    await this.app.soundManager.playVoiceLine('5.2_CHOIX1')
                } else {
                    await this.app.soundManager.playVoiceLine('5.3_CHOIX2')
                }
            })

        if (!this.checkActiveTask('aquarium')) return
        await this.sleep(2000)

        this.app.objectManager.add('Couloir', new THREE.Vector3(0, 0, 0))

        await this.app.soundManager.playVoiceLine('5.4_FINDAUPHIN')

        this.app.doorManager.triggerOpenDoorByIndex(1)
        this.activeTasks = this.activeTasks.filter(task => task !== 'aquarium')
    }

    async initCorridor() {
        if (!this.corridorRoomLoaded) {
            await this.initRoom('corridor')
        }

        if (!this.checkActiveTask('corridor')) return
        await this.app.soundManager.playVoiceLine('6.1_PUB')

        if (!this.checkActiveTask('corridor')) return
        await this.app.uiManager
            .showChoices({
                title: "Lancer la publicité ?",
                choice1: 'Lancer la publicité',
                choice2: 'Ne pas supporter le musée',
            })
            .then(async choiceIndex => {
                if (choiceIndex === 2) {
                    await this.app.soundManager.playVoiceLine('6.2_VIDEO')
                }
            })

        const screenControls = this.app.objectManager.applyVideoToMultipleScreens(
            'Couloir',
            ['Screen_1', 'Screen_2', 'Screen_3', 'Screen_4', 'Screen_5'],
            'pub',
            'pub'
        )
        if (!this.checkActiveTask('corridor')) return
        await screenControls.turnOn()

        this.app.postProcessing.triggerGlitch()
        this.createTurtlesBottom()
        this.app.postProcessing.triggerGlitch()

        if (!this.checkActiveTask('corridor')) return
        await this.app.soundManager.playVoiceLine('6.3_NARRATEURINCOMPREHENSION')

        if (!this.checkActiveTask('corridor')) return
        await this.app.uiManager
            .showChoices({
                title: "On reprend la visite... ?",
                choice1: 'Oui, allons-y !',
                choice2: "J'ai l'impression qu'on ne me dit pas tout",
            })
            .then(async choiceIndex => {
                if (choiceIndex === 1) {
                    await this.app.soundManager.playVoiceLine('6.4_CHOIX1')
                } else {
                    this.app.eventsManager.displayAlert('Il ne vous dit pas tout en effet...')
                    await this.app.soundManager.playVoiceLine('6.5_CHOIX2')
                }
            })

        await this.app.doorManager.triggerOpenDoorByIndex(2)
    }

    async initTurtleBottom() {
        await this.initRoom('aquaturtle')

        this.app.soundManager.playMusic('aquaturtles')

        const aquaturtle = this.app.objectManager.get('Aquaturtle')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.soundManager.playVoiceLine('7.1_TORTUES')
        // this.app.eventsManager.displayAlert('Aussi lentes que leurs procédures de protection environnementale.')

        Promise.all(
            aquaturtle.animations.map(clip => {
                return new Promise(resolve => {
                    const action = aquaturtle.mixer.clipAction(clip)
                    action.reset()
                    action.setLoop(THREE.LoopOnce, 1)
                    action.clampWhenFinished = true
                    action.play()

                    aquaturtle.mixer.addEventListener('finished', function onFinish(e) {
                        if (e.action === action) {
                            aquaturtle.mixer.removeEventListener('finished', onFinish)
                            resolve()
                        }
                    })
                })
            })
        )

        this.app.objectManager.add('AquaturtleHaut', new THREE.Vector3(0, 0, 0))
        this.app.soundManager.attachToSpeakers()
    }

    async initElevator() {
        const elevator = this.app.objectManager.get('Elevator')

        const voicePromise = this.app.soundManager.playVoiceLine('7.2_TORTUES')

        const animationPromise = Promise.all(
            elevator.animations.map(clip => {
                return new Promise(resolve => {
                    const action = elevator.mixer.clipAction(clip)
                    action.reset()
                    action.setLoop(THREE.LoopOnce, 1)
                    action.clampWhenFinished = true
                    action.play()

                    setTimeout(() => {
                        const playerY = this.app.physicsManager.controls.getObject().position.y
                        if (playerY < 2) {
                            this.teleportPlayerTo(
                                new THREE.Vector3(-106, 8, -121),
                                new THREE.Vector3(0, Math.PI / 2, 0)
                            )
                        }
                    }, 6000)

                    setTimeout(() => {
                        const playerY = this.app.physicsManager.controls.getObject().position.y
                        if (playerY < 20) {
                            this.teleportPlayerTo(
                                new THREE.Vector3(-106, 30, -121),
                                new THREE.Vector3(0, Math.PI / 2, 0)
                            )
                        }
                    }, 15000)

                    elevator.mixer.addEventListener('finished', function onFinish(e) {
                        if (e.action === action) {
                            elevator.mixer.removeEventListener('finished', onFinish)
                            resolve()
                        }
                    })
                })
            })
        )

        await Promise.all([voicePromise, animationPromise])

        const playerY = this.app.physicsManager.controls.getObject().position.y
        if (playerY < 20) {
            this.teleportPlayerTo(
                new THREE.Vector3(-106, 48, -121),
                new THREE.Vector3(0, -Math.PI / 2, 0)
            )
        }

        this.app.objectManager.remove('Aquaturtle')
        this.app.objectManager.remove('Tortue')

        this.app.mediaManager.showRoomTitle('Tortues de Mayotte')
        if (!this.checkActiveTask('aquaturtle')) return
        await this.sleep(5000)

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.soundManager.stopAllMusicSounds(true, true)
        const glitchController = this.app.postProcessing.startRandomGlitches(1)
        setTimeout(async () => {
            await this.app.soundManager.playVoiceLine('7.3_VIDEO')
        }, 5000)
        await this.app.mediaManager.playMediaWithGlitch('turtle_1')
        
        if (!this.checkActiveTask('aquaturtle')) return
        this.app.soundManager.playVoiceLine('7.3.2_SEASHEPHERD')
        await this.app.mediaManager.playMediaWithGlitch('turtle_2')
        this.app.soundManager.playMusic('aquaturtles_creepy')
        await this.app.soundManager.playVoiceLine('7.4_VIDEO')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.uiManager
            .showChoices({
                title: "On reste là-dessus...",
                choice1: "C'est trop mignon les tortues !",
                choice2: 'Connaître la vérité',
            })
            .then(async choiceIndex => {
                await this.app.mediaManager.playMediaWithGlitch('turtle_3')
            })

            this.app.postProcessing.triggerBigGlitch()
            await this.app.soundManager.playVoiceLine('7.5_FAKENEWS')
            this.app.postProcessing.triggerBigGlitch()
            await this.app.soundManager.playVoiceLine('7.5.2_SEASHEPHERD')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.soundManager.playVoiceLine('7.6_INTOX')
        this.app.postProcessing.triggerBigGlitch()
        this.app.postProcessing.triggerBigGlitch()

        glitchController.stop()

        this.initBoat()
        this.initBoatRoom()
    }

    async initBoat() {
        await this.initRoom('boat')
    }

    async initBoatRoom() {
        const screenControls = this.app.objectManager.applyVideoToMultipleScreens(
            'BoatScene',
            ['Screen_bateau'],
            'boat_bg',  
        )
        screenControls.turnOn(true)
        await this.sleep(1000)

        this.app.soundManager.playMusic('boat')
        const glitchController = this.app.postProcessing.startRandomGlitches(0)

        setTimeout(() => {
            this.turnOnSpotsLights('paquebot')
        }, 25000)
        setTimeout(() => {
            this.turnOnSpotsLights('pyrogue')
        }, 32000)
        await this.app.soundManager.playVoiceLine('8.1_TELEPORTATION')

        await this.app.uiManager
            .showChoices({
                title: "4E65206C27E9636F757465207061732C20696C207465206D656E74",
                choice1: 'Encore des mensonges ?',
                choice2: 'Non dites moi ?!',
                disabledIndex: 1,
            })
            .then(async choiceIndex => {
                if (choiceIndex === 1) {
                    glitchController.setFrequencyLevel(1)
                    setTimeout(() => {
                        const buggyObject = this.app.objectManager.getItemFromObject(
                            'Paquebot001',
                            this.app.objectManager.get('BoatScene').object.scene
                        )
                        this.app.postProcessing.triggerBigGlitch()
                        buggyObject.position.y += 4
                        this.app.objectManager.makeObjectBuggy(buggyObject, {
                            positionJitter: 0.1,
                            rotationJitter: 0.05,
                            collisionJitter: 0.2,
                            updateFrequency: 2,
                        })
                        
                    }, 3000)
                    await this.app.soundManager.playVoiceLine('8.2_CHOIX1')
                }
            })

        const playVoiceLinePromise = new Promise(resolve => {
            setTimeout(async () => {
                await this.app.soundManager.playVoiceLine('8.3_PIRATAGE')
                resolve()
            }, 58000)
        })
        const playMusicPromise = new Promise(resolve => {
            setTimeout(async () => {
                const buggyObject = this.app.objectManager.getItemFromObject(
                    'Paquebot001',
                    this.app.objectManager.get('BoatScene').object.scene
                )
                this.app.postProcessing.triggerBigGlitch()
                buggyObject.position.y += 4
                this.app.objectManager.makeObjectBuggy(buggyObject, {
                    positionJitter: 0.1,
                    rotationJitter: 0.05,
                    collisionJitter: 0.2,
                    updateFrequency: 2,
                })
                resolve()
            }, 60000)
        })

        const playMediaPromise = new Promise(async (resolve) => {
            this.app.soundManager.playMusic('suspense')
            await this.app.mediaManager.playMediaWithGlitch('boat_1', 10)
            resolve()
        })

        await Promise.all([playVoiceLinePromise, playMediaPromise, playMusicPromise])

        const barque = this.app.objectManager.getItemFromObject(
            'Pirogue001',
            this.app.objectManager.get('BoatScene').object.scene
        )
        if (barque) {
            const tiltQuaternion = new THREE.Quaternion()
            this.app.postProcessing.triggerBigGlitch()
            this.app.postProcessing.triggerBigGlitch()
            tiltQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3) // 45 degrees around X axis
            barque.quaternion.multiply(tiltQuaternion)
            this.app.objectManager.makeObjectBuggy(barque, {
                positionJitter: 0.1,
                rotationJitter: 0.05,
                collisionJitter: 0.2,
                updateFrequency: 3,
            })
        }

        await this.app.soundManager.playVoiceLine('8.3.2_SEASHEPHERD')
        
        await this.app.mediaManager.playMediaWithGlitch('boat_2', 10)
        screenControls.turnOff()
        this.app.postProcessing.triggerBigGlitch()
        this.app.objectManager.waterUniformData.uColor2.value.set(0x4b0b0b)
        let spotsManager = this.startRandomSpotsEffect()
        await this.app.soundManager.playVoiceLine('8.4_LAFERME')

        setTimeout(() => {
            glitchController.setFrequencyLevel(3)
    
            this.app.objectManager.removeWithDisintegration('BoatScene', {
                duration: 5000,
                glitchIntensity: 1.0,
                enableFade: false,
                onComplete: () => {
                    glitchController.stop()
                    this.app.soundManager.stopAllMusicSounds(true, true, 5000)
                }
            })
        }, 100)

        
        await this.app.soundManager.playVoiceLine('8.7_DEFEAT')
        
        spotsManager.stop()

        this.initPreEnd()
    }

    async initPreEnd(){
        this.app.soundManager.removeAllSpeakers()
        this.app.soundManager.createSpeaker(new THREE.Vector3(4, 4, -4), 'SEASHEPHERD_1')
        this.app.soundManager.createSpeaker(new THREE.Vector3(4, 4, 4), 'SEASHEPHERD_4')
        this.app.soundManager.createSpeaker(new THREE.Vector3(-4, 4, -4), 'SEASHEPHERD_3')
        this.app.soundManager.createSpeaker(new THREE.Vector3(-4, 4, 4), 'SEASHEPHERD_4')
        this.app.physicsManager.freezePlayer()
        this.teleportPlayerTo( new THREE.Vector3(0, 0, 0))
        await this.sleep(5000)
        const narratorDot = this.app.objectManager.createNarratorDot(
            new THREE.Vector3(0, 3, -10),
            {
                baseRadius: 0.2,
                maxRadius: 0.4,
                sensitivity: 1.0,
                smoothing: 0.2,
                color: 0xffffff,
                glowing: true
            }
        )
        narratorDot.start()
        this.app.postProcessing.triggerGlitch()
        await this.app.soundManager.playVoiceLine('9.1_SEASHEPHERD')
        await this.sleep(1000)
        await this.app.soundManager.playVoiceLine('9.2_SEASHEPHERD')
        await this.app.mediaManager.playMedia('seashepherd_hope', 100)
        await this.app.soundManager.playVoiceLine('9.4_OUTRO')

        this.app.postProcessing.triggerBigGlitch()
        this.app.postProcessing.triggerBigGlitch()

        this.initEnd()
    }

    async initEnd() {
        this.clearTasks()

        this.saveManager.saveProgress('end')
        this.activeTasks.push('end')
        this.app.doorManager.removeDoorsFromScene()
        this.app.objectManager.removeAllEventTriggers()
        this.app.postProcessing.fisheyePass.enabled = false

        // Afficher l'image avec la classe 'end-cursor'
        const endCursorImage = document.createElement('img')
        endCursorImage.src = '/images/ui/cursor.svg' // Ajustez le chemin selon votre structure
        endCursorImage.className = 'end-cursor'
        endCursorImage.style.position = 'fixed'

        document.body.appendChild(endCursorImage)

        // Stocker la référence pour le nettoyage
        this.endCursorImage = endCursorImage

        // Désactiver le fisheye pass
        if (this.app.postProcessing && this.app.postProcessing.fisheyePass) {
            this.app.postProcessing.fisheyePass.enabled = false
        }

        // Désactiver les déplacements du joueur, garder seulement la rotation
        this.app.physicsManager.freezePlayer()

        // Initialiser le raycaster pour détecter les panels regardés
        this.raycaster = new THREE.Raycaster()
        this.currentLookedPanel = null
        this.currentLookedPanelIndex = null
        this.hideHintTimeout = null

        const endRoomPosition = new THREE.Vector3(50, 0, -50)

        // Ajouter le fog pour masquer la délimitation océan/skybox
        this.app.scene.fog = new THREE.Fog(0x00314B, 8, 50) // Fog plus proche : commence à 8 unités, complet à 50

        // Créer une skybox avec dégradé bleu océan
        const skyboxGeometry = new THREE.SphereGeometry(1000, 32, 32)
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x0A94C1, // Bleu océan foncé pour s'harmoniser
            side: THREE.BackSide,
            fog: false // La skybox ne doit pas être affectée par le fog
        })
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial)
        skybox.position.copy(endRoomPosition)
        this.app.scene.add(skybox)

        // Changer le background pour qu'il corresponde à la skybox
        this.app.scene.background = new THREE.Color(0x00314B) // Même couleur que la skybox

        this.app.ocean.show()
        this.app.ocean.water.position.y = -0.5

        this.app.scene.traverse(object => {
            if (object.isLight && !object.name.includes('videoPanel')) {
                object.intensity *= 0.3
            }
        })

        this.teleportPlayerTo( new THREE.Vector3(50, 0, -48))

        await this.sleep(500)

        const panelsContainer = new THREE.Object3D()
        panelsContainer.name = 'endPanelsContainer'
        panelsContainer.position.copy(endRoomPosition)
        this.app.scene.add(panelsContainer)

        const videos = [
            { id: 'fishing-video', src: '/videos/1080p/BOUCLE_CHALUT.mp4' },
            { id: 'dolphins-video', src: '/videos/1080p/BOUCLE_DAUPHIN.mp4' },
            { id: 'turtle-video', src: '/videos/1080p/BOUCLE_TORTUE.mp4' },
        ]

        const radius = 8
        const arcAngle = Math.PI * 0.5
        const panelWidth = 4
        const panelHeight = 5

        let panel1, panel2, panel3

        const loader = new THREE.TextureLoader()

        const titles = ['OceanKillers', 'DolphinByCatch', 'Braconnage à Mayotte']
        
        for (let i = 0; i < 3; i++) {
            const angle = -arcAngle / 2 + (i * arcAngle) / 2

            const x = radius * Math.sin(angle)
            const z = -radius * Math.cos(angle)

            const video = document.createElement('video')
            video.id = videos[i].id
            video.src = videos[i].src
            video.loop = true
            video.volume = 0.5
            video.playsInline = true
            video.autoplay = true

            const videoTexture = new THREE.VideoTexture(video)
            videoTexture.minFilter = THREE.LinearFilter
            videoTexture.magFilter = THREE.LinearFilter

            const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight)
            const panelMaterial = new THREE.MeshBasicMaterial({
                map: videoTexture,
                side: THREE.DoubleSide,
            })

            const panel = new THREE.Mesh(panelGeometry, panelMaterial)

            panel.position.set(x, panelHeight / 2, z)
            panel.rotation.y = Math.PI - angle
            panel.name = `videoPanel_${i}`

            panel.lookAt(0, panel.position.y, 0)

            panelsContainer.add(panel)

            // Ajouter la physique au panel
            const panelWorldPosition = new THREE.Vector3()
            panel.getWorldPosition(panelWorldPosition)
            
            // Créer un body physique pour le panel
            const panelShape = new CANNON.Box(new CANNON.Vec3(panelWidth / 2, panelHeight / 2, 0.1))
            const panelBody = new CANNON.Body({ 
                mass: 0, // Masse 0 = objet statique
                type: CANNON.Body.KINEMATIC
            })
            panelBody.addShape(panelShape)
            panelBody.position.set(panelWorldPosition.x, panelWorldPosition.y, panelWorldPosition.z)
            
            // Appliquer la même rotation que le panel
            const quaternion = new CANNON.Quaternion()
            quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), panel.rotation.y)
            panelBody.quaternion = quaternion
            
            // Ajouter le body au monde physique
            this.app.physicsManager.world.addBody(panelBody)
            
            // Stocker la référence pour le nettoyage
            panel.userData.physicsBody = panelBody

            video.play().catch(e => console.error('Erreur lors de la lecture vidéo:', e))

            const titleCanvas = document.createElement('canvas')
            titleCanvas.width = 1024
            titleCanvas.height = 256
            const titleCtx = titleCanvas.getContext('2d')
            titleCtx.fillStyle = 'white'
            titleCtx.font = '94px pf-videotext'
            titleCtx.textAlign = 'center'
            titleCtx.fillText(titles[i], titleCanvas.width / 2, titleCanvas.height / 2 + 20)

            const titleTexture = new THREE.CanvasTexture(titleCanvas)
            titleTexture.minFilter = THREE.LinearFilter

            const titleGeometry = new THREE.PlaneGeometry(4, 1)
            const titleMaterial = new THREE.MeshBasicMaterial({
                map: titleTexture,
                transparent: true,
                depthTest: false,
            })
            const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial)

            titleMesh.position.set(0, 3.25, 0.15)
            titleMesh.visible = true

            panel.add(titleMesh)

            if (!this.panelTitleMeshes) this.panelTitleMeshes = []
            this.panelTitleMeshes.push(titleMesh)

            if (i === 0) panel1 = panel
            if (i === 1) panel2 = panel
            if (i === 2) panel3 = panel
        }

        this.endPanels = [
            { mesh: panel1, url: 'https://www.youtube.com/watch?v=U5mrc8sFzVc' }, //cahlut
            { mesh: panel2, url: 'https://www.youtube.com/watch?v=9H9MWUN_T3Q' }, //dauphin
            { mesh: panel3, url: 'https://www.youtube.com/watch?v=EgpCkloASaQ' }, //tortue
        ]
        this.activePanelIndex = null

        // Créer les boutons 3D dans la scène AVANT showEndChoices
        this.createEnd3DButtons(endRoomPosition)

        await this.sleep(1000)
        if (!this.checkActiveTask('end')) return
        await this.app.soundManager.playVoiceLine('6_FINAL_EXHIBIT')
    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    checkActiveTask(task) {
        return this.activeTasks.includes(task)
    }

    clearTasks(forceStopSounds = false) {
        if (forceStopSounds) {
            this.app.soundManager.stopAllCustomSounds(true, true)
            this.app.soundManager.stopAllMusicSounds(true, true)
        }
        this.activeTasks = []
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
                this.app.objectManager.remove('Dauphins')
                this.app.objectManager.remove('Dauphin')
                this.app.objectManager.removeBoids()
                this.app.soundManager.playMusic('corridor_ambiance')
                this.corridorRoomLoaded = true
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
                this.app.objectManager.remove('Dauphins')
                this.app.objectManager.remove('Dauphin')
                this.app.objectManager.removeBoids()
                this.app.objectManager.remove('Couloir')
                break
            case 'boat':
                this.clearTasks()
                this.app.physicsManager.controls.speed = 0.5
                this.app.doorManager.removeDoorsFromScene()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.objectManager.add('BoatScene', new THREE.Vector3(0, 0, 0))
                this.initSpotsLights()
                this.turnOffScreens()
                this.app.environment.setBlackEnvironment()
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.objectManager.remove('Dauphins')
                this.app.objectManager.remove('Dauphin')
                this.app.objectManager.removeBoids()
                this.app.objectManager.remove('Couloir')
                this.app.objectManager.remove('Aquaturtle')
                this.app.objectManager.remove('Elevator')
                this.app.objectManager.remove('Tortue')
                this.app.objectManager.remove('AquaturtleHaut')
                this.app.objectManager.waterUniformData.uColor2.value.setHex(0x020222)
                this.app.objectManager.removeBoids()
                this.teleportPlayerTo(new THREE.Vector3(0, 3.5, 47), new THREE.Vector3(0, 0, 0))
                break
            case 'end':
                this.clearTasks()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.postProcessing.triggerGlitch()
                this.app.objectManager.remove('Dauphins')
                this.app.objectManager.remove('Dauphin')
                this.app.objectManager.removeBoids()
                this.app.objectManager.remove('Couloir')
                this.app.objectManager.remove('Aquaturtle')
                this.app.objectManager.remove('Elevator')
                this.app.objectManager.remove('Tortue')
                this.app.objectManager.remove('AquaturtleHaut')
        }
    }

    // Version de test simplifiée - à mettre temporairement
    updateEndPanelsCTA() {
        if (!this.endPanels) return

        const playerPos = this.app.physicsManager.controls.getObject().position
        
        // CORRIGÉ: Utiliser mainCamera au lieu de camera
        const camera = this.app.camera.mainCamera
        
        // Créer un point au centre de l'écran (coordonnées normalisées)
        const mouse = new THREE.Vector2(0, 0) // (0,0) = centre de l'écran

        // Configurer le raycaster depuis le centre de l'écran
        this.raycaster.setFromCamera(mouse, camera)
        
        // CORRIGÉ: Tester TOUS les objets interactifs en une seule fois
        const allInteractiveObjects = []
        
        // Ajouter les panels
        if (this.endPanels) {
            this.endPanels.forEach(panel => allInteractiveObjects.push(panel.mesh))
        }
        
        // Ajouter les boutons
        if (this.endButtons) {
            this.endButtons.forEach(button => allInteractiveObjects.push(button.mesh))
        }
        
        const intersects = this.raycaster.intersectObjects(allInteractiveObjects, false)
        
        // Supprimer tous les contours existants
        this.endPanels.forEach(panel => {
            if (panel.outlineMesh) {
                panel.mesh.remove(panel.outlineMesh)
                
                // Nettoyer tous les enfants du groupe (les LineSegments)
                if (panel.outlineMesh.children) {
                    panel.outlineMesh.children.forEach(child => {
                        if (child.geometry) child.geometry.dispose()
                        if (child.material) child.material.dispose()
                    })
                }
                
                panel.outlineMesh = null
            }
        })
        
        // Gestion du panneau regardé (contour blanc)
        let lookedPanel = null
        let lookedButton = null
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object
            
            // Vérifier si c'est un panel
            const intersectedPanel = this.endPanels.find(panel => panel.mesh === intersectedObject)
            if (intersectedPanel) {
                lookedPanel = intersectedPanel
                
                // Créer un contour avec des couches multiples pour l'épaisseur
                const outlineGeometry = new THREE.EdgesGeometry(intersectedPanel.mesh.geometry)
                
                // Créer un groupe pour contenir plusieurs contours
                const outlineGroup = new THREE.Group()
                
                // Créer plusieurs couches de contours pour l'épaisseur
                for (let i = 0; i < 3; i++) {
                    const outlineMaterial = new THREE.LineBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.8 - (i * 0.2) // Opacité décroissante pour l'effet
                    })
                    
                    const outlineMesh = new THREE.LineSegments(outlineGeometry, outlineMaterial)
                    const scale = 1.02 + (i * 0.005) // Échelles légèrement différentes
                    outlineMesh.scale.setScalar(scale)
                    outlineMesh.position.set(0, 0, 0.02 + (i * 0.001))
                    
                    outlineGroup.add(outlineMesh)
                }
                
                // Ajouter le groupe au panel regardé
                intersectedPanel.mesh.add(outlineGroup)
                intersectedPanel.outlineMesh = outlineGroup
            }
            
            // Vérifier si c'est un bouton
            const intersectedButton = this.endButtons.find(button => button.mesh === intersectedObject)
            if (intersectedButton) {
                lookedButton = intersectedButton
            }
        }
        
        this.currentLookedPanel = lookedPanel

        // Gestion des boutons - Réinitialiser tous les boutons puis mettre en surbrillance le bon
        if (this.endButtons) {
            this.endButtons.forEach(button => {
                // Sauvegarder la texture normale lors de la première utilisation
                if (!button.normalTexture) {
                    button.normalTexture = button.material.map
                }
                
                // Revenir à la texture normale pour tous les boutons
                if (button.material.map !== button.normalTexture) {
                    button.material.map = button.normalTexture
                    button.material.needsUpdate = true
                }
            })
            
            // Mettre en surbrillance le bouton regardé
            if (lookedButton && lookedButton.hoverTexture) {
                lookedButton.material.map = lookedButton.hoverTexture
                lookedButton.material.needsUpdate = true
            }
        }

        // Gestion de l'affichage du CTA quand on regarde un panel
        if (lookedPanel) {
            // Annuler le timeout de masquage si on regarde un panel
            if (this.hideHintTimeout) {
                clearTimeout(this.hideHintTimeout)
                this.hideHintTimeout = null
            }
            
            // Trouver l'index du panel regardé
            const lookedIndex = this.endPanels.findIndex(panel => panel === lookedPanel)
            if (lookedIndex !== -1) {
                // Si on change de panel, on met à jour immédiatement
                if (this.currentLookedPanelIndex !== lookedIndex) {
                    this.currentLookedPanelIndex = lookedIndex
                }
            }
        } else {
            // Quand on ne regarde plus de panel, masquer immédiatement
            if (this.currentLookedPanelIndex !== null) {
                this.currentLookedPanelIndex = null
                this.app.uiManager.hidePanelHint()
            }
        }

        // Gestion de la proximité (hint "Appuyez sur Entrée" - gardé pour la compatibilité)
        let found = false
        let closestIndex = null
        let minDist = Infinity

        this.endPanels.forEach((panel, idx) => {
            const panelPos = new THREE.Vector3()
            panel.mesh.getWorldPosition(panelPos)
            const dist = panelPos.distanceTo(playerPos)
            if (dist < 4.5 && dist < minDist) {
                found = true
                closestIndex = idx
                minDist = dist
            }
        })

        if (found && closestIndex !== null) {
            this.activePanelIndex = closestIndex
        } else {
            this.activePanelIndex = null
        }
    }

    // NOUVEAU: Méthode pour gérer les touches (sans les touches U et I)
    handleKeyDown(event) {
        // Vérifier qu'on est dans la phase end et qu'on a des panels
        if (!this.activeTasks.includes('end') || !this.endPanels) return
        
        // Gérer la touche Entrée pour les panels
        if (event.code === 'Enter' && this.currentLookedPanel) {
            window.open(this.currentLookedPanel.url, '_blank')
            return
        }
        
        // NOUVEAU: Gérer la touche Entrée pour les boutons en hover
        if (event.code === 'Enter' && this.endButtons) {
            const hoveredButton = this.endButtons.find(button => 
                button.material.map === button.hoverTexture
            )
            
            if (hoveredButton && hoveredButton.url) {
                window.open(hoveredButton.url, '_blank')
                return
            }
        }
    }

    destroy() {
        // NOUVEAU: Nettoyer l'event listener des clics
        if (this.handleClickBound) {
            document.removeEventListener('click', this.handleClickBound)
            this.handleClickBound = null
        }
        
        // NOUVEAU: Nettoyer l'event listener des touches
        if (this.handleKeyDownBound) {
            document.removeEventListener('keydown', this.handleKeyDownBound)
            this.handleKeyDownBound = null
        }
        
        // Nettoyer les visualisations de debug
        if (this.raycastVisualLine) {
            this.app.scene.remove(this.raycastVisualLine)
            this.raycastVisualLine.geometry.dispose()
            this.raycastVisualLine.material.dispose()
            this.raycastVisualLine = null
        }
        
        if (this.panelBoundingBoxHelpers) {
            this.panelBoundingBoxHelpers.forEach(helper => {
                this.app.scene.remove(helper)
            })
            this.panelBoundingBoxHelpers = null
        }
        
        // NOUVEAU: Nettoyer les helpers des boutons
        if (this.buttonBoundingBoxHelpers) {
            this.buttonBoundingBoxHelpers.forEach(helper => {
                this.app.scene.remove(helper)
            })
            this.buttonBoundingBoxHelpers = null
        }
        
        // Nettoyer l'image end-cursor
        if (this.endCursorImage) {
            document.body.removeChild(this.endCursorImage)
            this.endCursorImage = null
        }
        
        // Nettoyer le fog
        if (this.app.scene.fog) {
            this.app.scene.fog = null
        }
        
        // Nettoyer l'océan de fin
        if (this.endOcean && this.endOcean.water) {
            this.app.scene.remove(this.endOcean.water)
            if (this.endOcean.water.geometry) this.endOcean.water.geometry.dispose()
            if (this.endOcean.water.material) this.endOcean.water.material.dispose()
            this.endOcean = null
        }
        
        if (this.endOceanMesh) {
            this.app.scene.remove(this.endOceanMesh)
            if (this.endOceanMesh.geometry) this.endOceanMesh.geometry.dispose()
            if (this.endOceanMesh.material) this.endOceanMesh.material.dispose()
            this.endOceanMesh = null
        }
        
        // Nettoyer les contours
        if (this.endPanels) {
            this.endPanels.forEach(panel => {
                if (panel.outlineMesh) {
                    panel.mesh.remove(panel.outlineMesh)
                    // Nettoyer tous les enfants du groupe
                    if (panel.outlineMesh.children) {
                        panel.outlineMesh.children.forEach(child => {
                            if (child.geometry) child.geometry.dispose()
                            if (child.material) child.material.dispose()
                        })
                    }
                    panel.outlineMesh = null
                }
            })
        }
        
        // Nettoyer les références des sprites et labels
        this.panelLabelMeshes = null
        this.panelTitleMeshes = null
        this.currentLookedPanelIndex = null
        
        if (this.hideHintTimeout) {
            clearTimeout(this.hideHintTimeout)
            this.hideHintTimeout = null
        }
        
    }

    teleportPlayerTo(position, rotation = new THREE.Vector3(0, 0, 0)) {
        this.app.physicsManager.controls.getObject().position.x = position.x
        this.app.physicsManager.controls.getObject().position.y = position.y
        this.app.physicsManager.controls.getObject().position.z = position.z
        this.app.physicsManager.controls.getObject().rotation.x = rotation.x
        this.app.physicsManager.controls.getObject().rotation.y = rotation.y
        this.app.physicsManager.controls.getObject().rotation.z = rotation.z
        this.app.physicsManager.sphereBody.position.set(position.x, position.y, position.z)
        this.app.physicsManager.sphereBody.velocity.set(0, 0, 0)
    }

    createTurtlesBottom() {
        this.app.objectManager.add('Aquaturtle', new THREE.Vector3(0, 0, 0), {
            playAnimation: false,   
            dynamicCollision: true,
        })
        this.app.objectManager.add('Elevator', new THREE.Vector3(0, 0, 0), {
            playAnimation: false,
            dynamicCollision: true,
        })
        this.app.objectManager.add('Tortue', new THREE.Vector3(0, 0, 0))
    }

    initSpotsLights() {
        const boatRoom = this.app.objectManager.get('BoatScene')
        boatRoom.object.scene.traverse(object => {
            if (object.name.toLowerCase().includes('spot')) {
                object.visible = false
                object.intensity = 10
                object.decay = 0.0
                object.distance = 30
                this.app.soundManager.createSpeaker(object.position, object.name)
            }
        })
    }

    turnOffSpotsLights() {
        const boatRoom = this.app.objectManager.get('BoatScene')
        boatRoom.object.scene.traverse(object => {
            if (object.name.toLowerCase().includes('spot')) {
                object.visible = false
            }
        })
    }

    turnOnSpotsLights(name) {
        const boatRoom = this.app.objectManager.get('BoatScene')
        boatRoom.object.scene.traverse(object => {
            if (
                object.name.toLowerCase().includes('spot') &&
                object.name.toLowerCase().includes(name)
            ) {
                object.visible = true
                this.app.soundManager.playSpotSound(object.name)
            }
        })
    }

    turnOffScreens() {
        const boatRoom = this.app.objectManager.get('BoatScene')
        boatRoom.object.scene.traverse(object => {
            if (object.isMesh && object.material.name.toLowerCase().includes('screen')) {
                object.material.emissiveIntensity = 0.1
                // object.material.color = new THREE.Color(0x000000)
            }
        })
    }

    /**
     * Lance un effet de spots aléatoires qui s'allument et s'éteignent à des fréquences aléatoires.
     * @returns {Object} - Un objet avec une méthode stop() pour arrêter l'effet.
     */
    startRandomSpotsEffect() {
        const boatRoom = this.app.objectManager.get('BoatScene')
        if (!boatRoom || !boatRoom.object || !boatRoom.object.scene) {
            console.warn('BoatScene not loaded')
            return { stop: () => {} }
        }

        // Récupérer tous les spots
        const spots = []
        boatRoom.object.scene.traverse(object => {
            if (object.name && object.name.toLowerCase().includes('spot')) {
                spots.push(object)
            }
        })

        let stopped = false
        let timeoutId = null

        const randomizeSpots = () => {
            if (stopped) return

            // D'abord, éteindre tous les spots
            spots.forEach(spot => {
                spot.visible = false
            })

            // Choisir un nombre aléatoire de spots à allumer (au moins 1)
            const numToLight = Math.max(1, Math.floor(Math.random() * spots.length))
            // Mélanger les spots
            const shuffled = spots.slice().sort(() => Math.random() - 0.5)
            // Allumer les spots choisis
            for (let i = 0; i < numToLight; i++) {
                shuffled[i].visible = true
                // Optionnel : jouer le son du spot
                if (
                    this.app.soundManager &&
                    typeof this.app.soundManager.playSpotSound
                ) {
                    this.app.soundManager.playSpotSound(shuffled[i].name, 6)
                }
            }

            // Définir le prochain délai aléatoire (entre 300ms et 2000ms)
            const nextDelay = Math.random() * 300 + 50
            timeoutId = setTimeout(randomizeSpots, nextDelay)
        }

        // Démarrer la boucle
        randomizeSpots()

        // Retourner l'objet de contrôle
        return {
            stop: () => {
                stopped = true
                if (timeoutId) clearTimeout(timeoutId)
                // Optionnel : éteindre tous les spots à l'arrêt
                spots.forEach(spot => {
                    spot.visible = false
                })
            },
        }
    }

    update() {
        if (this.activeTasks.includes('end') && this.endPanels) {
            this.updateEndPanelsCTA()
        }
        
        // Mettre à jour l'océan si il existe
        if (this.endOcean && this.endOcean.water && this.endOcean.water.material.uniforms.time) {
            this.endOcean.water.material.uniforms.time.value += 0.01
        }
    }

    createEnd3DButtons(centerPosition) {
        const loader = new THREE.TextureLoader()
        
        // Créer un conteneur pour les boutons
        const buttonsContainer = new THREE.Object3D()
        buttonsContainer.name = 'endButtonsContainer'
        buttonsContainer.position.copy(centerPosition)
        this.app.scene.add(buttonsContainer)
        
        // Paramètres des boutons
        const buttonWidth = 5
        const buttonHeight = 1
        const buttonSeparation = 3
        
        // Positions des boutons (côte à côte avec espace)
        const button1Position = new THREE.Vector3(-buttonSeparation, 0, -5)
        const button2Position = new THREE.Vector3(buttonSeparation, 0, -5)
        
        // Charger la texture du bouton
        const buttonTexture = loader.load('/images/ui/btn_primary_end.svg')
        const buttonHoverTexture = loader.load('/images/ui/btn_primary_end_hover.svg')
        
        // Créer le premier bouton "Soutenir leur combat"
        const button1Geometry = new THREE.PlaneGeometry(buttonWidth, buttonHeight)
        const button1Material = new THREE.MeshBasicMaterial({
            map: buttonTexture,
            transparent: true,
            side: THREE.DoubleSide
        })
        
        const button1 = new THREE.Mesh(button1Geometry, button1Material)
        button1.position.copy(button1Position)
        button1.rotation.y = Math.PI * 0.1 // Légère rotation vers la droite
        button1.name = 'endButton1'
        
        // Créer le deuxième bouton "Rejoindre Sea Shepherd"
        const button2Geometry = new THREE.PlaneGeometry(buttonWidth, buttonHeight)
        const button2Material = new THREE.MeshBasicMaterial({
            map: buttonTexture,
            transparent: true,
            side: THREE.DoubleSide
        })
        
        const button2 = new THREE.Mesh(button2Geometry, button2Material)
        button2.position.copy(button2Position)
        button2.rotation.y = -Math.PI * 0.1 // Légère rotation vers la gauche
        button2.name = 'endButton2'
        
        // Ajouter seulement les textes sur les boutons (centrés)
        this.addTextToButton(button1, "SOUTENIR LEUR COMBAT")
        this.addTextToButton(button2, "REJOINDRE SEA SHEPHERD")
        
        buttonsContainer.add(button1)
        buttonsContainer.add(button2)
        
        // Stocker les références pour l'interaction
        this.endButtons = [
            { 
                mesh: button1, 
                url: 'https://www.helloasso.com/associations/sea-shepherd-france/formulaires/1',
                material: button1Material,
                hoverTexture: buttonHoverTexture,
                key: 'U'
            },
            { 
                mesh: button2, 
                url: 'https://seashepherd.fr/nous-rejoindre/',
                material: button2Material,
                hoverTexture: buttonHoverTexture,
                key: 'I'
            }
        ]
        
        // Ajouter les corps physiques pour l'interaction
        this.addPhysicsToButtons()
    }

    addTextToButton(buttonMesh, text) {
        // Créer un canvas pour le texte
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        
        // Style du texte
        ctx.fillStyle = 'white'
        ctx.font = 'bold 64px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Dessiner le texte
        ctx.fillText(text, canvas.width / 2, canvas.height / 2)
        
        // Créer la texture à partir du canvas
        const textTexture = new THREE.CanvasTexture(canvas)
        textTexture.minFilter = THREE.LinearFilter
        
        // Créer le mesh du texte
        const textGeometry = new THREE.PlaneGeometry(3.5, 0.7)
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            depthTest: false
        })
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        // MODIFIÉ: Centrer le texte dans le bouton
        textMesh.position.set(0, 0, 0.01) // Position centrée (0, 0, 0.01)

    buttonMesh.add(textMesh)
}

    addKeyHintToButton(buttonMesh, keyLetter, xOffset = -0.6) {
        // Créer un canvas pour la keyhint
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        
        // Dessiner le carré avec bordure
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(78, 78, 100, 100)
        
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 4
        ctx.strokeRect(78, 78, 100, 100)
        
        // Dessiner la lettre
        ctx.fillStyle = 'white'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(keyLetter, 128, 128)
        
        // Créer la texture à partir du canvas
        const keyTexture = new THREE.CanvasTexture(canvas)
        keyTexture.minFilter = THREE.LinearFilter
        
        // Créer le mesh de la keyhint - AUGMENTER LA TAILLE
        const keyGeometry = new THREE.PlaneGeometry(0.8, 0.8) // Augmenté de 0.6 à 0.8
        const keyMaterial = new THREE.MeshBasicMaterial({
            map: keyTexture,
            transparent: true,
            depthTest: false
        })
        
        const keyMesh = new THREE.Mesh(keyGeometry, keyMaterial)
        
        // Positionner la keyhint plus à gauche
        keyMesh.position.set(xOffset, 0, 0.02)

        buttonMesh.add(keyMesh)
    }

    addPhysicsToButtons() {
        this.endButtons.forEach(button => {
            const buttonWorldPosition = new THREE.Vector3()
            button.mesh.getWorldPosition(buttonWorldPosition)
            
            const buttonShape = new CANNON.Box(new CANNON.Vec3(4, 1, 0.1))
            const buttonBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
            buttonBody.addShape(buttonShape)
            buttonBody.position.set(buttonWorldPosition.x, buttonWorldPosition.y, buttonWorldPosition.z)
            
            // Appliquer la rotation
            const quaternion = new CANNON.Quaternion()
            quaternion.setFromEuler(button.mesh.rotation.x, button.mesh.rotation.y, button.mesh.rotation.z)
            buttonBody.quaternion = quaternion
            
            this.app.physicsManager.world.addBody(buttonBody)
            button.mesh.userData.physicsBody = buttonBody
        })
    }
}
