import * as THREE from "three"
import App from "../../App"
import { CausticShader } from '../../Shaders/CausticShader.js'
import { BlackWhiteShader } from '../../Shaders/BlackWhiteShader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { MeshTransmissionMaterial, useFBO } from "@pmndrs/vanilla"
import { disposeMaterial, disposeObject } from "../../Utils/Memory.js"

export default class ObjectManager {
    constructor() {
        this.objects = new Map()
        this.app = new App()

        this.meshTransmissionMaterial = new MeshTransmissionMaterial({
            _transmission: 1,
            thickness: 0.5,
            roughness: 0,
            chromaticAberration: 0.05,
            anisotropicBlur: 0.1,
            distortion: 0,
            distortionScale: 0.5,
            temporalDistortion: 0.0,
            side: THREE.FrontSide,
        })
        this.meshTransmissionMaterial.specularIntensity = 0.05
        this.meshTransmissionMaterial.color = new THREE.Color(0x9ec1f0)
        this.meshTransmissionMaterial.envMap = this.app.environment.envMap

        this.causticsTexture = new THREE.TextureLoader().load('/textures/caustic/caustic_detailled.jpg')
        this.causticsTexture.wrapS = this.causticsTexture.wrapT = THREE.RepeatWrapping

        this.transmissionMeshes = []
        this.fboMain = useFBO(1024, 1024)
    }

    /**
     * Ajoute un modèle 3D à la scène avec options et retourne l'objet (shadows, material, etc.)
     * @param {String} name - Nom de l'objet
     * @param {THREE.Object3D} object - L'objet 3D à instancier (peut être une scene de glTF)
     * @param {Vector3} position - Position de l'objet
     * @param {Object} options
     * @returns {Object | undefined}
     *    material: Material (optionnel)
     *    castShadow: Boolean
     *    receiveShadow: Boolean
     */
    add(name, position, options = {}) {
        const object = this.app.assetManager.getItem(name)
        const {
            material= null,
            castShadow = true,
            receiveShadow = true,
            applyCaustics = false
        } = options
    
        const cameras = []
        let mixer = null
    
        if (position) {
            object.scene.position.set(position.x, position.y, position.z)
        }
    
        object.scene.traverse((child) => {
            if (child.isCamera) {
                this.app.camera.allCameras.push(child)
                cameras.push(child)
            }
    
            if (child.isMesh) {
                if (child.material) {
                    if (applyCaustics && child.material && child.material.map && (child.name.toLowerCase().includes('rock') || child.name.toLowerCase().includes('sand'))) {
                        const baseMap = child.material.map
                        disposeMaterial(child.material)
                        child.material = this.createCustomShaderMaterial(baseMap)
                    }

                    if (child.name.toLowerCase().includes('verre')) {
                        disposeMaterial(child.material)
                        child.material = this.meshTransmissionMaterial
                        child.castShadow = true
                        child.receiveShadow = true
                        child.material.buffer = this.fboMain.texture
                        this.transmissionMeshes.push(child)
                    }
                }
    
                if (material) {
                    child.material = material
                    child.castShadow = castShadow
                    child.receiveShadow = receiveShadow
                }
            }
        })
    
        mixer = new THREE.AnimationMixer(object.scene)
        object.animations.forEach((clip) => {
            mixer.clipAction(clip).play()
        })
    
        this.app.scene.add(object.scene)
    
        const storedObject = {
            playAnimations: true,
            object,
            mixer,
            cameras,
            animations: object.animations ? object.animations : [],
        }
    
        this.objects.set(name, storedObject)
        return storedObject
    }

    addPointLight(position, color = 0xffffff, intensity = 1.0, distance = 100, decay = 2) {
        const light = new THREE.PointLight(color, intensity, distance, decay)
        light.position.set(position.x, position.y, position.z)
        light.castShadow = true
        light.shadow.mapSize.width = 512
        light.shadow.mapSize.height = 512
        light.shadow.camera.near = 0.5
        light.shadow.camera.far = 50
        this.app.scene.add(light)
        return light
    }

    createCustomShaderMaterial(baseMap){
        return new CustomShaderMaterial({
            baseMaterial: THREE.MeshPhysicalMaterial,
            metalness: 0,
            roughness: 0.7,
            uniforms: {
                baseMap: { value: baseMap },
                causticsMap: { value: this.causticsTexture },
                time: { value: 0 },
                scale: { value: 0.05 },
                intensity: { value: 0.5 },
                causticTint: { value: new THREE.Color(0.2, 0.5, 1.0) },
                fogColor: { value: new THREE.Color(0x081346) },
                fogNear: { value: 5 },
                fogFar: { value: 70 },
                cameraPos: { value: this.app.camera.mainCamera.position },
            },
            vertexShader: CausticShader.vertexShader,
            fragmentShader: CausticShader.fragmentShader,

        })
    }
    

    /**
     * Récupère les données d'un objet (object3D, mixer, cameras)
     * @param {String} name
     * @returns {Object | undefined}
     */
    get(name) {
        return this.objects.get(name)
    }

    /**
     * Récupère un enfant d'un objet et le renvoie (object3D, name)
     * @param {THREE.Object3D} object
     * @param {String} name
     * @returns {Object | undefined}
     */
    getItemFromObject(name, object = this.app.scene ){
        let found = null
        object.traverse((child) => {
            if (child.name === name) {
                found = child
            }
        })
        return found
    }

    update(time) {
        this.meshTransmissionMaterial.time = time * 0.001
        this.objects.forEach((object) => {
            // Mise à jour des animations (GLTF)
            if (object.mixer && object.playAnimations) {
                object.mixer.update(time.delta)
            }
    
            // Mise à jour des shaders
            object.object.scene.traverse((child) => {
                if (child.isMesh && child.material?.uniforms?.cameraPos) {
                    child.material.uniforms.cameraPos.value.copy(this.app.camera.mainCamera.position)
                    child.material.uniforms.time.value += time.delta * 0.4
                }
            })
        })
        if (this.transmissionMeshes.length > 0 && this.meshTransmissionMaterial.buffer === this.fboMain.texture) {
            this.app.renderer.instance.toneMapping = THREE.NoToneMapping
            this.app.renderer.instance.setRenderTarget(this.fboMain)
            this.app.renderer.instance.render(this.app.scene, this.app.camera.mainCamera)
        }
    }
    

    destroy() {
        this.objects.forEach(({ object }) => {
            disposeObject(object.scene)
            this.app.scene.remove(object.scene)
            object.mixer.stopAllAction();
            object.mixer.uncacheRoot(object.scene);
            object.mixer.uncacheClip(clip);
        })
        this.objects.clear()
    }
}
