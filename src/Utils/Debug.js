import EventEmitter from './EventEmitter'
import App from '../App'
import GUI from 'lil-gui'
import Stats from 'three/addons/libs/stats.module.js'
import { Vector3, BufferGeometry, LineBasicMaterial, Line, AxesHelper,ArrowHelper, Quaternion, SphereGeometry, MeshBasicMaterial, Mesh } from 'three'

export default class Debug extends EventEmitter {
  constructor() {
    super()

    this.active = window.location.hash === '#debug'

    this.gui = null
    this.app = null

    this.cameraHelpers = []

    if(this.active) {
        this.init()
    }
  }

  init() {
    this.app = new App()
    this.gui = new GUI()
    const axesHelper = new AxesHelper( 1 )
    this.app.scene.add( axesHelper )
    this.stats = new Stats()
    document.body.appendChild( this.stats.dom )

    const cameraFolder = this.gui.addFolder('Camera')

    cameraFolder.add(this.app.camera.controls, 'enabled', true).name('OrbitControls')
    cameraFolder.add(this.app.camera, 'breathing', true).name('Breathing')
    cameraFolder.add(this.app.camera, 'breathingAmplitude', 0, 2).name('Amplitude')
    cameraFolder.add(this.app.camera, 'breathingSpeed', 0, 0.005).name('Vitesse')
    cameraFolder.add({ 
        trigger: () => {
            const museum = this.app.objectManager.get("Museum")
            museum.playAnimations = !museum.playAnimations
        }
    }, 'trigger').name('Play/Pause Animation')
    cameraFolder.add(this.app.camera, 'switchCamera').name('Switch Camera')
    cameraFolder.add(this.app.objectManager.get("Museum").mixer, 'timeScale', 0, 3).name('Anim speed')

    cameraFolder.open()

    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            const museum = this.app.objectManager.get("Museum")
            museum.playAnimations = !museum.playAnimations
        }
        if (event.key === 's') {
            this.app.camera.switchCamera()
        }
        if (event.key === 'e') {
            this.app.endExperience()
        }
        if (event.key === 'p') {
            this.app.eventsManager.displayAlert("Ceci est une popin d'information",'information')
        }
    })

    const postProcessingFolder = this.gui.addFolder('Post Processing')

    postProcessingFolder.add(this.app, 'enablePostProcessing', true).name('Enable Post Processing')
    postProcessingFolder.add(this.app.postProcessing.fisheyePass, 'enabled', true).name('Enable Fisheye Pass')
    postProcessingFolder.add(this.app.postProcessing.renderPixelatedPass, 'enabled', true).name('Enable Pixelated Pass')
    postProcessingFolder.add(this.app.postProcessing.bloomPass, 'enabled', true).name('Enable Bloom Pass')
    postProcessingFolder.add(this.app.postProcessing.bloomPass, 'threshold', 0.0, 1.0).name('Threshold')
    postProcessingFolder.add(this.app.postProcessing.bloomPass, 'strength', 0.0, 3.0).name('Strength')
    postProcessingFolder.add(this.app.postProcessing.bloomPass, 'radius', 0.0, 1.0).name('Radius')
    postProcessingFolder.add(this.app.postProcessing.fxaaPass, 'enabled', true).name('Enable Fxaa Pass')
    postProcessingFolder.add(this.app.postProcessing.renderPixelatedPass, 'normalEdgeStrength', 0, 1).name('Normal Edge Strength')
    postProcessingFolder.add(this.app.postProcessing.renderPixelatedPass, 'depthEdgeStrength', 0, 1).name('Depth Edge Strength')
    postProcessingFolder.add( this.app.postProcessing, 'pixelSize', 1, 50 ).onChange( () => {
        this.app.postProcessing.renderPixelatedPass.setPixelSize( this.app.postProcessing.pixelSize )
    } )        
    postProcessingFolder.add(this.app.postProcessing, 'triggerGlitch').name('Trigger Glitch')
    postProcessingFolder.add(this.app.postProcessing, 'triggerBigGlitch').name('Trigger Big glitch')
    postProcessingFolder.open()

    const skyFolder = this.gui.addFolder('Sky')

    const skyController = this.app.sky.effectController

    skyFolder.add(skyController, 'turbidity', 0.0, 20.0).onChange(() => this.app.sky.updateSky())
    skyFolder.add(skyController, 'rayleigh', 0.0, 4.0).onChange(() => this.app.sky.updateSky())
    skyFolder.add(skyController, 'mieCoefficient', 0.0, 0.1).onChange(() => this.app.sky.updateSky())
    skyFolder.add(skyController, 'mieDirectionalG', 0.0, 1.0).onChange(() => this.app.sky.updateSky())
    skyFolder.add(skyController, 'elevation', 0.0, 90.0).onChange(() => this.app.sky.updateSky())
    skyFolder.add(skyController, 'azimuth', -180.0, 180.0).onChange(() => this.app.sky.updateSky())
    skyFolder.add(skyController, 'exposure', 0.0, 2.0).onChange((v) => {
        this.app.renderer.instance.toneMappingExposure = v
        this.app.sky.updateSky()
    })

    skyFolder.close()

    const popinsFolder = this.gui.addFolder('Popins')
    
    popinsFolder.add({
        showInfoPopin: () => {
           this.app.eventsManager.displayAlert("Ceci est une popin d'information",'information')
        }
    }, 'showInfoPopin').name('Afficher Info Popin')
    
    popinsFolder.add({
        showWarningPopin: () => {
            this.app.eventsManager.displayAlert("Ceci est une popin de warning", 'Attention')
        }
    }, 'showWarningPopin').name('Afficher Warning Popin')

    const windowFolder = this.gui.addFolder('Window')

    windowFolder.add({
        openWindow: () => {
            this.app.eventsManager.openWindow('http://localhost:5173/confidential-documents')
        }
    }, 'openWindow').name('Ouvrir une nouvelle fenêtre')

    const videoFolder = this.gui.addFolder('Video')

    videoFolder.add({
        playVideo: () => {
            this.app.mediaManager.playMediaWithGlitch('error1');
        }
    }, 'playVideo').name('Jouer une vidéo')
  }

    updateStats() {
        if(this.active) {
            this.stats.update()
        }
    }

    showAnimationClipLine(object) {
        if (!this.active) return

        this.showCameraHelper(object)

        const clips = object.animations

        if (!clips) return

        clips.forEach(clip => {
            const tracksByType = {}
    
            clip.tracks.forEach(track => {
                const [nodeName, type] = track.name.split('.')
                tracksByType[nodeName] = tracksByType[nodeName] || {}
                tracksByType[nodeName][type] = track
            })
    
            Object.entries(tracksByType).forEach(([nodeName, types], index) => {
                const positionTrack = types['position']
                const quaternionTrack = types['quaternion']
    
                if (!positionTrack || !quaternionTrack) return
    
                const times = Array.from(new Set([...positionTrack.times, ...quaternionTrack.times])).sort((a, b) => a - b)
    
                const positionInterpolant = positionTrack.createInterpolant()
                const quaternionInterpolant = quaternionTrack.createInterpolant()
    
                const positions = []
    
                for (let t of times) {
                    const posArray = positionInterpolant.evaluate(t)
                    const quatArray = quaternionInterpolant.evaluate(t)
    
                    const pos = new Vector3().fromArray(posArray)
                    const quat = new Quaternion().fromArray(quatArray)
    
                    positions.push(pos.clone())
    
                    const dir = new Vector3(0, 0, 1).applyQuaternion(quat).normalize()
                    const arrow = new ArrowHelper(dir, pos, 0.5, this.getColorForTrack(index))
                    this.app.scene.add(arrow)
                }
    
                const geometry = new BufferGeometry().setFromPoints(positions)
                const material = new LineBasicMaterial({ color: this.getColorForTrack(index) })
                const line = new Line(geometry, material)
                this.app.scene.add(line)
            })
        })

    }

    showCameraHelper(object) {
        object.scene.traverse((child) => {
            if (child.isCamera) {
        
                const helper = new AxesHelper(0.5)
                helper.name = `camera-helper-${child.name}`
                this.cameraHelpers.push({ camera: child, helper })
                this.app.scene.add(helper)
            }
        })
    }

    createHelper(object, scene = this.app.scene){
        const sphere = new Mesh(
            new SphereGeometry(0.2, 16, 16),
            new MeshBasicMaterial({ color: 0xffffff })
        )
        sphere.position.copy(object.position)
        
        const direction = new Vector3(0, 0, 1)
        direction.applyQuaternion(object.quaternion) // utilise l'orientation de l'objet
        const arrow = new ArrowHelper(direction, object.position, 1, 0x00ff00)
        scene.add(sphere)
        scene.add(arrow)

    }

    getColorForTrack(index) {
        const colors = [
            0xff0000,
            0x00ff00,
            0x0000ff,
            0xffff00,
            0xff00ff,
            0x00ffff 
        ]
        return colors[index % colors.length]
    }

    update() {
        if (!this.active) return

        this.cameraHelpers.forEach(({ camera, helper }) => {
            camera.updateMatrixWorld(true)
            helper.position.copy(camera.getWorldPosition(new Vector3()))
            helper.quaternion.copy(camera.getWorldQuaternion(new Quaternion()))
        })
    }

    destroy() {
        this.gui.destroy()
        this.gui = null

        this.app = null    
    }
}