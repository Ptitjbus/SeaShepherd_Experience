import * as THREE from "three"
import App from "../../App"
import { CausticShader } from '../../Shaders/CausticShader.js'
import { BlackWhiteShader } from '../../Shaders/BlackWhiteShader.js'

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
                    child.material.side = THREE.FrontSide
                    if (applyCaustics && child.material && child.material.map && (child.name.toLowerCase().includes('rock') || child.name.toLowerCase().includes('sand'))) {
                        child.material = this.createCausticShaderMaterial(child.material.map)
                        //  child.material = this.createBlackWhiteShaderMaterial(child)
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

    createBlackWhiteShaderMaterial(child) {
        const baseMapTexture = child.material.map || new THREE.Texture()
    
        return new THREE.ShaderMaterial({
            uniforms: {
                baseMap: { value: baseMapTexture },
                scale: { value: 0.1 }
            },
            vertexShader: BlackWhiteShader.vertexShader,
            fragmentShader: BlackWhiteShader.fragmentShader,
            transparent: false,
            depthWrite: true,
            depthTest: true
        })
    }

    createCausticShaderMaterial(baseMap) {
        const causticsTexture = new THREE.TextureLoader().load('/textures/caustic/caustic_detailled.jpg')
        causticsTexture.wrapS = causticsTexture.wrapT = THREE.RepeatWrapping
      
        const material = new THREE.ShaderMaterial({
          uniforms: {
            baseMap: { value: baseMap },
            causticsMap: { value: causticsTexture },
            time: { value: 0 },
            scale: { value: 0.05 },
            intensity: { value: 0.1 },
            causticTint: { value: new THREE.Color(0.2, 0.5, 1.0) },
            fogColor: { value: new THREE.Color(0x081346) }, // ou n'importe quelle couleur
            fogNear: { value: 5 },
            fogFar: { value: 70 },
            cameraPosition: { value: new THREE.Vector3() }
          },
          vertexShader: CausticShader.vertexShader,
          fragmentShader: CausticShader.fragmentShader,
          transparent: false,
          depthWrite: true,
          depthTest: true
        })
      
        return material
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
          if (object.mixer && object.playAnimations) object.mixer.update(delta)
      
            this.objects.forEach(({ object }) => {
                object.scene.traverse((child) => {
                    if (child.isMesh && child.material?.uniforms?.cameraPosition) {
                        child.material.uniforms.cameraPosition.value.copy(this.app.camera.mainCamera.position)
                        child.material.uniforms.time.value += delta * 0.4
                    }
                })
            })
            
        })
      }

    destroy() {
        this.objects.forEach(({ object }) => {
            this.scene.remove(object)
        })
        this.objects.clear()
    }
}
