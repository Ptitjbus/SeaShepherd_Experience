import EventEmitter from './EventEmitter'
import App from '../App'
import GUI from 'lil-gui'
import Stats from 'three/addons/libs/stats.module.js'
import { 
    Vector3, 
    Color, 
    BufferGeometry, 
    LineBasicMaterial, 
    Line, 
    AxesHelper, 
    ArrowHelper, 
    Quaternion, 
    SphereGeometry, 
    MeshBasicMaterial, 
    Mesh, 
    CanvasTexture, 
    LinearFilter, 
    SpriteMaterial, 
    Sprite, 
    PointLightHelper, 
    Euler 
} from 'three'

export default class Debug extends EventEmitter {
    constructor() {
        super()

        this.active = window.location.hash === '#debug'
        this.statsActive = window.location.hash === '#stats' || window.location.hash === '#debug'
        this.positionDisplayActive = this.active

        this.gui = null
        this.app = null

        this.cameraHelpers = []
        this.lightHelpers = []
        this.animationsClipsLines = []
        this.animationsTextLabels = []
        this.speakersHelpers = []
        this.positionDisplay = null
    }

    init(){
        if(this.active) {
            this.initGUI()
        }
        if(this.statsActive){
            this.initStats()
        }
        if(this.positionDisplayActive) {
            this.initPositionDisplay()
        }
    }

    initPositionDisplay() {
        this.positionDisplay = document.createElement('div')
        this.positionDisplay.style.position = 'absolute'
        this.positionDisplay.style.bottom = '10px'
        this.positionDisplay.style.left = '10px'
        this.positionDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        this.positionDisplay.style.color = 'white'
        this.positionDisplay.style.padding = '10px'
        this.positionDisplay.style.borderRadius = '5px'
        this.positionDisplay.style.fontFamily = 'monospace'
        this.positionDisplay.style.fontSize = '14px'
        this.positionDisplay.style.zIndex = '1000'
        this.positionDisplay.style.pointerEvents = 'none'
        document.body.appendChild(this.positionDisplay)
    }

    updatePositionDisplay() {
        if (!this.positionDisplay || !this.app.physicsManager || !this.app.physicsManager.controls) return;
    
        const player = this.app.physicsManager.controls;
        
        let position = { x: 0, y: 0, z: 0 };
        let rotation = { x: 0, y: 0, z: 0 };
        
        if (player.position) {
            position = player.position;
        } else if (player.body && player.body.position) {
            position = player.body.position;
        } else if (typeof player.getObjectPosition === 'function') {
            position = player.getObjectPosition();
        } else if (typeof player.getObject === 'function' && player.getObject().position) {
            position = player.getObject().position;
        } else if (this.app.camera && this.app.camera.instance && this.app.camera.instance.position) {
            position = this.app.camera.instance.position;
        }
        
        if (player.rotation) {
            rotation = player.rotation;
        } else if (player.quaternion) {
            const euler = new Euler().setFromQuaternion(player.quaternion);
            rotation = { x: euler.x, y: euler.y, z: euler.z };
        } else if (player.getObject && typeof player.getObject === 'function' && player.getObject().rotation) {
            rotation = player.getObject().rotation;
        } else if (this.app.camera && this.app.camera.instance && this.app.camera.instance.rotation) {
            rotation = this.app.camera.instance.rotation;
        }
    
        const rotationDegrees = {
            x: (rotation.x * 180 / Math.PI).toFixed(2),
            y: (rotation.y * 180 / Math.PI).toFixed(2),
            z: (rotation.z * 180 / Math.PI).toFixed(2)
        };
        
        this.positionDisplay.innerHTML = `
            <strong>Position:</strong>
            X: ${position.x.toFixed(2)}
            Y: ${position.y.toFixed(2)}
            Z: ${position.z.toFixed(2)}
            <br>
            <strong>Rotation (deg):</strong>
            X: ${rotationDegrees.x}
            Y: ${rotationDegrees.y}
            Z: ${rotationDegrees.z}
        `;
    }

    initGUI() {
        this.app = new App()
        this.gui = new GUI()
        this.displayLightsHelpers()

        this.initPysicsFolder()
        this.initCameraFolder()
        this.initDebugFolder()
        this.initShortcutsFolder()
        this.initPostProcessingFolder()
        this.initPopinsFolder()
        this.initWindowFolder()
        this.initTransmissionMaterialFolder()
        this.initCausticMaterialFolder()
        this.initSoundPlayerFolder()
        this.initMediaPlayerFolder()  
        this.initBoidsFolder()
        this.initPositionDisplayFolder()
    }

    initPositionDisplayFolder() {
        const positionFolder = this.gui.addFolder('Position Display')
        
        positionFolder.add({ 
            enabled: this.positionDisplayActive 
        }, 'enabled')
        .name('Show Position Display')
        .onChange(value => {
            this.positionDisplayActive = value
            if (this.positionDisplay) {
                this.positionDisplay.style.display = value ? 'block' : 'none'
            } else if (value) {
                this.initPositionDisplay()
            }
        })
        
        positionFolder.add({ 
            copy: () => {
                if (!this.app.physicsManager || !this.app.physicsManager.controls) return;
                
                const player = this.app.physicsManager.controls;
                
                let position = { x: 0, y: 0, z: 0 };
                let rotation = { x: 0, y: 0, z: 0 };
                
                if (player.position) {
                    position = player.position;
                } else if (player.body && player.body.position) {
                    position = player.body.position;
                } else if (typeof player.getObjectPosition === 'function') {
                    position = player.getObjectPosition();
                } else if (typeof player.getObject === 'function' && player.getObject().position) {
                    position = player.getObject().position;
                } else if (this.app.camera && this.app.camera.instance && this.app.camera.instance.position) {
                    position = this.app.camera.instance.position;
                }
                
                if (player.rotation) {
                    rotation = player.rotation;
                } else if (player.quaternion) {
                    const euler = new Euler().setFromQuaternion(player.quaternion);
                    rotation = { x: euler.x, y: euler.y, z: euler.z };
                } else if (player.getObject && typeof player.getObject === 'function' && player.getObject().rotation) {
                    rotation = player.getObject().rotation;
                } else if (this.app.camera && this.app.camera.instance && this.app.camera.instance.rotation) {
                    rotation = this.app.camera.instance.rotation;
                }
                
                const positionString = `position: new Vector3(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}), rotation: ${rotation.y.toFixed(2)}`;
                
                navigator.clipboard.writeText(positionString)
                    .then(() => {
                        const originalText = this.positionDisplay.innerHTML;
                        this.positionDisplay.innerHTML += '<br><span style="color: #4CAF50">✓ Copied to clipboard!</span>';
                        setTimeout(() => {
                            this.positionDisplay.innerHTML = originalText;
                        }, 1000);
                    })
                    .catch(err => {
                        console.error('Could not copy text: ', err);
                    });
            }
        }, 'copy')
        .name('Copy Position & Rotation');
        
        positionFolder.close();
    }

    initStats() {
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;top:0;left:0;display:flex;';
        document.body.appendChild(container);
        
        this.fpsPanel = new Stats();
        this.fpsPanel.showPanel(0);
        this.fpsPanel.dom.style.cssText = 'position:relative;';
        container.appendChild(this.fpsPanel.dom);
        
        this.trianglesContainer = document.createElement('div');
        this.trianglesContainer.style.cssText = 'position:relative;width:80px;height:48px;cursor:pointer;opacity:0.9;background-color:rgba(0,0,0,0.7);';
        
        const triangleCanvas = document.createElement('canvas');
        triangleCanvas.width = 74;
        triangleCanvas.height = 30;
        triangleCanvas.style.cssText = 'width:74px;height:30px;top:0px;left:3px;position:absolute;';
        this.trianglesContainer.appendChild(triangleCanvas);
        
        this.triangleCtx = triangleCanvas.getContext('2d');
        this.triangleCtx.fillStyle = 'rgb(0,0,0)';
        this.triangleCtx.fillRect(0, 0, 74, 30);
        
        const triangleText = document.createElement('div');
        triangleText.style.cssText = 'color:#fff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px;position:absolute;top:33px;width:74px;left:3px;text-align:center;';
        triangleText.textContent = 'TRIANGLES';
        this.trianglesContainer.appendChild(triangleText);
        
        this.triangleValueText = document.createElement('div');
        this.triangleValueText.style.cssText = 'color:#000;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px;position:absolute;top:1px;width:74px;left:3px;text-align:right;';
        this.trianglesContainer.appendChild(this.triangleValueText);
        
        container.appendChild(this.trianglesContainer);
        
        this.callsContainer = document.createElement('div');
        this.callsContainer.style.cssText = 'position:relative;width:80px;height:48px;cursor:pointer;opacity:0.9;background-color:rgba(0,0,0,0.7);';
        
        const callsCanvas = document.createElement('canvas');
        callsCanvas.width = 74;
        callsCanvas.height = 30;
        callsCanvas.style.cssText = 'width:74px;height:30px;top:0px;left:3px;position:absolute;';
        this.callsContainer.appendChild(callsCanvas);
        
        this.callsCtx = callsCanvas.getContext('2d');
        this.callsCtx.fillStyle = 'rgb(0,0,0)';
        this.callsCtx.fillRect(0, 0, 74, 30);
        
        const callsText = document.createElement('div');
        callsText.style.cssText = 'color:#f08;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px;position:absolute;top:33px;width:74px;left:3px;text-align:center;';
        callsText.textContent = 'CALLS';
        this.callsContainer.appendChild(callsText);
        
        this.callsValueText = document.createElement('div');
        this.callsValueText.style.cssText = 'color:#fff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px;position:absolute;top:1px;width:74px;left:3px;text-align:right;';
        this.callsContainer.appendChild(this.callsValueText);
        
        container.appendChild(this.callsContainer);
        
        this.triangleValues = [];
        this.callsValues = [];
        for (let i = 0; i < 74; i++) {
            this.triangleValues.push(0);
            this.callsValues.push(0);
        }
    }

    initPysicsFolder() {
        if (!this.app.physicsManager) return

        const controlsFolder = this.gui.addFolder('Player Controls')
        controlsFolder.add(this.app.physicsManager.controls, 'enabled', true).name('Enabled')
        controlsFolder.add(this.app.physicsManager.controls, 'smoothWalk', true).name('Smooth Walk')
        controlsFolder.add(this.app.physicsManager.controls, 'speed', 0, 10).name('Speed')
        controlsFolder.add(this.app.physicsManager.controls, 'flyMode', true).name('Fly Mode').onChange((value) => {
            this.app.physicsManager.controls.setFlyMode(value)
        })
    }

    initCameraFolder() {
        if (!this.app.camera) return 
        const museum = this.app.objectManager.get("Museum")

        const cameraFolder = this.gui.addFolder('Camera')
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
    }

    initDebugFolder() {
        const debugFolder = this.gui.addFolder('Debug')
        debugFolder.add({
            showLightsHelper: () => {
                this.toogleLightsHelpers()
            }
        }, 'showLightsHelper').name('Toogle light helpers')
        debugFolder.add({
            showAllAnimationClipsLines: () => {
                this.toogleAllAnimationClipsLines()
            }
        }, 'showAllAnimationClipsLines').name('Toogle animations cliplines & texts')
        debugFolder.add({
            showCameraHelpers: () => {
                this.toogleCameraHelpers()
            }
        }, 'showCameraHelpers').name('Toogle camera helpers')
        debugFolder.add({
            showSpeakersHelpers: () => {
                this.toogleSpeakersHelpers()
            }
        }, 'showSpeakersHelpers').name('Toogle speakers helpers')
        debugFolder.add({
            showCollisionsHelpers: () => {
                this.toogleCollisionsHelpers()
            }
        }, 'showCollisionsHelpers').name('Toogle collisions helpers')
        debugFolder.add({
            showBoidShperesHelpers: () => {
                this.toogleBoidSpheressHelpers()
            }
        }, 'showBoidShperesHelpers').name('Toogle boids helpers')
        debugFolder.add({
            toogleAllHelpers: () => {
                this.toogleAllHelpers()
            }
        }, 'toogleAllHelpers').name('TOOGLE ALL HELPERS')
    }

    initShortcutsFolder() {
        const museum = this.app.objectManager.get("Museum")
        window.addEventListener('keydown', (event) => {
            event.preventDefault()

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
            if (event.key === 'm') {
                this.app.physicsManager.controls.setFlyMode(!this.app.physicsManager.controls.flyMode)
            }

            if(event.key === 'y'){
                this.app.choicesManager.showChoices(
                    {
                        choice1: "Voir la vidéo",
                        choice2: "Écouter le son"
                    },
                    (choiceIndex) => {
                        if (choiceIndex === 1) {
                            this.app.mediaManager.playMediaWithGlitch('error1')
                        } else {
                            this.app.soundManager.playSoundOnSpeakers('voiceLine 1', 'audio/voices/voice_test.m4a', {
                                volume: 0.8,
                                loop: false,
                                maxDistance: 8,
                                vttSrc: 'audio/subtitles/voice_test.vtt'
                            })
                        }
                    }
                )
            }
        })
    }

    initPostProcessingFolder() {
        if (!this.app.postProcessing) return

        const postProcessingFolder = this.gui.addFolder('Post Processing')
        postProcessingFolder.add(this.app, 'enablePostProcessing', true).name('Enable Post Processing')
        postProcessingFolder.add(this.app.postProcessing.fisheyePass, 'enabled', true).name('Enable Fisheye Pass')
        postProcessingFolder.add(this.app.postProcessing.fisheyePass.uniforms['strength'], 'value', 0.0, 4.0).name('Fisheye Strength')
        postProcessingFolder.add(this.app.postProcessing.bloomPass, 'enabled', true).name('Enable Bloom Pass')
        postProcessingFolder.add(this.app.postProcessing.bloomPass, 'threshold', 0.0, 1.0).name('Threshold')
        postProcessingFolder.add(this.app.postProcessing.bloomPass, 'strength', 0.0, 3.0).name('Strength')
        postProcessingFolder.add(this.app.postProcessing.bloomPass, 'radius', 0.0, 1.0).name('Radius')
        postProcessingFolder.add(this.app.postProcessing, 'triggerGlitch').name('Trigger Glitch')
        postProcessingFolder.add(this.app.postProcessing, 'triggerBigGlitch').name('Trigger Big glitch')
        postProcessingFolder.open()
        postProcessingFolder.close()
    }

    initPopinsFolder() {
        if (!this.app.eventsManager) return

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
        popinsFolder.close()
    }

    initWindowFolder() {
        if (!this.app.eventsManager) return

        const windowFolder = this.gui.addFolder('Window')
        windowFolder.add({
            openWindow: () => {
                this.app.eventsManager.openWindow('http://localhost:5173/confidential-documents')
            }
        }, 'openWindow').name('Ouvrir une nouvelle fenêtre')
        windowFolder.close()
    }

    initTransmissionMaterialFolder() {
        if (!this.app.objectManager.meshTransmissionMaterial) return 

        const transmissionFolder = this.gui.addFolder('Transmission Material')
        const mat = this.app.objectManager.meshTransmissionMaterial

        const defaultParams = {
            thickness: mat.thickness,
            _transmission: mat._transmission,
            roughness: mat.roughness,
            chromaticAberration: mat.chromaticAberration,
            anisotropicBlur: mat.anisotropicBlur,
            color: `#${mat.color.getHexString()}`,
            specularIntensity: mat.specularIntensity,
        }

        const params = { ...defaultParams }

        transmissionFolder.add(params, 'thickness', 0, 5).onChange(value => mat.thickness = value).name('Thickness')
        transmissionFolder.add(params, '_transmission', 0, 1).onChange(value => mat._transmission = value).name('Transmission')
        transmissionFolder.add(params, 'roughness', 0, 1).onChange(value => mat.roughness = value).name('Roughness')
        transmissionFolder.add(params, 'chromaticAberration', 0, 1).onChange(value => mat.chromaticAberration = value).name('Chromatic Aberration')
        transmissionFolder.add(params, 'anisotropicBlur', 0, 1).onChange(value => mat.anisotropicBlur = value).name('Anisotropic Blur')
        transmissionFolder.add(params, 'specularIntensity', 0, 1).onChange(value => mat.specularIntensity = value).name('Specular Intensity')
        
        transmissionFolder.addColor(params, 'color').onChange((value) => {
            mat.color.set(value)
        })

        transmissionFolder.add({
            reset: () => {
                Object.assign(params, defaultParams)
                mat.thickness = defaultParams.thickness
                mat._transmission = defaultParams._transmission
                mat.roughness = defaultParams.roughness
                mat.chromaticAberration = defaultParams.chromaticAberration
                mat.anisotropicBlur = defaultParams.anisotropicBlur
                mat.color.set(defaultParams.color)
                mat.specularIntensity = defaultParams.specularIntensity

                for (let controller of transmissionFolder.controllers) {
                    controller.updateDisplay()
                }
            }
        }, 'reset').name('Reset Parameters')
    
        transmissionFolder.close()
    }

    initCausticMaterialFolder() {
        const causticFolder = this.gui.addFolder('Caustic Materials')
        const causticMaterials = []
        this.app.scene.traverse((child) => {
            if (child.isMesh && child.material?.uniforms?.causticsMap) {
                causticMaterials.push(child)
            }
        })
        if (causticMaterials.length > 0) {
            const mat = causticMaterials[0].material
            const causticParams = {
                metalness: mat.metalness,
                roughness: mat.roughness,
                scale: mat.uniforms.scale.value,
                intensity: mat.uniforms.intensity.value,
                causticTint: `#${mat.uniforms.causticTint.value.getHexString()}`,
                fogColor: `#${mat.uniforms.fogColor.value.getHexString()}`,
                fogNear: mat.uniforms.fogNear.value,
                fogFar: mat.uniforms.fogFar.value
            }
            causticFolder.add(causticParams, 'metalness', 0, 1).onChange(value => {
                causticMaterials.forEach(obj => obj.material.metalness = value)
            })
            causticFolder.add(causticParams, 'roughness', 0, 1).onChange(value => {
                causticMaterials.forEach(obj => obj.material.roughness = value)
            })
            causticFolder.add(causticParams, 'scale', 0, 0.2).onChange(value => {
                causticMaterials.forEach(obj => obj.material.uniforms.scale.value = value)
            })
            causticFolder.add(causticParams, 'intensity', 0, 1).onChange(value => {
                causticMaterials.forEach(obj => obj.material.uniforms.intensity.value = value)
            })
            causticFolder.addColor(causticParams, 'causticTint').onChange(value => {
                causticMaterials.forEach(obj => obj.material.uniforms.causticTint.value.set(value))
            })
            causticFolder.addColor(causticParams, 'fogColor').onChange(value => {
                causticMaterials.forEach(obj => obj.material.uniforms.fogColor.value.set(value))
            })
            causticFolder.add(causticParams, 'fogNear', 0, 100).onChange(value => {
                causticMaterials.forEach(obj => obj.material.uniforms.fogNear.value = value)
            })
            causticFolder.add(causticParams, 'fogFar', 0, 200).onChange(value => {
                causticMaterials.forEach(obj => obj.material.uniforms.fogFar.value = value)
            })
            const defaultParams = JSON.parse(JSON.stringify(causticParams))
            causticFolder.add({
                reset: () => {
                    Object.assign(causticParams, defaultParams)
                    causticMaterials.forEach(obj => {
                        obj.material.metalness = defaultParams.metalness
                        obj.material.roughness = defaultParams.roughness
                        obj.material.uniforms.scale.value = defaultParams.scale
                        obj.material.uniforms.intensity.value = defaultParams.intensity
                        obj.material.uniforms.causticTint.value.set(defaultParams.causticTint)
                        obj.material.uniforms.fogColor.value.set(defaultParams.fogColor)
                        obj.material.uniforms.fogNear.value = defaultParams.fogNear
                        obj.material.uniforms.fogFar.value = defaultParams.fogFar
                    })

                    for (let controller of causticFolder.controllers) {
                        controller.updateDisplay()
                    }
                }
            }, 'reset').name('Reset Parameters')

        }
        causticFolder.close()
    }

    initSoundPlayerFolder() {
        if (!this.app.soundManager) return

        const soundPlayerFolder = this.gui.addFolder('Sound Player')
        soundPlayerFolder.add({
            playSoundOnSpeakers: () => {
                this.app.soundManager.playSoundOnSpeakers('voiceLine 1', 'audio/voices/1-INTRO.mp3', {
                    volume: 3,
                    loop: false,
                    maxDistance: 8,
                    vttSrc: 'audio/subtitles/PADG_INTRO_1.vtt'
                })
            }
        }, 'playSoundOnSpeakers').name('Play Sound 1 on speakers')
        soundPlayerFolder.add({
            playSoundOnSpeakers: () => {
                this.app.soundManager.playSoundOnSpeakers('voiceLine 1', 'audio/voices/1-INTRO.mp3', {
                    volume: 3,
                    loop: false,
                    maxDistance: 8,
                    vttSrc: 'audio/subtitles/PADG_INTRO_1.vtt'
                })
            }
        }, 'playSoundOnSpeakers').name('Play Sound 2 on speakers')
        soundPlayerFolder.add(this.app.soundManager, 'stopAll').name('Stop All Sounds')
        soundPlayerFolder.close()
    }

    initMediaPlayerFolder() {
        if (!this.app.mediaManager) return

        const videoFolder = this.gui.addFolder('Video')
        videoFolder.add({
            playSmallVideo: () => {
                this.app.mediaManager.playMediaWithGlitch('error1')
            }
        }, 'playSmallVideo').name('Petite vidéo')

        videoFolder.add({
            playBigVideo: () => {
                this.app.mediaManager.playMediaWithGlitch('bigvideo')
            }
        }, 'playBigVideo').name('Grosse vidéo')

        videoFolder.add({
            playConnexionVideo: () => {
                this.app.mediaManager.playMediaWithGlitch('connexion')
            }
        }, 'playConnexionVideo').name('Vidéo connexion')

        const choicesFolder = this.gui.addFolder('Choices')
        choicesFolder.add({
            showChoice1: () => {
                this.app.choicesManager.showChoices(
                    {
                        choice1: "Option A",
                        choice2: "Option B"
                    },
                    (choiceIndex) => {
                        if (choiceIndex === 1) {
                            this.app.eventsManager.displayAlert("Vous avez choisi l'option A", 'information')

                            this.app.mediaManager.playMediaWithGlitch('error1')
                        } else {
                            this.app.eventsManager.displayAlert("Vous avez choisi l'option B", 'information')

                            this.app.soundManager.playSoundOnSpeakers('voiceLine 1', 'audio/voices/1-INTRO.mp3', {
                                volume: 3,
                                loop: false,
                                maxDistance: 8,
                                vttSrc: 'audio/subtitles/PADG_INTRO_1.vtt'
                            })
                        }
                    }
                )
            }
        }, 'showChoice1').name('Afficher choix 1')
        choicesFolder.close()
        videoFolder.close()
    }

    initBoidsFolder() {
        if (!this.app.objectManager.boidManagers || this.app.objectManager.boidManagers.length === 0) return
    
        const boidsFolder = this.gui.addFolder('Boids')
    
        const firstBoid = this.app.objectManager.boidManagers[0].boids[0]
    
        const params = {
            minSpeed: firstBoid.minSpeed,
            maxSpeed: firstBoid.maxSpeed,
            numSamplesForSmoothing: firstBoid.numSamplesForSmoothing,
            cohesionWeight: firstBoid.cohesionWeight,
            separationWeight: firstBoid.separationWeight,
            alignmentWeight: firstBoid.alignmentWeight,
            visionRange: firstBoid.visionRange
        }
    
        boidsFolder.add(params, 'minSpeed', 0.001, 0.2).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.minSpeed = v)
            )
        })
    
        boidsFolder.add(params, 'maxSpeed', 0.001, 0.2).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.maxSpeed = v)
            )
        })
    
        boidsFolder.add(params, 'numSamplesForSmoothing', 0, 20, 1).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.numSamplesForSmoothing = v)
            )
        })
    
        boidsFolder.add(params, 'cohesionWeight', 0, 2).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.cohesionWeight = v)
            )
        })
    
        boidsFolder.add(params, 'separationWeight', 0, 2).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.separationWeight = v)
            )
        })
    
        boidsFolder.add(params, 'alignmentWeight', 0, 2).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.alignmentWeight = v)
            )
        })
    
        boidsFolder.add(params, 'visionRange', 0.1, 5).onChange((v) => {
            this.app.objectManager.boidManagers.forEach(manager =>
                manager.boids.forEach(b => b.visionRange = v)
            )
        })
    
        boidsFolder.close()

        const doorsFolder = this.gui.addFolder('Doors')

        doorsFolder.add({
            openDoor: () => {
                this.app.doorManager.triggerOpenDoorByIndex(0)
            }
        }, 'openDoor').name('Ouvrir la porte')
        doorsFolder.add({
            closeDoor: () => {
                this.app.doorManager.triggerCloseDoorByIndex(0)
            }
        }, 'closeDoor').name('Fermer la porte') 

        doorsFolder.close()
    }
    
    displayLightsHelpers() {
        if (!this.active) return
        
        this.app.scene.traverse((child) => {
            if (child.isLight) {
                const helper = new PointLightHelper(child, 0.5)
                helper.name = `light-helper-${child.name}`
                this.app.scene.add(helper)
                this.lightHelpers.push(helper)
            } 
        })
    }

    toogleLightsHelpers() {
        this.lightHelpers.forEach((helper) => {
            helper.visible = !helper.visible
        })
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
            const color = new Color(Math.random(), Math.random(), Math.random())
            const material = new LineBasicMaterial({ color })
            const line = new Line(geometry, material)
    
            this.app.scene.add(line)
            this.animationsClipsLines.push(line)
    
            const label = this.createTextLabel(clip.name, positions[0])
            this.animationsTextLabels.push(label)
            this.app.scene.add(label)
        })
    }

    toogleAllAnimationClipsLines() {
        if (!this.active) return

        this.animationsClipsLines.forEach((clipline) => {
            clipline.visible = !clipline.visible
        })

        this.animationsTextLabels.forEach((label) => {
            label.visible = !label.visible
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

    toogleCameraHelpers() {
        this.cameraHelpers.forEach(({ camera, helper }) => {
            helper.visible = !helper.visible
        })
    }

    createSpeakerHelper(object, scene = this.app.scene, position = null){
        if (!this.active) return 
        
        const sphere = new Mesh(
            new SphereGeometry(0.2, 16, 16),
            new MeshBasicMaterial({ color: 0xffffff })
        )
        let pos = position ? position : object.position
        sphere.position.copy(pos)
        
        const direction = new Vector3(0, 0, 1)
        direction.applyQuaternion(object.quaternion)
        const arrow = new ArrowHelper(direction, pos, 1, 0x00ff00)
        scene.add(sphere)
        scene.add(arrow)
        this.speakersHelpers.push({ sphere, arrow })
    }

    toogleSpeakersHelpers() {
        this.speakersHelpers.forEach(({ sphere, arrow }) => {
            sphere.visible = !sphere.visible
            arrow.visible = !arrow.visible
        })
    }

    toogleCollisionsHelpers() {
        this.app.objectManager.collisionWireframes.forEach((mesh) => {
            mesh.visible = !mesh.visible
        })
    }

    toogleBoidSpheressHelpers() {
        this.app.objectManager.boidSpheres.forEach((mesh) => {
            mesh.visible = !mesh.visible
        })
    }

    toogleAllHelpers(){
        this.toogleLightsHelpers()
        this.toogleAllAnimationClipsLines()
        this.toogleCameraHelpers()
        this.toogleSpeakersHelpers()
        this.toogleCollisionsHelpers()
        this.toogleBoidSpheressHelpers()
    }

    update() {
        if (this.active) {
            this.cameraHelpers.forEach(({ camera, helper }) => {
                camera.updateMatrixWorld(true);
                helper.position.copy(camera.getWorldPosition(new Vector3()));
                helper.quaternion.copy(camera.getWorldQuaternion(new Quaternion()));
            });
        }

        if(this.statsActive) {
            if (this.fpsPanel) {
                this.fpsPanel.update();
            }
            
            if (this.app.renderer && this.app.renderer.instance) {
                const renderer = this.app.renderer.instance;
                
                const triangleCount = renderer.info.render.triangles;
                const callsCount = renderer.info.render.calls;
                
                if (this.triangleCtx && this.triangleValueText) {
                    this.triangleValues.shift();
                    this.triangleValues.push(triangleCount);
                    
                    this.triangleValueText.textContent = triangleCount;
                    
                    this.triangleCtx.fillStyle = 'rgb(0,0,0)';
                    this.triangleCtx.fillRect(0, 0, 74, 30);
                    this.triangleCtx.fillStyle = 'rgb(0,255,255)';
                    
                    const maxTriangles = Math.max(...this.triangleValues, 100000);
                    for (let i = 0; i < this.triangleValues.length; i++) {
                        const h = Math.min(30, 30 * (this.triangleValues[i] / maxTriangles));
                        this.triangleCtx.fillRect(i, 30 - h, 1, h);
                    }
                }
                
                if (this.callsCtx && this.callsValueText) {
                    this.callsValues.shift();
                    this.callsValues.push(callsCount);
                    
                    this.callsValueText.textContent = callsCount;
                    
                    this.callsCtx.fillStyle = 'rgb(0,0,0)';
                    this.callsCtx.fillRect(0, 0, 74, 30);
                    this.callsCtx.fillStyle = 'rgb(255,0,128)';
                    
                    const maxCalls = Math.max(...this.callsValues, 1000);
                    for (let i = 0; i < this.callsValues.length; i++) {
                        const h = Math.min(30, 30 * (this.callsValues[i] / maxCalls));
                        this.callsCtx.fillRect(i, 30 - h, 1, h);
                    }
                }
            }
        }

        if(this.positionDisplayActive && this.positionDisplay) {
            this.updatePositionDisplay();
        }
    }

    destroy() {
        if (this.gui) {
            this.gui.destroy()
            this.gui = null
        }

        if (this.positionDisplay) {
            document.body.removeChild(this.positionDisplay)
            this.positionDisplay = null
        }

        if (this.fpsPanel && this.fpsPanel.dom && this.fpsPanel.dom.parentNode) {
            this.fpsPanel.dom.parentNode.removeChild(this.fpsPanel.dom)
        }

        if (this.trianglesContainer && this.trianglesContainer.parentNode) {
            this.trianglesContainer.parentNode.removeChild(this.trianglesContainer)
        }

        if (this.callsContainer && this.callsContainer.parentNode) {
            this.callsContainer.parentNode.removeChild(this.callsContainer)
        }

        this.app = null    
    }
}