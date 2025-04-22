import { FrontSide, AnimationMixer, Object3D } from "three";
import App from "../App";

export default class ObjectManager {
    constructor() {
        this.objects = new Map();
        this.app = new App();
    }

    /**
     * Ajoute un modèle 3D à la scène avec options et retourne l'objet (shadows, material, etc.)
     * @param {String} name - Nom de l'objet
     * @param {Object3D} object - L'objet 3D à instancier (peut être une scene de glTF)
     * @param {Vector3} position - Position de l'objet
     * @param {Object} options
     * @returns {Object | undefined}
     *    material: Material (optionnel)
     *    castShadow: Boolean
     *    receiveShadow: Boolean
     */
    add(name, position, options = {}) {
        const object = this.app.assetManager.getItem(name)
        const { material, castShadow = true, receiveShadow = true } = options

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
            if (child.isMesh && child.material) {
                child.material.side = FrontSide;
            }
            if (child.isMesh && material) {
                child.material = material
                child.castShadow = castShadow
                child.receiveShadow = receiveShadow
            }
        })
        
        mixer = new AnimationMixer(object.scene)
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
        this.objects.set(name, storedObject);
        return storedObject
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
     * @param {Object3D} object
     * @param {String} name
     * @returns {Object | undefined}
     */
    getItemFromObject(object, name){
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
        })
    }

    destroy() {
        this.objects.forEach(({ object }) => {
            this.scene.remove(object)
        })
        this.objects.clear()
    }
}
