import EventEmitter from './EventEmitter'
import App from '../App'
import GUI from 'lil-gui'
import Stats from 'three/addons/libs/stats.module.js';
import { Vector3, BufferGeometry, LineBasicMaterial, Line } from 'three'

export default class Debug extends EventEmitter {
  constructor() {
    super()

    this.active = window.location.hash === '#debug'

    this.gui = null
    this.app = null

    if(this.active) {
        this.init()
    }
  }

  init() {
    this.app = new App()
    this.gui = new GUI()
    this.stats = new Stats();
    document.body.appendChild( this.stats.dom );

    const cameraFolder = this.gui.addFolder('Camera')

    cameraFolder.add(this.app.camera.controls, 'enabled', true).name('OrbitControls')
    cameraFolder.add(this.app.camera, 'breathing', true).name('Breathing')
    cameraFolder.add(this.app.camera, 'breathingAmplitude', 0, 2).name('Amplitude')
    cameraFolder.add(this.app.camera, 'breathingSpeed', 0, 0.005).name('Vitesse')
    cameraFolder.add({ 
        trigger: () => {
            this.app.playMuseumAnimation = !this.app.playMuseumAnimation
        }
    }, 'trigger').name('Play/Pause Animation')
    cameraFolder.add(this.app.camera, 'switchCamera').name('Switch Camera')
    cameraFolder.add(this.app.museumMixer, 'timeScale', 0, 3).name('Anim speed')

    cameraFolder.open()

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            this.app.playMuseumAnimation = !this.app.playMuseumAnimation
        }
        if (event.key === 's') {
            this.app.camera.switchCamera()
        }
        if (event.key === 'e') {
            this.app.endExperience()
        }
        if (event.key === 'p') {
            this.app.eventsManager.displayAlert("Ceci est une popin d'information",'information');
        }
        if (event.key === 'g') {
            this.app.postProcessingManager.triggerGlitch();
        }
    })

    const postProcessingFolder = this.gui.addFolder('Post Processing')

    postProcessingFolder.add(this.app, 'enablePostProcessing', true).name('Enable Post Processing')
    postProcessingFolder.add(this.app.postProcessingManager.fisheyePass, 'enabled', true).name('Enable Fisheye Pass')
    postProcessingFolder.add(this.app.postProcessingManager.renderPixelatedPass, 'enabled', true).name('Enable Pixelated Pass')
    postProcessingFolder.add(this.app.postProcessingManager.fxaaPass, 'enabled', true).name('Enable Fxaa Pass')
    postProcessingFolder.add(this.app.postProcessingManager.renderPixelatedPass, 'normalEdgeStrength', 0, 1).name('Normal Edge Strength')
    postProcessingFolder.add(this.app.postProcessingManager.renderPixelatedPass, 'depthEdgeStrength', 0, 1).name('Depth Edge Strength')
    postProcessingFolder.add( this.app.postProcessingManager, 'pixelSize', 1, 50 ).onChange( () => {
        this.app.postProcessingManager.renderPixelatedPass.setPixelSize( this.app.postProcessingManager.pixelSize );
    } );        
    postProcessingFolder.add(this.app.postProcessingManager, 'triggerGlitch').name('Trigger Glitch')
    postProcessingFolder.add(this.app.postProcessingManager, 'triggerBigGlitch').name('Trigger Big glitch')
    postProcessingFolder.open()

    const skyFolder = this.gui.addFolder('Sky')

    const skyController = this.app.skyManager.effectController

    skyFolder.add(skyController, 'turbidity', 0.0, 20.0).onChange(() => this.app.skyManager.updateSky())
    skyFolder.add(skyController, 'rayleigh', 0.0, 4.0).onChange(() => this.app.skyManager.updateSky())
    skyFolder.add(skyController, 'mieCoefficient', 0.0, 0.1).onChange(() => this.app.skyManager.updateSky())
    skyFolder.add(skyController, 'mieDirectionalG', 0.0, 1.0).onChange(() => this.app.skyManager.updateSky())
    skyFolder.add(skyController, 'elevation', 0.0, 90.0).onChange(() => this.app.skyManager.updateSky())
    skyFolder.add(skyController, 'azimuth', -180.0, 180.0).onChange(() => this.app.skyManager.updateSky())
    skyFolder.add(skyController, 'exposure', 0.0, 2.0).onChange((v) => {
        this.app.renderer.instance.toneMappingExposure = v
        this.app.skyManager.updateSky()
    })

    skyFolder.close()

    const eventsFolder = this.gui.addFolder('Events');
    
    eventsFolder.add({
        showInfoPopin: () => {
           this.app.eventsManager.displayAlert("Ceci est une popin d'information",'information');
        }
    }, 'showInfoPopin').name('Afficher Info Popin');
    
    eventsFolder.add({
        showWarningPopin: () => {
            this.app.eventsManager.displayAlert("Ceci est une popin de warning", 'Attention');
        }
    }, 'showWarningPopin').name('Afficher Warning Popin');

    const windowFolder = this.gui.addFolder('Window');

    windowFolder.add({
        openWindow: () => {
            this.app.eventsManager.openWindow('http://localhost:5173/confidential-documents');
        }
    }, 'openWindow').name('Ouvrir une nouvelle fenêtre');
  }

  updateStats() {
    if(this.active) {
        this.stats.update();
    }
  }

  showAnimationClipLine(object, animationName){
    const cameraAnimationClip = object.animations.find(clip => clip.name === animationName); 
    
    if (cameraAnimationClip) {
        const positions = [];
        const tempVector = new Vector3();

        cameraAnimationClip.tracks.forEach((track) => {
            if (track.name.endsWith('.position')) {
                track.values.forEach((value, index) => {
                    if (index % 3 === 0) {
                        tempVector.set(
                            track.values[index],
                            track.values[index + 1],
                            track.values[index + 2]
                        );
                        positions.push(tempVector.clone());
                    }
                });
            }
        });

        const geometry = new BufferGeometry().setFromPoints(positions);
        const material = new LineBasicMaterial({ color: 0xff0000 });
        const line = new Line(geometry, material);

        this.app.scene.add(line);
    }
  }

  destroy() {
      this.gui.destroy()
      this.gui = null

      this.app = null    
  }
}