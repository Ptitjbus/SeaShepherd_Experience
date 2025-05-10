import * as THREE from "three"
import App from "../../App"
import { CausticShader } from '../../Shaders/CausticShader.js'
import { LayerShader } from "../../Shaders/LayerShader.js"
import { BlackWhiteShader } from '../../Shaders/BlackWhiteShader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { MeshTransmissionMaterial, useFBO } from "@pmndrs/vanilla"
import { disposeMaterial, disposeObject } from "../../Utils/Memory.js"
import * as CANNON from 'cannon-es'
import BoidManager from "./BoidManager.js"

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
        this.meshTransmissionMaterial.color = new THREE.Color(0x4175b9)
        // this.meshTransmissionMaterial.envMap = this.app.environment.envMap

        this.causticsTexture = new THREE.TextureLoader().load('/textures/caustic/caustic_detailled.jpg')
        this.causticsTexture.wrapS = this.causticsTexture.wrapT = THREE.RepeatWrapping

        this.transmissionMeshes = []
        this.fboMain = useFBO(1024, 1024)

        this.shaderMeshes = []

        this.bodies = []
        this.collisionWireframes = []

        this.obstacles = []

        this.boidManagers = []
        this.boidSpheres = []
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
                if (child.userData.collide) {
                    const body = this.createTrimeshBodyFromMesh(child)
                    this.app.physicsManager.world.addBody(body)
                    this.bodies.push(body)
                    if (this.app.debug.active) {
                        this.createTrimeshWireframe(body)
                    }
                }
                if (child.material) {
                    if (child.userData.with_caustic) {
                        const baseMap = child.material.map
                        disposeMaterial(child.material)
                        child.material = this.createCustomShaderMaterial(baseMap)
                        this.shaderMeshes.push(child)
                    }

                    if (child.name.toLowerCase().includes('verre')) {
                        disposeMaterial(child.material)
                        child.material = this.meshTransmissionMaterial
                        child.material.buffer = this.fboMain.texture
                        this.transmissionMeshes.push(child)
                    }

                    if (child.material.name.toLowerCase().includes("algue")) {
                        const material = this.createShadeDeformationrMaterial(child.material.map)
                        material.name = child.material.name
                        child.material = material
                        this.shaderMeshes.push(child)
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

    createTrimeshWireframe(body) {
        body.shapes.forEach((shape, index) => {
            if (!(shape instanceof CANNON.Trimesh)) return
      
            const geom = new THREE.BufferGeometry()
      
            // Convert cannon-es vertices and indices to Three.js format
            const vertices = []
            for (let i = 0; i < shape.indices.length; i++) {
                const idx = shape.indices[i]
                const getSafe = (array, index) => {
                    const val = array[index]
                    return Number.isFinite(val) ? val : 0
                }
                
                const x = getSafe(shape.vertices, idx * 3)
                const y = getSafe(shape.vertices, idx * 3 + 1)
                const z = getSafe(shape.vertices, idx * 3 + 2)

                vertices.push(x, y, z)
            }

            geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
            geom.computeBoundingSphere()

            if (!shape.vertices || shape.vertices.length === 0 || !shape.indices || shape.indices.length === 0) {
                console.warn('Wireframe skipped due to empty geometry', body)
                return
            }
      
            // Convert to wireframe
            const wireframe = new THREE.LineSegments(
              new THREE.EdgesGeometry(geom),
              new THREE.LineBasicMaterial({ color: 0xff0000 })
            )
      
            // Position and rotation from body
            const shapeOffset = body.shapeOffsets[index] || new CANNON.Vec3()
            const shapeOrientation = body.shapeOrientations[index] || new CANNON.Quaternion()
      
            const shapeOffsetTHREE = new THREE.Vector3(shapeOffset.x, shapeOffset.y, shapeOffset.z)
            const shapeQuatTHREE = new THREE.Quaternion(shapeOrientation.x, shapeOrientation.y, shapeOrientation.z, shapeOrientation.w)
      
            const bodyQuatTHREE = new THREE.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
            const bodyPosTHREE = new THREE.Vector3(body.position.x, body.position.y, body.position.z)
      
            wireframe.quaternion.copy(bodyQuatTHREE).multiply(shapeQuatTHREE)
            wireframe.position.copy(bodyPosTHREE).add(shapeOffsetTHREE)

            
            this.app.scene.add(wireframe)
            this.collisionWireframes.push(wireframe)
        })
    }
    
    createTrimeshBodyFromMesh(mesh, mass = 0) {
        const geometry = mesh.geometry.clone()

        if (!geometry || !geometry.attributes.position) {
            console.warn('Mesh geometry is empty or invalid:', mesh.name)
            return null
        }

        // Appliquer la transformation complète du mesh à la géométrie
        mesh.updateMatrixWorld()
        geometry.applyMatrix4(mesh.matrixWorld)

        const vertices = geometry.attributes.position.array
        const indices = geometry.index ? geometry.index.array : [...Array(vertices.length / 3).keys()]

        const verts = []
        for (let i = 0; i < vertices.length; i++) {
            verts.push(vertices[i])
        }

        const tris = []
        for (let i = 0; i < indices.length; i += 3) {
            tris.push(indices[i], indices[i + 1], indices[i + 2])
        }

        const shape = new CANNON.Trimesh(verts, tris)
        const body = new CANNON.Body({ mass })
        body.addShape(shape)
        body.allowSleep = true
        body.sleepSpeedLimit = 0.1
        body.sleepTimeLimit = 1.0

        return body
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
                cameraPos: { value: this.app.physicsManager.sphereBody.position },
            },
            vertexShader: CausticShader.vertexShader,
            fragmentShader: CausticShader.fragmentShader,
        })
    }

    createShadeDeformationrMaterial(baseMap){
        const uDisplacementTexture = new THREE.TextureLoader().load('/textures/shader/displacment-map.jpg');
        uDisplacementTexture.wrapS = THREE.RepeatWrapping;
        uDisplacementTexture.wrapT = THREE.RepeatWrapping;
        uDisplacementTexture.minFilter = THREE.LinearFilter;
        uDisplacementTexture.magFilter = THREE.LinearFilter;

        const material = new THREE.ShaderMaterial({
            uniforms: {
              uTexture: { value: baseMap },
              uDisplacement: { value: uDisplacementTexture },
              uStrength: { value: 0.4 },
              time: { value: 0 },
            },
            vertexShader: LayerShader.vertexShader,
            fragmentShader: LayerShader.fragmentShader,
            transparent: true,
          });
          return material
    }

    addBoids(ammount, radius, position) {
        const boidManager = new BoidManager(this.app.scene, ammount, this.obstacles, radius, position)

        if (this.app.debug.active){
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32)
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
            sphere.position.set(position.x, position.y + radius, position.z) 
    
            this.app.scene.add(sphere)
            this.boidSpheres.push(sphere)
        }

        boidManager.boids.forEach(boid => {
            this.app.scene.add(boid.mesh)
        })

        this.boidManagers.push(boidManager)
    }

    addPlane(position, size, color = 0xffffff) {
        const geometry = new THREE.PlaneGeometry(size.width, size.height)
        const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
        const plane = new THREE.Mesh(geometry, material)
    
        plane.position.set(position.x, position.y, position.z)
        plane.rotation.x = -Math.PI / 2 // Par défaut, orienter le plan horizontalement

        this.app.scene.add(plane)
        return plane
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

        const targetPos = new THREE.Vector3(
            this.app.physicsManager.sphereBody.position.x,
            this.app.physicsManager.sphereBody.position.y,
            this.app.physicsManager.sphereBody.position.z
        )

        if (this.boidManagers) {
            this.boidManagers.forEach((manager) => {
                manager.update(time.delta)
            })
        }

        this.objects.forEach((object) => {
            // Mise à jour des animations (GLTF)
            if (object.mixer && object.playAnimations) {
                object.mixer.update(time.delta)
            }
    
            // Mise à jour des shaders
            this.shaderMeshes.forEach((child) => {
                if (child.isMesh) {
                    if (child.material?.uniforms?.cameraPos) {
                        child.material.uniforms.cameraPos.value = this.app.physicsManager.sphereBody.position
                    }
    
                    if (child.material?.uniforms?.time) {
                        child.material.uniforms.time.value += time.delta * 0.4
                    }

                    if (child.material?.uniforms?.uTime) {
                        child.material.uniforms.uTime.value += time.delta * 0.4
                    }
    
                    if (child.material.name.toLowerCase().includes("algue")) {
                        const childPos = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld)
    
                        const dx = targetPos.x - childPos.x
                        const dz = targetPos.z - childPos.z
                        const angle = Math.atan2(dx, dz)
    
                        // Appliquer la rotation uniquement sur Y
                        child.rotation.z = -angle
                    }
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
            object.mixer.stopAllAction()
            object.mixer.uncacheRoot(object.scene)
            object.mixer.uncacheClip(clip)
        })
        this.objects.clear()
    }
}
