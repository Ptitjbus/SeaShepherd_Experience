import App from '../../App'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { SaveManager } from './SaveManager'

export default class StoryManager {
    constructor() {
        this.app = new App()
        this.experienceStarted = false
        this.experienceEnded = false
        this.corridorRoomLoaded = false

        this.activeTasks = []
        this.saveManager = new SaveManager()
        this.savedStep = null
        
        // End room properties
        this.endPanels = null
        this.endButtons = null
        this.activePanelIndex = null
        this.currentLookedPanel = null
        this.currentLookedPanelIndex = null
        this.hideHintTimeout = null
        this.raycaster = null

        this.init()
    }

    init() {
        this.savedStep = this.saveManager.loadProgress()
        
        this.handleClickBound = this.handleClick.bind(this)
        document.addEventListener('click', this.handleClickBound)
        
        this.handleKeyDownBound = this.handleKeyDown.bind(this)
        document.addEventListener('keydown', this.handleKeyDownBound)
    }

    // ===========================================
    // EVENT HANDLERS
    // ===========================================

    handleClick(event) {
        if (!this.activeTasks.includes('end')) return
        if (!document.pointerLockElement) return

        if (this.currentLookedPanel && this.currentLookedPanel.url) {
            window.open(this.currentLookedPanel.url, '_blank')
            return
        }

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

    handleKeyDown(event) {
        if (!this.activeTasks.includes('end') || !this.endPanels) return
        
        if (event.code === 'Enter' && this.currentLookedPanel) {
            window.open(this.currentLookedPanel.url, '_blank')
            return
        }
        
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

    // ===========================================
    // MAIN STORY FLOW
    // ===========================================

    async startOrResume(room = null) {
        const targetRoom = room || this.savedStep
        
        if (!targetRoom) {
            this.app.objectManager.add('Dauphins', new THREE.Vector3(0, 0, 0))
            this.app.objectManager.add('Dauphin', new THREE.Vector3(0, 0, 0))
            this.teleportPlayerTo(new THREE.Vector3(24, 1.3, 14), new THREE.Vector3(0, Math.PI, 0))
            return
        }

        switch (targetRoom) {
            case 'aquarium':
                this.app.objectManager.add('Dauphins', new THREE.Vector3(0, 0, 0))
                this.app.objectManager.add('Dauphin', new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(-14, 1.3, 0), new THREE.Vector3(0, Math.PI / 2, 0))
                break
            case 'corridor':
                this.app.objectManager.add('Couloir', new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(-51, 1.3, -35.55))
                this.app.soundManager.playMusic('corridor_ambiance')
                break
            case 'aquaturtle':
                this.createTurtlesBottom()
                this.teleportPlayerTo(new THREE.Vector3(-72, 1.3, -121), new THREE.Vector3(0, Math.PI / 2, 0))
                break
            case 'boat':
                this.initBoat()
                break
            case 'end':
                this.initEnd()
                break
            default:
                this.app.objectManager.add('Dauphins', new THREE.Vector3(0, 0, 0))
                this.teleportPlayerTo(new THREE.Vector3(24, 1.3, 14), new THREE.Vector3(0, Math.PI, 0))
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
        setTimeout(() => this.app.uiManager.showTutorial(), 3000)
        await this.app.soundManager.playVoiceLine('1_INTRO')

        if (!this.checkActiveTask('intro')) return
        await this.app.uiManager.showChoices({
            title: "J'imagine que vous mourez d'envie de savoir qui je suis ?",
            choice1: 'Dites moi',
            choice2: 'Non pas vraiment',
        }).then(async choiceIndex => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('2.1_CHOIX1')
            } else {
                await this.app.soundManager.playVoiceLine('2.2_CHOIX2')
            }
        })

        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('3.1_VOUSAVEZHATE')

        if (!this.checkActiveTask('intro')) return
        await this.app.uiManager.showChoices({
            title: 'Vous avez hâte, hein ....?',
            choice1: "Pour l'instant je suis pas convaincu …",
            choice2: 'Ouais carrément !',
        }).then(async choiceIndex => {
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

    // ===========================================
    // ROOM INITIALIZATIONS
    // ===========================================

    async initAquarium() {
        await this.initRoom('aquarium')
        this.app.mediaManager.showRoomTitle('Aquarium des dauphins')
        this.app.soundManager.playMusic('aquarium')

        await this.sleep(2000)
        if (!this.checkActiveTask('aquarium')) return
        await this.app.soundManager.playVoiceLine('5.1_DAUPHINS')

        if (!this.checkActiveTask('aquarium')) return
        await this.app.uiManager.showChoices({
            title: "...",
            choice1: "Dites m'en plus je veux tout savoir !",
            choice2: 'Vous avez rien de plus intéressant ?',
        }).then(async choiceIndex => {
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
        await this.app.uiManager.showChoices({
            title: "Lancer la publicité ?",
            choice1: 'Lancer la publicité',
            choice2: 'Ne pas supporter le musée',
        }).then(async choiceIndex => {
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
        await this.app.uiManager.showChoices({
            title: "On reprend la visite... ?",
            choice1: 'Oui, allons-y !',
            choice2: "J'ai l'impression qu'on ne me dit pas tout",
        }).then(async choiceIndex => {
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
                            this.teleportPlayerTo(new THREE.Vector3(-106, 8, -121), new THREE.Vector3(0, Math.PI / 2, 0))
                        }
                    }, 6000)

                    setTimeout(() => {
                        const playerY = this.app.physicsManager.controls.getObject().position.y
                        if (playerY < 20) {
                            this.teleportPlayerTo(new THREE.Vector3(-106, 30, -121), new THREE.Vector3(0, Math.PI / 2, 0))
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
            this.teleportPlayerTo(new THREE.Vector3(-106, 48, -121), new THREE.Vector3(0, -Math.PI / 2, 0))
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
        await this.app.uiManager.showChoices({
            title: "On reste là-dessus...",
            choice1: "C'est trop mignon les tortues !",
            choice2: 'Connaître la vérité',
        }).then(async choiceIndex => {
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
            'boat_bg'
        )
        screenControls.turnOn(true)
        await this.sleep(1000)

        this.app.soundManager.playMusic('boat')
        const glitchController = this.app.postProcessing.startRandomGlitches(0)

        setTimeout(() => this.turnOnSpotsLights('paquebot'), 25000)
        setTimeout(() => this.turnOnSpotsLights('pyrogue'), 32000)
        await this.app.soundManager.playVoiceLine('8.1_TELEPORTATION')

        await this.app.uiManager.showChoices({
            title: "4E65206C27E9636F757465207061732C20696C207465206D656E74",
            choice1: 'Encore des mensonges ?',
            choice2: 'Non dites moi ?!',
            disabledIndex: 1,
        }).then(async choiceIndex => {
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
            tiltQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3)
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

    async initPreEnd() {
        this.app.soundManager.removeAllSpeakers()
        this.app.soundManager.createSpeaker(new THREE.Vector3(4, 4, -4), 'SEASHEPHERD_1')
        this.app.soundManager.createSpeaker(new THREE.Vector3(4, 4, 4), 'SEASHEPHERD_4')
        this.app.soundManager.createSpeaker(new THREE.Vector3(-4, 4, -4), 'SEASHEPHERD_3')
        this.app.soundManager.createSpeaker(new THREE.Vector3(-4, 4, 4), 'SEASHEPHERD_4')
        this.app.physicsManager.freezePlayer()
        this.teleportPlayerTo(new THREE.Vector3(0, 0, 0))
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

        const endCursorImage = document.createElement('img')
        endCursorImage.src = '/images/ui/cursor.svg'
        endCursorImage.className = 'end-cursor'
        endCursorImage.style.position = 'fixed'
        document.body.appendChild(endCursorImage)
        this.endCursorImage = endCursorImage

        this.app.physicsManager.freezePlayer()
        this.raycaster = new THREE.Raycaster()
        this.currentLookedPanel = null
        this.currentLookedPanelIndex = null
        this.hideHintTimeout = null

        const endRoomPosition = new THREE.Vector3(50, 0, -50)

        this.app.scene.fog = new THREE.Fog(0x00314B, 8, 50)

        const skyboxGeometry = new THREE.SphereGeometry(1000, 32, 32)
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x0A94C1,
            side: THREE.BackSide,
            fog: false
        })
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial)
        skybox.position.copy(endRoomPosition)
        this.app.scene.add(skybox)

        this.app.scene.background = new THREE.Color(0x00314B)
        this.app.ocean.show()
        this.app.ocean.water.position.y = -0.5

        this.app.scene.traverse(object => {
            if (object.isLight && !object.name.includes('videoPanel')) {
                object.intensity *= 0.3
            }
        })

        this.teleportPlayerTo(new THREE.Vector3(50, 0, -48))
        await this.sleep(500)

        this.createVideosPanels(endRoomPosition)
        this.createEnd3DButtons(endRoomPosition)

        await this.sleep(1000)
        if (!this.checkActiveTask('end')) return
        await this.app.soundManager.playVoiceLine('6_FINAL_EXHIBIT')
    }

    // ===========================================
    // END ROOM SETUP
    // ===========================================

    createVideosPanels(centerPosition) {
        const panelsContainer = new THREE.Object3D()
        panelsContainer.name = 'endPanelsContainer'
        panelsContainer.position.copy(centerPosition)
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
        const titles = ['OceanKillers', 'DolphinByCatch', 'Braconnage à Mayotte']
        const urls = [
            'https://www.youtube.com/watch?v=U5mrc8sFzVc',
            'https://www.youtube.com/watch?v=9H9MWUN_T3Q',
            'https://www.youtube.com/watch?v=EgpCkloASaQ'
        ]

        const panels = []

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

            this.addPhysicsToPanel(panel, panelWidth, panelHeight)
            this.addPanelTitle(panel, titles[i])

            panelsContainer.add(panel)
            panels.push({ mesh: panel, url: urls[i] })

            video.play().catch(e => console.error('Erreur lors de la lecture vidéo:', e))
        }

        this.endPanels = panels
        this.activePanelIndex = null
    }

    addPhysicsToPanel(panel, width, height) {
        const panelWorldPosition = new THREE.Vector3()
        panel.getWorldPosition(panelWorldPosition)
        
        const panelShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, 0.1))
        const panelBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
        panelBody.addShape(panelShape)
        panelBody.position.set(panelWorldPosition.x, panelWorldPosition.y, panelWorldPosition.z)
        
        const quaternion = new CANNON.Quaternion()
        quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), panel.rotation.y)
        panelBody.quaternion = quaternion
        
        this.app.physicsManager.world.addBody(panelBody)
        panel.userData.physicsBody = panelBody
    }

    addPanelTitle(panel, title) {
        const titleCanvas = document.createElement('canvas')
        titleCanvas.width = 1024
        titleCanvas.height = 256
        const titleCtx = titleCanvas.getContext('2d')
        titleCtx.fillStyle = 'white'
        titleCtx.font = '94px pf-videotext'
        titleCtx.textAlign = 'center'
        titleCtx.fillText(title, titleCanvas.width / 2, titleCanvas.height / 2 + 20)

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
        panel.add(titleMesh)
    }

    createEnd3DButtons(centerPosition) {
        const loader = new THREE.TextureLoader()
        const buttonsContainer = new THREE.Object3D()
        buttonsContainer.name = 'endButtonsContainer'
        buttonsContainer.position.copy(centerPosition)
        this.app.scene.add(buttonsContainer)
        
        const buttonWidth = 5
        const buttonHeight = 1
        const buttonSeparation = 3
        
        const button1Position = new THREE.Vector3(-buttonSeparation, 0, -5)
        const button2Position = new THREE.Vector3(buttonSeparation, 0, -5)
        
        const buttonTexture = loader.load('/images/ui/btn_primary_end.svg')
        const buttonHoverTexture = loader.load('/images/ui/btn_primary_end_hover.svg')
        
        const button1 = this.createButton(buttonWidth, buttonHeight, button1Position, buttonTexture, "SOUTENIR LEUR COMBAT", Math.PI * 0.1)
        const button2 = this.createButton(buttonWidth, buttonHeight, button2Position, buttonTexture, "REJOINDRE SEA SHEPHERD", -Math.PI * 0.1)
        
        buttonsContainer.add(button1)
        buttonsContainer.add(button2)
        
        this.endButtons = [
            { 
                mesh: button1, 
                url: 'https://www.helloasso.com/associations/sea-shepherd-france/formulaires/1',
                material: button1.material,
                hoverTexture: buttonHoverTexture,
                key: 'U'
            },
            { 
                mesh: button2, 
                url: 'https://seashepherd.fr/nous-rejoindre/',
                material: button2.material,
                hoverTexture: buttonHoverTexture,
                key: 'I'
            }
        ]
        
        this.addPhysicsToButtons()
    }

    createButton(width, height, position, texture, text, rotation) {
        const buttonGeometry = new THREE.PlaneGeometry(width, height)
        const buttonMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        })
        
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial)
        button.position.copy(position)
        button.rotation.y = rotation
        
        this.addTextToButton(button, text)
        return button
    }

    addTextToButton(buttonMesh, text) {
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 256
        const ctx = canvas.getContext('2d')
        
        ctx.fillStyle = 'white'
        ctx.font = 'bold 64px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, canvas.width / 2, canvas.height / 2)
        
        const textTexture = new THREE.CanvasTexture(canvas)
        textTexture.minFilter = THREE.LinearFilter
        
        const textGeometry = new THREE.PlaneGeometry(3.5, 0.7)
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            depthTest: false
        })
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.position.set(0, 0, 0.01)
        buttonMesh.add(textMesh)
    }

    addPhysicsToButtons() {
        this.endButtons.forEach(button => {
            const buttonWorldPosition = new THREE.Vector3()
            button.mesh.getWorldPosition(buttonWorldPosition)
            
            const buttonShape = new CANNON.Box(new CANNON.Vec3(4, 1, 0.1))
            const buttonBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC })
            buttonBody.addShape(buttonShape)
            buttonBody.position.set(buttonWorldPosition.x, buttonWorldPosition.y, buttonWorldPosition.z)
            
            const quaternion = new CANNON.Quaternion()
            quaternion.setFromEuler(button.mesh.rotation.x, button.mesh.rotation.y, button.mesh.rotation.z)
            buttonBody.quaternion = quaternion
            
            this.app.physicsManager.world.addBody(buttonBody)
            button.mesh.userData.physicsBody = buttonBody
        })
    }

    // ===========================================
    // END ROOM INTERACTION SYSTEM
    // ===========================================

    updateEndPanelsCTA() {
        if (!this.endPanels) return

        const camera = this.app.camera.mainCamera
        const mouse = new THREE.Vector2(0, 0)
        this.raycaster.setFromCamera(mouse, camera)
        
        const allInteractiveObjects = []
        
        if (this.endPanels) {
            this.endPanels.forEach(panel => allInteractiveObjects.push(panel.mesh))
        }
        
        if (this.endButtons) {
            this.endButtons.forEach(button => allInteractiveObjects.push(button.mesh))
        }
        
        const intersects = this.raycaster.intersectObjects(allInteractiveObjects, false)
        
        this.clearPanelOutlines()
        
        let lookedPanel = null
        let lookedButton = null
        
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object
            
            const intersectedPanel = this.endPanels.find(panel => panel.mesh === intersectedObject)
            if (intersectedPanel) {
                lookedPanel = intersectedPanel
                this.addPanelOutline(intersectedPanel)
            }
            
            const intersectedButton = this.endButtons.find(button => button.mesh === intersectedObject)
            if (intersectedButton) {
                lookedButton = intersectedButton
            }
        }
        
        this.currentLookedPanel = lookedPanel
        this.updateButtonHoverStates(lookedButton)
        this.updatePanelHints(lookedPanel)
        this.updateProximityDetection()
    }

    clearPanelOutlines() {
        this.endPanels.forEach(panel => {
            if (panel.outlineMesh) {
                panel.mesh.remove(panel.outlineMesh)
                
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

    addPanelOutline(panel) {
        const outlineGeometry = new THREE.EdgesGeometry(panel.mesh.geometry)
        const outlineGroup = new THREE.Group()
        
        for (let i = 0; i < 3; i++) {
            const outlineMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8 - (i * 0.2)
            })
            
            const outlineMesh = new THREE.LineSegments(outlineGeometry, outlineMaterial)
            const scale = 1.02 + (i * 0.005)
            outlineMesh.scale.setScalar(scale)
            outlineMesh.position.set(0, 0, 0.02 + (i * 0.001))
            
            outlineGroup.add(outlineMesh)
        }
        
        panel.mesh.add(outlineGroup)
        panel.outlineMesh = outlineGroup
    }

    updateButtonHoverStates(lookedButton) {
        if (this.endButtons) {
            this.endButtons.forEach(button => {
                if (!button.normalTexture) {
                    button.normalTexture = button.material.map
                }
                
                if (button.material.map !== button.normalTexture) {
                    button.material.map = button.normalTexture
                    button.material.needsUpdate = true
                }
            })
            
            if (lookedButton && lookedButton.hoverTexture) {
                lookedButton.material.map = lookedButton.hoverTexture
                lookedButton.material.needsUpdate = true
            }
        }
    }

    updatePanelHints(lookedPanel) {
        if (lookedPanel) {
            if (this.hideHintTimeout) {
                clearTimeout(this.hideHintTimeout)
                this.hideHintTimeout = null
            }
            
            const lookedIndex = this.endPanels.findIndex(panel => panel === lookedPanel)
            if (lookedIndex !== -1) {
                if (this.currentLookedPanelIndex !== lookedIndex) {
                    this.currentLookedPanelIndex = lookedIndex
                }
            }
        } else {
            if (this.currentLookedPanelIndex !== null) {
                this.currentLookedPanelIndex = null
                this.app.uiManager.hidePanelHint()
            }
        }
    }

    updateProximityDetection() {
        const playerPos = this.app.physicsManager.controls.getObject().position
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

        this.activePanelIndex = found && closestIndex !== null ? closestIndex : null
    }

    // ===========================================
    // ROOM INITIALIZATION HELPERS
    // ===========================================

    async initRoom(roomName) {
        const roomConfigs = {
            intro: () => {
                this.activeTasks.push(roomName)
            },
            aquarium: () => {
                this.clearTasks(true)
                this.activeTasks.push(roomName)
                this.saveManager.saveProgress(roomName)
                this.app.doorManager.triggerCloseDoorByIndex(0)
            },
            corridor: async () => {
                this.clearTasks()
                this.activeTasks.push(roomName)
                this.saveManager.saveProgress(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.doorManager.triggerCloseDoorByIndex(1)
                await this.sleep(2000)
                this.app.postProcessing.triggerGlitch()
                this.removeCommonObjects()
                this.app.soundManager.playMusic('corridor_ambiance')
                this.corridorRoomLoaded = true
            },
            aquaturtle: async () => {
                this.clearTasks()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.doorManager.triggerCloseDoorByIndex(2)
                await this.sleep(2000)
                this.app.postProcessing.triggerGlitch()
                this.removeCommonObjects()
                this.app.objectManager.remove('Couloir')
            },
            boat: () => {
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
                this.removeAllObjects()
                this.app.objectManager.waterUniformData.uColor2.value.setHex(0x020222)
                this.teleportPlayerTo(new THREE.Vector3(0, 3.5, 47), new THREE.Vector3(0, 0, 0))
            },
            end: () => {
                this.clearTasks()
                this.saveManager.saveProgress(roomName)
                this.activeTasks.push(roomName)
                this.app.soundManager.attachToSpeakers()
                this.app.soundManager.stopAllMusicSounds(true, false)
                this.app.postProcessing.triggerGlitch()
                this.removeAllObjects()
            }
        }

        const config = roomConfigs[roomName]
        if (config) {
            await config()
        }
    }

    removeCommonObjects() {
        const objectsToRemove = ['Dauphins', 'Dauphin']
        objectsToRemove.forEach(obj => this.app.objectManager.remove(obj))
        this.app.objectManager.removeBoids()
    }

    removeAllObjects() {
        const objectsToRemove = ['Dauphins', 'Dauphin', 'Couloir', 'Aquaturtle', 'Elevator', 'Tortue', 'AquaturtleHaut']
        objectsToRemove.forEach(obj => this.app.objectManager.remove(obj))
        this.app.objectManager.removeBoids()
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

    // ===========================================
    // LIGHTING AND EFFECTS
    // ===========================================

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
            }
        })
    }

    startRandomSpotsEffect() {
        const boatRoom = this.app.objectManager.get('BoatScene')
        if (!boatRoom || !boatRoom.object || !boatRoom.object.scene) {
            return { stop: () => {} }
        }

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

            spots.forEach(spot => spot.visible = false)

            const numToLight = Math.max(1, Math.floor(Math.random() * spots.length))
            const shuffled = spots.slice().sort(() => Math.random() - 0.5)
            
            for (let i = 0; i < numToLight; i++) {
                shuffled[i].visible = true
                if (this.app.soundManager && typeof this.app.soundManager.playSpotSound === 'function') {
                    this.app.soundManager.playSpotSound(shuffled[i].name, 6)
                }
            }

            const nextDelay = Math.random() * 300 + 50
            timeoutId = setTimeout(randomizeSpots, nextDelay)
        }

        randomizeSpots()

        return {
            stop: () => {
                stopped = true
                if (timeoutId) clearTimeout(timeoutId)
                spots.forEach(spot => spot.visible = false)
            },
        }
    }

    // ===========================================
    // UTILITIES
    // ===========================================

    update() {
        if (this.activeTasks.includes('end') && this.endPanels) {
            this.updateEndPanelsCTA()
        }
        
        if (this.endOcean && this.endOcean.water && this.endOcean.water.material.uniforms.time) {
            this.endOcean.water.material.uniforms.time.value += 0.01
        }
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

    teleportPlayerTo(position, rotation = new THREE.Vector3(0, 0, 0)) {
        const controlsObject = this.app.physicsManager.controls.getObject()
        controlsObject.position.copy(position)
        controlsObject.rotation.set(rotation.x, rotation.y, rotation.z)
        this.app.physicsManager.sphereBody.position.set(position.x, position.y, position.z)
        this.app.physicsManager.sphereBody.velocity.set(0, 0, 0)
    }

    destroy() {
        if (this.handleClickBound) {
            document.removeEventListener('click', this.handleClickBound)
            this.handleClickBound = null
        }
        
        if (this.handleKeyDownBound) {
            document.removeEventListener('keydown', this.handleKeyDownBound)
            this.handleKeyDownBound = null
        }
        
        if (this.endCursorImage) {
            document.body.removeChild(this.endCursorImage)
            this.endCursorImage = null
        }
        
        if (this.app.scene.fog) {
            this.app.scene.fog = null
        }
        
        if (this.endOcean && this.endOcean.water) {
            this.app.scene.remove(this.endOcean.water)
            if (this.endOcean.water.geometry) this.endOcean.water.geometry.dispose()
            if (this.endOcean.water.material) this.endOcean.water.material.dispose()
            this.endOcean = null
        }
        
        if (this.endPanels) {
            this.endPanels.forEach(panel => {
                if (panel.outlineMesh) {
                    panel.mesh.remove(panel.outlineMesh)
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
        
        if (this.hideHintTimeout) {
            clearTimeout(this.hideHintTimeout)
            this.hideHintTimeout = null
        }
    }
}
