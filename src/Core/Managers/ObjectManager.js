import * as THREE from "three"
import App from "../../App"
import { CausticShader } from '../../Shaders/CausticShader.js'
import { BlackWhiteShader } from '../../Shaders/BlackWhiteShader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

export default class ObjectManager {
    constructor() {
        this.objects = new Map()
        this.app = new App()
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
            material,
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
                        // child.material.dispose()
                        // TODO : dispose toutes les textures du material s'il y en a (méthode d'itération)
                        child.material = this.createCustomShaderMaterial(baseMap)
                        // activer le renderer
                    }
                }

                if (child.name.toLowerCase().includes('verre')) {
                    // changement de material
                    child.material = new THREE.MeshPhysicalMaterial({
                        envMap: this.app.environment.envMap,
                        transmission: 1, // transmission rend le matériau transparent comme du verre
                        thickness: 2.0, // épaisseur simulée pour la réfraction
                        roughness: 0.05,
                        metalness: 0,
                        clearcoat: 0.05,
                        clearcoatRoughness: 0,
                        ior: 1.2, // index de réfraction
                        specularIntensity: 0.1, // intensité de la réflexion spéculaire
                        specularColor: new THREE.Color(0.4, 0.4, 1),
                        color: new THREE.Color( 0x9ec1f0 ), // couleur blanche
                        side: THREE.FrontSide // en option selon tes besoins
                    })
                    child.castShadow = true
                    child.receiveShadow = true
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
        const causticsTexture = new THREE.TextureLoader().load('/textures/caustic/caustic_detailled.jpg')
        causticsTexture.wrapS = causticsTexture.wrapT = THREE.RepeatWrapping

        return new CustomShaderMaterial({
            baseMaterial: THREE.MeshPhysicalMaterial,
            metalness: 0,
            roughness: 0.7,
            uniforms: {
                baseMap: { value: baseMap },
                causticsMap: { value: causticsTexture },
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

    update(delta) {
        this.objects.forEach((object) => {
            // Mise à jour des animations (GLTF)
            if (object.mixer && object.playAnimations) {
                object.mixer.update(delta)
            }
    
            // Mise à jour des shaders
            object.object.scene.traverse((child) => {
                if (child.isMesh && child.material?.uniforms?.cameraPos) {
                    child.material.uniforms.cameraPos.value.copy(this.app.camera.mainCamera.position)
                    child.material.uniforms.time.value += delta * 0.4
                }
            })
        })
    }
    

    destroy() {
        this.objects.forEach(({ object }) => {
            // TODO : libérer mieux la référence
            this.scene.remove(object)
        })
        this.objects.clear()
    }
}
