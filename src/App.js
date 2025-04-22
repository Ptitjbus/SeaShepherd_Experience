import { Scene, MeshStandardMaterial, Color, Vector3 } from "three"
import EventEmitter from "./Utils/EventEmitter"
import CanvasSize from "./Core/CanvasSize"
import Camera from "./Core/Camera"
import Renderer from "./Core/Renderer"
import { AnimationLoop } from "./Core/AnimationLoop"
import ObjectManager from './Core/Managers/ObjectManager.js'
import AssetManager from "./Assets/AssetManager.js"
import PostProcessingManager from "./Core/PostProcessingManager.js" 
import Debug from "./Utils/Debug"
import Ocean from './World/Ocean.js'
import Sky from './World/Sky.js'
import EventsManager from './Core/Managers/EventsManager'

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

        this.startOverlay = null;
        this.startButton = null;
        this.endOverlay = null;
        this.experienceStarted = false;
        this.experienceEnded = false;

        this.popins = {};
        this.eventsManager = null;

        this.init()
    }

    async init() {
        this.renderer = new Renderer()
        this.camera = new Camera()

        this.animationLoop = new AnimationLoop()
        this.updateBound = this.update.bind(this)
        this.animationLoop.on('update', this.updateBound)

        this.assetManager = new AssetManager()
        this.assetsLoadCompleteHandlerBound = this.assetsLoadCompleteHandler.bind(this)
        this.assetManager.on('ready', this.assetsLoadCompleteHandlerBound)
        this.assetManager.load()
        this.setupUI();

        // Initialiser le gestionnaire de popins APRÈS setupUI() pour éviter les conflits
        this.eventsManager = new EventsManager();

        // Exemple d'écoute des événements du gestionnaire de popins
        this.eventsManager.on('popinShown', (popinId) => {
            console.log(`Popin "${popinId}" affichée`);
        });
    }

    setupUI() {
        this.startOverlay = document.querySelector('.start-overlay');
        this.startButton = document.querySelector('.start-button');
        this.endOverlay = document.querySelector('.end-overlay');
        
        console.log('End overlay element:', this.endOverlay);
        
        this.startButton.addEventListener('click', () => this.startExperience());
    }

    startExperience() {
        if (this.experienceStarted) return;
        
        this.experienceStarted = true;
        
        this.startOverlay.classList.add('hidden');
        
        this.canvas.style.opacity = '1';
        this.camera.switchCamera();

        if (this.museumMixer) {
            this.museumMixer.stopAllAction();
            
            const museum = this.assetManager.getItem('Museum');
            museum.animations.forEach((clip) => {
                this.museumMixer.clipAction(clip).reset().play();
            });
        }
    
        setTimeout(() => {
            this.playMuseumAnimation = !this.playMuseumAnimation
        }, 1500);
    }

    endExperience() {
        if (this.experienceEnded) return;
        this.experienceEnded = true;
        
        this.endOverlay.classList.remove('hidden');
        
        void this.endOverlay.offsetWidth;
        
        this.canvas.style.opacity = '0';
        
        setTimeout(() => {
            this.endOverlay.classList.add('visible');
        }, 100);
    }

    assetsLoadCompleteHandler() {
        this.initScene()
        this.postProcessing = new PostProcessingManager(this.renderer.instance, this.scene, this.camera.mainCamera)
        this.animationLoop.start()
        this.debug = new Debug()
        this.debug.showAnimationClipLine(this.assetManager.getItem('Museum'))
    }

    initScene() {
        this.scene = new Scene()
        this.sky = new Sky(this.scene, this.renderer.instance)
        this.ocean = new Ocean(this.scene, this.renderer.instance)
        this.objectManager = new ObjectManager()


        let museum = this.objectManager.add("Museum", new Vector3(0, 0, 0))
        this.objectManager.add("Fishes", new Vector3(0, 1, 14), {
            material: goldMaterial,
            castShadow: true,
            receiveShadow: true
        })
        
        const glowingObject = this.objectManager.getItemFromObject(museum.object.scene, "Cube046_1");
        
    }

    update(time) {
        if(this.playMuseumAnimation){
            this.objectManager.update(time.delta)
        }
        this.ocean.update(time.delta)
        this.debug.update()


        if (this.enablePostProcessing) {
            this.postProcessing.render(this.camera.mainCamera)
        } else {
            this.renderer.instance.render(this.scene, this.camera.mainCamera)
        }

        this.debug.updateStats()
    }

    destroy() {
        if (this.startButton) {
            this.startButton.removeEventListener('click', this.startExperience);
        }

        if (this.eventsManager) {
            this.eventsManager.destroy();
            this.eventsManager = null;
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

        this.gui = null
        
        this.scene = null

        this.camera.destroy()
        this.camera = null

        this.renderer.destroy()
        this.renderer = null

        this.scene = null
        this.sky.destroy()
        this.sky = null
        this.ocean.destroy()
        this.ocean = null
        this.objectManager.destroy()
        this.objectManager = null
        this.debug.destroy()
        this.debug = null

        this.animationLoop.off('update')
        this.animationLoop = null
        this.updateBound = null

        this.assetManager.off('ready')
        this.assetsLoadCompleteHandlerBound = null
        this.assetManager.destroy()
        this.assetManager = null

        this.startOverlay = null;
        this.startButton = null;
        this.endOverlay = null;

        this.canvas = null

        myAppInstance = null
    }
}