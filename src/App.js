import { Scene, MeshStandardMaterial, Color, Vector3, NoToneMapping } from 'three'
import ObjectManager from './Core/Managers/ObjectManager.js'
import AssetManager from './Assets/AssetManager.js'
import PostProcessingManager from './Core/Managers/PostProcessingManager.js'
import EventEmitter from './Utils/EventEmitter'
import CanvasSize from './Core/CanvasSize'
import Camera from './Core/Camera'
import Renderer from './Core/Renderer'
import { AnimationLoop } from './Core/AnimationLoop'
import Debug from './Utils/Debug'
import Ocean from './World/Ocean.js'
import EventsManager from './Core/Managers/EventsManager'
import SoundManager from './Core/Managers/SoundManager.js'
import MediaManager from './Core/Managers/MediaManager.js'
import CustomEnvironment from './World/CustomEnvironment.js'
import { UiManager } from './Core/Managers/UIManager.js'
import DoorManager from './Core/Managers/DoorManager.js'
import PhysicsManager from './Core/Managers/PhysicsManager.js'
import StoryManager from './Core/Managers/StoryManager.js'
import PaintingManager from './Core/Managers/PaintingManager.js'

let myAppInstance = null

const goldMaterial = new MeshStandardMaterial({
    color: new Color(0x1200ff), // doré
    metalness: 1,
    roughness: 0.2,
})

export default class App extends EventEmitter {
    constructor(canvas) {
        if (myAppInstance !== null) {
            return myAppInstance
        }

        super()

        myAppInstance = this

        this.canvas = canvas
        this.canvasSize = new CanvasSize(canvas)

        this.updateBound = null
        this.assetsLoadCompleteHandlerBound = null

        this.animationLoop = null

        this.scene = null
        this.camera = null
        this.renderer = null
        this.sky = null

        this.debug = null

        this.assetManager = null

        this.isSceneReady = false

        this.postProcessing = null
        this.enablePostProcessing = true

        this.startOverlay = null
        this.startButton = null
        this.endOverlay = null
        this.experienceStarted = false
        this.experienceEnded = false

        this.popins = {}
        this.eventsManager = null

        this.soundManager = null
        this.mediaManager = null

        this.uiManager = null
        this.paintingManager = null

        this.doorManager = null

        this.physicsManager = null

        this.storyManager = null
    
        this.init()
    }

    init() {
        this.renderer = new Renderer()
        this.camera = new Camera()
        this.scene = new Scene()
        this.debug = new Debug()
        this.physicsManager = new PhysicsManager()
        this.soundManager = new SoundManager()

        this.animationLoop = new AnimationLoop()
        this.updateBound = this.update.bind(this)
        this.animationLoop.on('update', this.updateBound)

        this.assetManager = new AssetManager()
        this.assetsLoadCompleteHandlerBound = this.assetsLoadCompleteHandler.bind(this)
        this.assetManager.on('ready', this.assetsLoadCompleteHandlerBound)
        this.assetManager.load()

        this.eventsManager = new EventsManager()

        this.mediaManager = new MediaManager()
        this.mediaManager.init(this.scene)

        this.uiManager = new UiManager()
        this.storyManager = new StoryManager()
        this.initMedias()

        this.setupUI()

        window.appInstance = this
    }

    async initMedias() {
        await this.preloadMedias()
    }

    async assetsLoadCompleteHandler() {
        this.initScene()
        this.postProcessing = new PostProcessingManager(
            this.renderer.instance,
            this.scene,
            this.camera.mainCamera
        )
        this.mediaManager.init(this.scene)
        this.mediaManager.connectToPostProcessingManager(this.postProcessing)
        this.animationLoop.start()
        this.debug.init()
        this.debug.showAnimationClipLine(this.assetManager.getItem('Dauphins'))
        
        // Initialiser les volumes sauvegardés
        this.loadSavedVolumeSettings()
        
        await this.storyManager.startOrResume()
        this.isSceneReady = true
        this.assetManager.showMainScreen()

        this.paintingManager = new PaintingManager()
        this.setupPaintings()
    }

    initScene() {
        this.environment = new CustomEnvironment()
        this.ocean = new Ocean(this.scene, this.renderer.instance)
        this.ocean.hide()
        this.objectManager = new ObjectManager()

        this.objectManager.addBoids(15, 10, new Vector3(26, 4, 31))
        this.objectManager.addBoids(5, 7, new Vector3(31, 2, 24))
        this.objectManager.addBoids(3, 10, new Vector3(25, 2, 30))

        this.objectManager.addBoids(50, 15, new Vector3(-51, 1.5, 18))
        this.objectManager.addBoids(20, 10, new Vector3(-77, 1.5, -25))
        this.objectManager.addBoids(10, 5, new Vector3(-37, 1.5, -8))
        this.objectManager.addBoids(20, 10, new Vector3(-30, 1.5, -30))
        this.objectManager.addBoids(20, 10, new Vector3(-30, 1.5, 25))
        this.objectManager.addBoids(30, 15, new Vector3(-80, 1.5, 18))
        this.objectManager.addBoids(30, 15, new Vector3(-30, 6, 0))
        this.objectManager.addBoids(30, 15, new Vector3(-70, 5, -5))
        this.objectManager.addBoids(2, 6, new Vector3(-12, 1.5, -12))

        this.doorManager = new DoorManager(this.scene)

        // Porte 1
        this.doorManager.addDoorPair(new Vector3(-8.01, 0, 0.05), 2.3, 5)
        this.doorManager.doorPairs[0].setRotation(Math.PI / 2)

        // Porte 2
        this.doorManager.addDoorPair(new Vector3(-50.86, 0, -30.41), 2.3, 5)
        this.doorManager.doorPairs[1].setRotation((0.42 * Math.PI) / 180)

        // Porte 3
        this.doorManager.addDoorPair(new Vector3(-68.2, 0, -120.8), 2.4, 5)
        this.doorManager.doorPairs[2].setRotation(Math.PI / 2)

        this.objectManager.addEventTrigger(new Vector3(-40, 1, -5), 40, 7, 20, () => {
            this.storyManager.initAquarium()
        })

        this.objectManager.addEventTrigger(new Vector3(-50, 1, -53), 20, 10, 30, () => {
            this.storyManager.initCorridor()
        })

        this.objectManager.addEventTrigger(new Vector3(-80, 1, -120), 15, 7, 20, () => {
            this.storyManager.initTurtleBottom()
        })

        this.objectManager.addEventTrigger(new Vector3(-108, 1, -121), 10, 7, 10, () => {
            this.storyManager.initElevator()
        })
    }

    async initMadias() {
        await this.preloadMedias()
    }

    launchExperience() {
        this.startOverlay.classList.add('hidden')
        setTimeout(() => {
            this.startOverlay.style.display = 'none'
        }, 1500)
        this.canvas.style.opacity = '1'

        this.soundManager.attachToSpeakers()

        if (!this.storyManager.savedStep || this.storyManager.savedStep === 'intro') {
            this.storyManager.startExperience()
        }

        if (this.storyManager.savedStep === 'boat') {
            this.storyManager.initBoatRoom()
        }

        if (this.storyManager.savedStep === 'corridor') {
            this.storyManager.initRoom('corridor')
        }

        this.startButton.style.display = 'none'

        this.physicsManager.controls.lock()
    }

    setupUI() {
        this.startButton = document.getElementById('start-experience-btn')
        const creditsBtn = document.getElementById('credits-btn')
        const backBtn = document.getElementById('back-btn')
        this.startOverlay = document.querySelector('.start-overlay')
        const creditsOverlay = document.getElementById('credits-overlay')

        if (this.startButton) {
            this.startButton.addEventListener('click', async e => {
                e.preventDefault()

                this.launchExperience()
            })

            // Si on appuye sur la touche 'Enter'
            document.addEventListener('keydown', async e => {
                e.preventDefault()
                if (e.key === 'Enter') {
                    if (this.storyManager.experienceStarted) {
                        this.startButton.classList.add('choosed')
                    }else{
                        this.launchExperience()
                    }

                }
            })
        }

        // Gestionnaire pour le bouton crédits
        if (creditsBtn) {
            creditsBtn.addEventListener('click', () => {
                this.startOverlay.style.opacity = '0'
                creditsOverlay.classList.remove('hidden')
            })
        }

        // Gestionnaire pour le bouton retour
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                creditsOverlay.classList.add('hidden')
                this.startOverlay.style.opacity = '1'
            })
        }

        // Gestionnaire pour le bouton options
        const optionsBtn = document.querySelectorAll('.footer-btn-right')[1] // Le deuxième bouton (options)
        const backOptionsBtn = document.getElementById('back-options-btn')
        const optionsOverlay = document.getElementById('options-overlay')

        if (optionsBtn) {
            optionsBtn.addEventListener('click', () => {
                this.startOverlay.style.opacity = '0'
                creditsOverlay.classList.add('hidden')
                optionsOverlay.classList.remove('hidden')
                
                // Synchroniser les sliders avec les valeurs actuelles
                this.syncVolumeSliders()
            })
        }

        if (backOptionsBtn) {
            backOptionsBtn.addEventListener('click', () => {
                this.hideOptionsMenu()
            })
        }

        // Gestion des sliders de volume
        const musicSlider = document.getElementById('music-volume')
        const sfxSlider = document.getElementById('sfx-volume')

        if (musicSlider) {
            musicSlider.addEventListener('input', e => {
                const value = parseInt(e.target.value)
                e.target.nextElementSibling.textContent = `${value}%`
                
                // Mettre à jour le volume de la musique
                if (this.soundManager) {
                    this.soundManager.setMasterMusicVolume(value / 100)
                }
                
                // Sauvegarder dans localStorage
                localStorage.setItem('musicVolume', value)
            })
            
            // Charger la valeur sauvegardée ou utiliser la valeur par défaut
            const savedMusicVolume = localStorage.getItem('musicVolume') || '50'
            musicSlider.value = savedMusicVolume
            musicSlider.nextElementSibling.textContent = `${savedMusicVolume}%`
        }

        if (sfxSlider) {
            sfxSlider.addEventListener('input', e => {
                const value = parseInt(e.target.value)
                e.target.nextElementSibling.textContent = `${value}%`
                
                // Mettre à jour le volume des effets sonores
                if (this.soundManager) {
                    this.soundManager.setMasterSfxVolume(value / 100)
                }
                
                // Sauvegarder dans localStorage
                localStorage.setItem('sfxVolume', value)
            })
            
            // Charger la valeur sauvegardée ou utiliser la valeur par défaut
            const savedSfxVolume = localStorage.getItem('sfxVolume') || '70'
            sfxSlider.value = savedSfxVolume
            sfxSlider.nextElementSibling.textContent = `${savedSfxVolume}%`
        }

        const switchContainer = document.querySelector('.switch-container')
        const switchOptions = document.querySelectorAll('.switch-option')

        if (switchContainer && switchOptions.length > 0) {
            switchContainer.setAttribute('data-active', 'false')

            switchOptions.forEach(option => {
                option.addEventListener('click', () => {
                    switchOptions.forEach(opt => opt.classList.remove('active'))

                    option.classList.add('active')

                    const value = option.getAttribute('data-value')
                    switchContainer.setAttribute('data-active', value)

                    const isPerformanceMode = value === 'true'

                    // Mettre à jour la propriété enablePostProcessing
                    this.enablePostProcessing = !isPerformanceMode

                    if (isPerformanceMode) {
                        if (this.objectManager) {
                            this.objectManager.removeBoids()
                        }
                    } else {
                        if (this.objectManager) {
                            this.recreateBoids()
                        }
                    }
                })
            })
        }

       let menuJustClosed = false


        document.addEventListener('pointerlockchange', () => {
            if (!document.pointerLockElement) {
                if (menuJustClosed) {
                    menuJustClosed = false
                    return
                }

                // const optionsOverlay = document.getElementById('options-overlay')
                
                // if (!optionsOverlay.classList.contains('hidden')) {
                //     return
                // }
                
                // if (this.isSceneReady && this.startOverlay.classList.contains('hidden')) {
                //     this.showOptionsFromGame()
                // }
            }
        })

        document.addEventListener('keydown', (e) => {
            e.preventDefault()
            if (e.key === 'Escape') {
                const optionsOverlay = document.getElementById('options-overlay')
                
                if (!optionsOverlay.classList.contains('hidden')) {
                    menuJustClosed = true
                    this.hideOptionsMenu()

                    const isInGame = this.isSceneReady && this.startOverlay.classList.contains('hidden')
                    if (isInGame && this.physicsManager && this.physicsManager.controls) {
                        setTimeout(() => {
                            this.physicsManager.controls.lock()
                        }, 100)
                    }
                }
            }
        })
    }

    /**
     * Synchronise les sliders avec les valeurs actuelles du SoundManager
     */
    syncVolumeSliders() {
        if (!this.soundManager) return

        const musicSlider = document.getElementById('music-volume')
        const sfxSlider = document.getElementById('sfx-volume')

        if (musicSlider) {
            const currentMusicVolume = Math.round(this.soundManager.getMasterMusicVolume() * 100)
            musicSlider.value = currentMusicVolume
            musicSlider.nextElementSibling.textContent = `${currentMusicVolume}%`
        }

        if (sfxSlider) {
            const currentSfxVolume = Math.round(this.soundManager.getMasterSfxVolume() * 100)
            sfxSlider.value = currentSfxVolume
            sfxSlider.nextElementSibling.textContent = `${currentSfxVolume}%`
        }
    }

    showOptionsFromGame() {
        const optionsOverlay = document.getElementById('options-overlay')
        
        // Désactiver temporairement la gestion d'Escape par les contrôles
        if (this.physicsManager && this.physicsManager.controls) {
            this.physicsManager.controls.unlock()
        }
        
        // Afficher le menu options
        optionsOverlay.classList.remove('hidden')
    }

    hideOptionsMenu() {
        const optionsOverlay = document.getElementById('options-overlay')
        
        // Vérifier si on est en jeu ou sur l'écran d'accueil
        const isInGame = this.isSceneReady && this.startOverlay.classList.contains('hidden')
        
        if (isInGame) {
            // Retour au jeu : masquer le menu et reverrouiller les contrôles
            optionsOverlay.classList.add('hidden')
            
            // Reverrouiller les contrôles après un petit délai pour éviter les conflits
            setTimeout(() => {
                if (this.physicsManager && this.physicsManager.controls) {
                    this.physicsManager.controls.lock()
                }
            }, 100)
        } else {
            // Retour à l'écran d'accueil
            optionsOverlay.classList.add('hidden')
            this.startOverlay.style.opacity = '1'
        }
    }

    update(time) {
        this.objectManager.update(time)
        if (this.mediaManager) this.mediaManager.update(this.camera.mainCamera)
        if (this.soundManager) this.soundManager.updateListener()
        if (this.physicsManager) this.physicsManager.update(time.delta)
        if (this.doorManager) this.doorManager.update()
        if (this.ocean) this.ocean.update(time.delta)
        
        // MODIFIÉ: Vérifier que paintingManager existe toujours
        if (this.paintingManager && this.physicsManager && this.physicsManager.controls) {
            this.paintingManager.update(this.physicsManager.controls.getObject().position)
        }

        this.renderer.instance.setRenderTarget(this.renderer.renderTarget)
        this.renderer.instance.render(this.scene, this.camera.mainCamera)

        if (
            this.objectManager.transmissionMeshes.length > 0 &&
            this.objectManager.meshTransmissionMaterial.buffer ===
                this.objectManager.fboMain.texture
        ) {
            this.renderer.instance.toneMapping = NoToneMapping
            this.renderer.instance.setRenderTarget(this.objectManager.fboMain)
            this.renderer.instance.render(this.scene, this.camera.mainCamera)
        }

        this.debug.update()
        
        // Gérer le rendu selon l'état du post-processing
        if (this.enablePostProcessing && this.postProcessing) {
            this.postProcessing.render(this.camera.mainCamera)
        } else {
            this.renderer.instance.setRenderTarget(null)
            this.renderer.instance.render(this.scene, this.camera.mainCamera)
        }

        if (this.storyManager) this.storyManager.update()
    }

    destroy() {
        if (this.startButton) {
            this.startButton.removeEventListener('click', this.storyManager.startExperience)
        }

        if (this.eventsManager) {
            this.eventsManager.destroy()
            this.eventsManager = null
        }

        this.scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose()
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        material.dispose()
                    })
                } else {
                    object.material.dispose()
                }
            }
        })

        this.postProcessing = null

        this.camera.destroy()
        this.camera = null

        this.renderer.destroy()
        this.renderer = null

        this.scene = null

        if (this.sky) {
            this.sky.destroy()
            this.sky = null
        }

        this.ocean.destroy()
        this.ocean = null
        this.objectManager.destroy()
        this.objectManager = null
        this.debug.destroy()
        this.debug = null

        if (this.soundManager) {
            this.soundManager.destroy()
            this.soundManager = null
        }

        this.animationLoop.off('update')
        this.animationLoop = null
        this.updateBound = null

        this.assetManager.off('ready')
        this.assetsLoadCompleteHandlerBound = null
        this.assetManager.destroy()
        this.assetManager = null

        this.startOverlay = null
        this.startButton = null
        this.endOverlay = null

        this.canvas = null

        if (this.mediaManager) {
            this.mediaManager.destroy()
            this.mediaManager = null
        }

        if (this.uiManager) {
            this.uiManager.destroy()
            this.uiManager = null
        }

        if (this.storyManager) {
            // Ajoutez une méthode destroy au StoryManager si nécessaire
            if (typeof this.storyManager.destroy === 'function') {
                this.storyManager.destroy()
            }
            this.storyManager = null
        }

        if (this.paintingManager) {
            this.paintingManager.destroy()
            this.paintingManager = null
        }
        
        myAppInstance = null
    }

    async preloadMedias() {
        this.mediaManager.preloadMedia({
            turtle_1: {
                type: 'video',
                src: '/videos/2_TORTUE_1.mp4',
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 7000, // en ms
            },
            turtle_2: {
                type: 'video',
                src: '/videos/3_TORTUE_2.mp4',
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 22000, // en ms
            },
            turtle_3: {
                type: 'video',
                src: '/videos/4_TORTUE_3.mp4',
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 40000, // en ms
            },
            boat_1: {
                type: 'video',
                src: '/videos/5_BATEAU_1.mp4',
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 59000, // en ms
            },
            boat_2: {
                type: 'video',
                src: '/videos/6_BATEAU_2.mp4',
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 44000, // en ms
            },
            boat_bg: {
                type: 'video',
                src: '/videos/boat_bg.mp4',
                glitchType: 'small',
                loop: true,
                muted: false,
                duration: 10000, // en ms
            },
            pub: {
                type: 'video',
                src: '/videos/1_PUB.mp4',
                glitchType: 'small',
                loop: false,
                muted: true,
                duration: 39000, // en ms
            },
            connexion: {
                type: 'video',
                src: '/videos/1080p/connexion.webm',
                glitchType: 'small',
                loop: false,
                muted: false,
                duration: 13000, // en ms
            },
            seashepherd_hope: {
                type: 'video',
                src: '/videos/SEASHEPHERD_HOPE.mp4',
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 29000, // en ms
            },
        })
    }

    /**
     * Charge les paramètres de volume sauvegardés
     */
    loadSavedVolumeSettings() {
        if (!this.soundManager) return

        const savedMusicVolume = localStorage.getItem('musicVolume')
        const savedSfxVolume = localStorage.getItem('sfxVolume')

        if (savedMusicVolume) {
            this.soundManager.setMasterMusicVolume(parseInt(savedMusicVolume) / 100)
        }

        if (savedSfxVolume) {
            this.soundManager.setMasterSfxVolume(parseInt(savedSfxVolume) / 100)
        }
    }

    /**
     * Recrée tous les boids avec les mêmes paramètres qu'à l'initialisation
     */
    recreateBoids() {
        if (!this.objectManager) return

        // Recréer les boids avec les mêmes paramètres que dans initScene()
        this.objectManager.addBoids(15, 10, new Vector3(26, 4, 31))
        this.objectManager.addBoids(5, 7, new Vector3(31, 2, 24))
        this.objectManager.addBoids(3, 10, new Vector3(25, 2, 30))

        this.objectManager.addBoids(50, 15, new Vector3(-51, 1.5, 18))
        this.objectManager.addBoids(20, 10, new Vector3(-77, 1.5, -25))
        this.objectManager.addBoids(10, 5, new Vector3(-37, 1.5, -8))
        this.objectManager.addBoids(20, 10, new Vector3(-30, 1.5, -30))
        this.objectManager.addBoids(20, 10, new Vector3(-30, 1.5, 25))
        this.objectManager.addBoids(30, 15, new Vector3(-80, 1.5, 18))
        this.objectManager.addBoids(30, 15, new Vector3(-30, 6, 0))
        this.objectManager.addBoids(30, 15, new Vector3(-70, 5, -5))
        this.objectManager.addBoids(2, 6, new Vector3(-12, 1.5, -12))
    }

    setupPaintings() {
        const paintingConfigs = [
            {
                name: 'Painting001', // Remplacez par le vrai nom
                textures: [
                    this.assetManager.getItem('dauphin_hacked'),
                ]
            },
            {
                name: 'Painting002', // Remplacez par le vrai nom
                textures: [
                    this.assetManager.getItem('tortue_hacked'),
                ]
            },
            {
                name: 'Painting003', // Remplacez par le vrai nom
                textures: [
                    this.assetManager.getItem('pirogue_hacked'),
                ]
            },
            {
                name: 'Painting004', // Remplacez par le vrai nom
                textures: [
                    this.assetManager.getItem('captain_igloo_hacked'),
                ]
            },
            {
                name: 'Painting005', // Remplacez par le vrai nom
                textures: [
                    this.assetManager.getItem('chalutier_hacked'),
                ]
            }

        ]
        
        paintingConfigs.forEach(config => {
            const painting = this.scene.getObjectByName(config.name)
            if (painting && painting.material && painting.material.map) {
                // Filtrer les textures null/undefined
                const validTextures = config.textures.filter(texture => texture !== null && texture !== undefined)
                
                if (validTextures.length === 0) {
                    // Si pas de texture alternative, utiliser la texture actuelle
                    validTextures.push(painting.material.map)
                }
                
                this.paintingManager.addPainting(
                    painting.position.clone(), // Ce paramètre n'est plus utilisé
                    validTextures,
                    painting
                )
            }
        })
    }
}
