import { Scene, AmbientLight, AnimationMixer, MeshStandardMaterial, Color, Vector3, BufferGeometry, LineBasicMaterial, Line, Fog } from "three"
import EventEmitter from "./Utils/EventEmitter"
import CanvasSize from "./Core/CanvasSize"
import Camera from "./Core/Camera"
import Renderer from "./Core/Renderer"
import { AnimationLoop } from "./Core/AnimationLoop"
import { AssetManager } from "./Assets/AssetManager"
import PostProcessing from "./Core/PostProcessing" 
import Debug from "./Utils/Debug"
import Ocean from './Assets/Ocean.js';
import SkyManager from './Assets/SkyManager.js'

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

        this.debug = null

        this.assetManager = null

        this.postProcessing = null
        this.enablePostProcessing = true

        this.cube = null
        this.fishesMixer = null
        this.museumMixer = null
        this.playMuseumAnimation = false

        this.startOverlay = null;
        this.startButton = null;
        this.endOverlay = null;
        this.experienceStarted = false;
        this.experienceEnded = false;

        this.popins = {};
        this.currentOS = this.detectOS();

        this.init()
    }

    detectOS() {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) {
            return 'mac';
        } else {
            return 'windows'; // On considère tout ce qui n'est pas Mac comme Windows pour simplifier
        }
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

        document.body.classList.add(this.currentOS);
    }

    setupUI() {
        this.startOverlay = document.querySelector('.start-overlay');
        this.startButton = document.querySelector('.start-button');
        this.endOverlay = document.querySelector('.end-overlay');
        
        console.log('End overlay element:', this.endOverlay); // Vérifiez que ce n'est pas null
        
        this.startButton.addEventListener('click', () => this.startExperience());

        this.setupPopins();
    }

    setupPopins() {
        const popinElements = document.querySelectorAll('.popin');
        
        popinElements.forEach(popin => {
            const id = popin.id;
            this.popins[id] = popin;
            
            const closeButton = popin.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('click', () => this.hidePopin(id));
            }
        });
        
        window.showPopin = this.showPopin.bind(this);
        window.hidePopin = this.hidePopin.bind(this);
    }

    showPopin(popinId) {
        const popin = this.popins[popinId];
        if (popin) {
            popin.classList.remove('hidden');
            return true;
        }
        console.warn(`Popin avec l'ID "${popinId}" non trouvée.`);
        return false;
    }

    hidePopin(popinId) {
        const popin = this.popins[popinId];
        if (popin) {
            popin.classList.add('hidden');
            return true;
        }
        console.warn(`Popin avec l'ID "${popinId}" non trouvée.`);
        return false;
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
        this.postProcessing = new PostProcessing(this.renderer.instance, this.scene, this.camera.mainCamera)
        this.animationLoop.start()
        this.debug = new Debug()
        this.debug.showAnimationClipLine(this.assetManager.getItem('Museum'), 'animation_0')
    }

    initScene() {
        this.scene = new Scene()
        this.skyManager = new SkyManager(this.scene, this.renderer.instance)
        this.ocean = new Ocean(this.scene, this.renderer.instance);

        const ambientLight = new AmbientLight(0xffffff, 1)
        this.scene.add(ambientLight)

        const fishes = this.assetManager.getItem('Fishes')
        const museum = this.assetManager.getItem('Museum')

        museum.scene.position.set(0, 0, 0)
        
        museum.scene.traverse((child) => {
            if (child.isCamera) {
                this.camera.allCameras.push(child)
            }
        })

        this.museumMixer = new AnimationMixer(museum.scene)
        museum.animations.forEach((clip) => {
            const action = this.museumMixer.clipAction(clip);
            action.paused = true;
            action.play();
        })

        fishes.scene.position.set(0, 1, 14)
        this.fishesMixer = new AnimationMixer(fishes.scene)
        fishes.animations.forEach((clip) => {
            this.fishesMixer.clipAction(clip).play()
        })

        fishes.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = goldMaterial
                child.castShadow = true
                child.receiveShadow = true
            }
        })
                
        this.scene.add(fishes.scene)
        this.scene.add(museum.scene)
        
    }

    update(time) {
        this.fishesMixer.update(time.delta);
        
        if (this.experienceStarted && this.museumMixer) {
            if(this.playMuseumAnimation){
            this.museumMixer.update(time.delta);
        }

        }
        this.skyManager.update()
        this.ocean.update(time.delta)

        this.camera.applyLookAroundOffset()

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

        Object.keys(this.popins).forEach(id => {
            const popin = this.popins[id];
            const closeButton = popin.querySelector('.close-button');
            if (closeButton) {
                closeButton.removeEventListener('click', () => this.hidePopin(id));
            }
        });

        this.popins = null;

        window.showPopin = null;
        window.hidePopin = null;

        this.scene.remove(this.cube)
        this.cube.destroy()
        this.cube = null

        this.postProcessing = null  

        this.gui = null
        
        this.scene = null

        this.camera.destroy()
        this.camera = null

        this.renderer.destroy()
        this.renderer = null

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