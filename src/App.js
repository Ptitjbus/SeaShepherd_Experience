import { Scene, MeshStandardMaterial, Color, Vector3 } from "three"
import ObjectManager from './Core/Managers/ObjectManager.js'
import AssetManager from "./Assets/AssetManager.js"
import PostProcessingManager from "./Core/Managers/PostProcessingManager.js"
import EventEmitter from "./Utils/EventEmitter"
import CanvasSize from "./Core/CanvasSize"
import Camera from "./Core/Camera"
import Renderer from "./Core/Renderer"
import { AnimationLoop } from "./Core/AnimationLoop"
import Debug from "./Utils/Debug"
import Ocean from './World/Ocean.js'
import EventsManager from './Core/Managers/EventsManager'
import SoundManager from './Core/Managers/SoundManager.js'
import MediaManager from './Core/Managers/MediaManager.js'
import CustomEnvironment from './World/CustomEnvironment.js'
import { ChoicesManager } from "./Core/Managers/ChoicesManager.js"
import DoorManager from './Core/Managers/DoorManager.js'
import PhysicsManager from "./Core/Managers/PhysicsManager.js"
import StoryManager from "./Core/Managers/StoryManager.js"

let myAppInstance = null

const goldMaterial = new MeshStandardMaterial({
    color: new Color(0x1200ff), // doré
    metalness: 1,
    roughness: 0.2
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

        this.postProcessing = null
        this.enablePostProcessing = true

        this.startOverlay = null
        this.startButton = null
        this.endOverlay = null
        this.experienceStarted = false
        this.experienceEnded = false
        this.playMuseumAnimation = false

        this.popins = {}
        this.eventsManager = null

        this.soundManager = null
        this.mediaManager = null

        this.choicesManager = null

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
        
        this.animationLoop = new AnimationLoop()
        this.updateBound = this.update.bind(this)
        this.animationLoop.on('update', this.updateBound)

        this.assetManager = new AssetManager()
        this.assetsLoadCompleteHandlerBound = this.assetsLoadCompleteHandler.bind(this)
        this.assetManager.on('ready', this.assetsLoadCompleteHandlerBound)
        this.assetManager.load()

        this.eventsManager = new EventsManager()

        this.eventsManager.on('popinShown', (popinId) => {
            console.log(`Popin "${popinId}" affichée`)
        })

        this.mediaManager = new MediaManager()
        this.mediaManager.init(this.scene)

        this.choicesManager = new ChoicesManager()
        
        // Instancier le gestionnaire d'histoire si nécessaire
        this.storyManager = new StoryManager()
        
        // Précharger les médias après avoir initialisé le MediaManager
        this.initMedias()
        
        this.setupUI()
    }

    async initMedias() {
        await this.preloadMedias()
    }

    setupUI() {
        this.startOverlay = document.querySelector('.start-overlay')
        this.startButton = document.querySelector('.start-button')
        this.endOverlay = document.querySelector('.end-overlay')
                
        this.startButton.addEventListener('click', (e) => {
            e.preventDefault()
            // Utiliser la méthode startExperience de cette classe,
            // ou celle du storyManager si c'est ce que vous souhaitez
            this.startExperience()
            // Si vous voulez utiliser storyManager à la place :
            // if (this.storyManager && typeof this.storyManager.startExperience === 'function') {
            //     this.storyManager.startExperience()
            // } else {
            //     this.startExperience()
            // }
        })
    }

    startExperience() {
        if (this.experienceStarted) return
        
        this.experienceStarted = true
        
        this.startOverlay.classList.add('hidden')
        
        this.canvas.style.opacity = '1'
        // this.camera.switchCamera()

        // this.soundManager.resumeAll()

        if (this.museumMixer) {
            this.museumMixer.stopAllAction()
            
            const museum = this.assetManager.getItem('Museum')
            museum.animations.forEach((clip) => {
                this.museumMixer.clipAction(clip).reset().play()
            })
        }
    
        this.playMuseumAnimation = !this.playMuseumAnimation
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

    assetsLoadCompleteHandler() {
        this.initScene()
        this.postProcessing = new PostProcessingManager(this.renderer.instance, this.scene, this.camera.mainCamera)
        this.mediaManager.init(this.scene)
        this.mediaManager.connectToPostProcessingManager(this.postProcessing)
        this.canvas.style.opacity = '1'
        this.animationLoop.start()
        this.debug.init()
        this.debug.showAnimationClipLine(this.assetManager.getItem('Museum'))
    }

    initScene() {
        this.environment = new CustomEnvironment(this.scene, this.renderer.instance, '/hdri/ocan_sky.exr')
        this.ocean = new Ocean(this.scene, this.renderer.instance)
        this.objectManager = new ObjectManager()
        this.soundManager = new SoundManager()
        this.soundManager.initSound()

        const museum = this.objectManager.add("Museum", new Vector3(0, 0, 0), {
            applyCaustics: true
        })

        this.objectManager.addPointLight(new Vector3(-20, 6, 8), 0xf7c164, 30.0)


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
        this.doorManager.addDoorPair(new Vector3(-8.01, 0, 0.05))
        this.doorManager.doorPairs[0].setRotation(Math.PI/2)
        this.doorManager.doorPairs[0].setOpenable(true)

        // Porte 2
        this.doorManager.addDoorPair(new Vector3(-50.86, 0, -30.36))
        this.doorManager.doorPairs[1].setRotation(0.42 * Math.PI/180)
        this.doorManager.doorPairs[1].setOpenable(true)

        // Porte 3
        this.doorManager.addDoorPair(new Vector3(-67, 0, -121), 6, 9)
        this.doorManager.doorPairs[2].setRotation(Math.PI/2)
        this.doorManager.doorPairs[2].setOpenable(true)
    }

    update(time) {
        if(this.playMuseumAnimation) this.objectManager.update(time)
        if (this.mediaManager) this.mediaManager.update(this.camera.mainCamera)
        if (this.soundManager) this.soundManager.updateListener()
        if (this.physicsManager) this.physicsManager.update(time.delta)

        if (this.doorManager) this.doorManager.update()

        this.ocean.update(time.delta)
        this.debug.update()

        if (this.enablePostProcessing) {
            this.postProcessing.render(this.camera.mainCamera)
        } else {
            this.renderer.instance.render(this.scene, this.camera.mainCamera)
        }
    }

    destroy() {
        if (this.startButton) {
            this.startButton.removeEventListener('click', this.startExperience)
        }

        if (this.eventsManager) {
            this.eventsManager.destroy()
            this.eventsManager = null
        }

        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose()
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => {
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
        
        if (this.choicesManager) {
            this.choicesManager.destroy()
            this.choicesManager = null
        }
        
        if (this.storyManager) {
            // Ajoutez une méthode destroy au StoryManager si nécessaire
            if (typeof this.storyManager.destroy === 'function') {
                this.storyManager.destroy()
            }
            this.storyManager = null
        }

        myAppInstance = null
    }

    async preloadMedias() {
        this.mediaManager.preloadMedia({
            'error1': { 
                type: 'video', 
                src: '/videos/massacre_dauphin.mp4', 
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 2000 // en ms
            },
            'bigvideo': { 
                type: 'video', 
                src: '/videos/bigvideo_720p.webm', 
                glitchType: 'big',
                loop: false,
                muted: false,
                duration: 15000 // en ms
            }
        })
    }
}