import EventEmitter from './EventEmitter'
import App from '../App'
import GUI from 'lil-gui'
import Stats from 'three/addons/libs/stats.module.js'
import { Vector3, BufferGeometry, LineBasicMaterial, Line, AxesHelper,ArrowHelper, Quaternion, SphereGeometry, MeshBasicMaterial, Mesh, CanvasTexture, LinearFilter, SpriteMaterial, Sprite } from 'three'

export default class Debug extends EventEmitter {
    constructor() {
        super()

        this.active = window.location.hash === '#debug'
        this.statsActive = window.location.hash === '#stats' || window.location.hash === '#debug'

        this.gui = null
        this.app = null

        this.cameraHelpers = []

        if(this.active) {
            this.init()
        }
        if(this.statsActive){
            this.initStats()
        }
        
    }

    init() {
        this.app = new App()
        this.gui = new GUI()
        const axesHelper = new AxesHelper( 1 )
        this.app.scene.add( axesHelper )
        const museum = this.app.objectManager.get("Museum")

        const cameraFolder = this.gui.addFolder('Camera')

        cameraFolder.add(this.app.camera.controls, 'enabled', true).name('OrbitControls')
        cameraFolder.add(this.app.camera, 'breathing', true).name('Breathing')
        cameraFolder.add(this.app.camera, 'breathingAmplitude', 0, 2).name('Amplitude')
        cameraFolder.add(this.app.camera, 'breathingSpeed', 0, 0.005).name('Vitesse')
        cameraFolder.add({ 
            trigger: () => {
                if (museum) {
                    museum.playAnimations = !museum.playAnimations
                    this.app.soundManager.isPaused ? this.app.soundManager.resumeAll() : this.app.soundManager.pauseAll()
                }
            }
        }, 'trigger').name('Play/Pause Animation')
        cameraFolder.add(this.app.camera, 'switchCamera').name('Switch Camera')
        if(museum){
            cameraFolder.add(museum.mixer, 'timeScale', 0, 3).name('Anim speed')
        }

        cameraFolder.close()

        window.addEventListener('keydown', (event) => {
            if (event.key === ' ') {
                if (museum) {
                    museum.playAnimations = !museum.playAnimations
                    this.app.soundManager.isPaused ? this.app.soundManager.resumeAll() : this.app.soundManager.pauseAll()
                }
            }
            if (event.key === 'c') {
                this.app.camera.switchCamera()
            }
            if (event.key === 'o') {
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
        })        
        postProcessingFolder.add(this.app.postProcessing, 'triggerGlitch').name('Trigger Glitch')
        postProcessingFolder.add(this.app.postProcessing, 'triggerBigGlitch').name('Trigger Big glitch')
        postProcessingFolder.open()

        // const skyFolder = this.gui.addFolder('Sky')
        // const skyController = this.app.sky.effectController
        // skyFolder.add(skyController, 'turbidity', 0.0, 20.0).onChange(() => this.app.sky.updateSky())
        // skyFolder.add(skyController, 'rayleigh', 0.0, 4.0).onChange(() => this.app.sky.updateSky())
        // skyFolder.add(skyController, 'mieCoefficient', 0.0, 0.1).onChange(() => this.app.sky.updateSky())
        // skyFolder.add(skyController, 'mieDirectionalG', 0.0, 1.0).onChange(() => this.app.sky.updateSky())
        // skyFolder.add(skyController, 'elevation', 0.0, 90.0).onChange(() => this.app.sky.updateSky())
        // skyFolder.add(skyController, 'azimuth', -180.0, 180.0).onChange(() => this.app.sky.updateSky())
        // skyFolder.add(skyController, 'exposure', 0.0, 2.0).onChange((v) => {
        //     this.app.renderer.instance.toneMappingExposure = v
        //     this.app.sky.updateSky()
        // })
        // skyFolder.close()

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


        const glassFolder = this.gui.addFolder('Glass Material')
        const glassObjects = []
        this.app.scene.traverse((child) => {
            if (child.name.toLowerCase().includes('verre')) {
                    glassObjects.push(child)
            }
        })
        if (glassObjects.length > 0) {
            const material = glassObjects[0].material
            const glassParams = {
                color: `#${material.color.getHexString()}`,
                transmission: material.transmission,
                thickness: material.thickness,
                roughness: material.roughness,
                metalness: material.metalness,
                ior: material.ior,
                clearcoat: material.clearcoat,
                clearcoatRoughness: material.clearcoatRoughness,
                specularIntensity: material.specularIntensity,
                specularColor: `#${material.specularColor.getHexString()}`,
                opacity: material.opacity,
                transparent: material.transparent
            }
        
            glassFolder.addColor(glassParams, 'color').onChange((value) => {
                glassObjects.forEach(obj => obj.material.color.set(value))
            })
        
            glassFolder.add(glassParams, 'transmission', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => obj.material.transmission = value)
            })
        
            glassFolder.add(glassParams, 'thickness', 0, 10).onChange((value) => {
                glassObjects.forEach(obj => obj.material.thickness = value)
            })
        
            glassFolder.add(glassParams, 'roughness', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => obj.material.roughness = value)
            })
        
            glassFolder.add(glassParams, 'metalness', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => obj.material.metalness = value)
            })
        
            glassFolder.add(glassParams, 'ior', 1, 2.5).onChange((value) => {
                glassObjects.forEach(obj => obj.material.ior = value)
            })
        
            glassFolder.add(glassParams, 'clearcoat', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => obj.material.clearcoat = value)
            })
        
            glassFolder.add(glassParams, 'clearcoatRoughness', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => obj.material.clearcoatRoughness = value)
            })
        
            glassFolder.add(glassParams, 'specularIntensity', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => obj.material.specularIntensity = value)
            })
        
            glassFolder.addColor(glassParams, 'specularColor').onChange((value) => {
                glassObjects.forEach(obj => obj.material.specularColor.set(value))
            })
        
            glassFolder.add(glassParams, 'opacity', 0, 1).onChange((value) => {
                glassObjects.forEach(obj => {
                    obj.material.opacity = value
                    obj.material.transparent = value < 1
                })
            })
        
            glassFolder.add(glassParams, 'transparent').onChange((value) => {
                glassObjects.forEach(obj => obj.material.transparent = value)
            })
        
            glassFolder.open()

            const soundPlayerFolder = this.gui.addFolder('Sound Player')
            soundPlayerFolder.add({
                playSoundOnSpeakers: () => {
                    this.app.soundManager.playSoundOnSpeakers('voiceLine 1', 'audio/voices/voice_test.m4a', {
                        volume: 0.8,
                        loop: true,
                        maxDistance: 8
                    })
                }
            }, 'playSoundOnSpeakers').name('Play Sound on speakers')

            soundPlayerFolder.add(this.app.soundManager, 'stopAll').name('Stop All Sounds')
        }

    }, 'openWindow').name('Ouvrir une nouvelle fenêtre')

    const videoFolder = this.gui.addFolder('Video')

    videoFolder.add({
        playVideo: () => {
            this.app.mediaManager.playMediaWithGlitch('error1');
        }
    }, 'playVideo').name('Jouer une vidéo')
  }

    

    initStats() {
        this.stats = new Stats()
        document.body.appendChild( this.stats.dom )
    }

    updateStats() {
        if(this.statsActive) {
            this.stats.update()
        }
    }

    showAnimationClipLine(object) {
        if (!this.active) return
    
        this.showCameraHelper(object)
    
        const clips = object.animations
        if (!clips) return
    
        clips.forEach((clip, i) => {
            const positions = []
            const tempVector = new Vector3()
    
            clip.tracks.forEach((track) => {
                if (track.name.endsWith('.position')) {
                    for (let index = 0; index < track.values.length; index += 3) {
                        tempVector.set(
                            track.values[index],
                            track.values[index + 1],
                            track.values[index + 2]
                        )
                        positions.push(tempVector.clone())
                    }
                }
            })
    
            if (positions.length === 0) return
    
            const geometry = new BufferGeometry().setFromPoints(positions)
            const material = new LineBasicMaterial({ color: this.getColorForTrack(i) })
            const line = new Line(geometry, material)
    
            this.app.scene.add(line)
    
            // Ajouter un label texte au début du chemin
            const label = this.createTextLabel(clip.name, positions[0])
            this.app.scene.add(label)
        })
    }
    

    createTextLabel(text, position) {
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'white'
        ctx.font = '24px Arial'
        ctx.fillText(text, 10, 40)
    
        const texture = new CanvasTexture(canvas)
        texture.minFilter = LinearFilter
    
        const material = new SpriteMaterial({ map: texture, transparent: true })
        const sprite = new Sprite(material)
        sprite.scale.set(1, 0.25, 1)
        sprite.position.copy(position)
    
        return sprite
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

    createHelper(object, scene = this.app.scene, position = null){
        if (!this.active) return 
        
        const sphere = new Mesh(
            new SphereGeometry(0.2, 16, 16),
            new MeshBasicMaterial({ color: 0xffffff })
        )
        let pos = position ? position : object.position
        sphere.position.copy(pos)
        
        const direction = new Vector3(0, 0, 1)
        direction.applyQuaternion(object.quaternion) // utilise l'orientation de l'objet
        const arrow = new ArrowHelper(direction, pos, 1, 0x00ff00)
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