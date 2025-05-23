import * as THREE from 'three'
import App from '../../App'
import { CausticShader } from '../../Shaders/CausticShader.js'
import { LayerShader } from '../../Shaders/LayerShader.js'
import { BlackWhiteShader } from '../../Shaders/BlackWhiteShader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { MeshTransmissionMaterial, useFBO } from '@pmndrs/vanilla'
import { disposeHierarchy, disposeMaterial, disposeObject } from '../../Utils/Memory.js'
import * as CANNON from 'cannon-es'
import BoidManager from './BoidManager.js'
import { WaterShader } from '../../Shaders/WaterShader.js'
import { PerlinNoise } from '../../Shaders/PerlinNoise.js'

export default class ObjectManager {
    constructor() {
        this.objects = new Map()
        this.app = new App()
        this.clock = new THREE.Clock()

        // Ajout du pool de nombres aléatoires pour l'optimisation
        this._randomPool = new Float32Array(1000)
        this._randomPoolIndex = 0
        for (let i = 0; i < this._randomPool.length; i++) {
            this._randomPool[i] = Math.random() - 0.5
        }

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
        // this.meshTransmissionMaterial.envMap = this.app.environment.envMap algue

        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false,
        })

        this.causticsTexture = new THREE.TextureLoader().load(
            '/textures/caustic/caustic_detailled.jpg'
        )
        this.causticsTexture.wrapS = this.causticsTexture.wrapT =
            THREE.RepeatWrapping

        this.transmissionMeshes = []
        this.fboMain = useFBO(1024, 1024)

        this.shaderMeshes = []

        this.bodies = []
        this.collisionWireframes = []

        this.obstacles = []
        this.triggers = []
        this.triggersWireframes = []

        this.boidManagers = []
        this.boidSpheres = []

        this.waterUniformData = null

        this.clipPlane = new THREE.Plane(new THREE.Vector3(-132, 39, -117), 1);

        this.waterMaterial = this.createShadeWaterMaterial()
        this.waterLevel = 44.0  


        this.rebuildFrameCounter = 0
        this.rebuildFrequency = 1
    }

    /**
     * Obtient un nombre aléatoire pré-calculé du pool
     * @returns {number} Nombre aléatoire entre -0.5 et 0.5
     */
    _getRandomFromPool() {
        const value = this._randomPool[this._randomPoolIndex]
        this._randomPoolIndex = (this._randomPoolIndex + 1) % this._randomPool.length
        return value
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

        if (!object) {
            console.warn(`Object with name "${name}" not found.`)
            return
        }

        const {
            material = null,
            castShadow = true,
            receiveShadow = true,
            playAnimation = true,
            dynamicCollision = false
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
                    

                    if (dynamicCollision) {
                        body.type = CANNON.Body.KINEMATIC
                        body.mass = 0
                        body.updateMassProperties()
                        body.recreateFrom = child
                    }

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
                        child.material =
                            this.createCustomShaderMaterial(baseMap)
                        this.shaderMeshes.push(child)
                    }

                    if (child.userData.is_aquarium_glass) {
                        disposeMaterial(child.material)
                        child.material = this.meshTransmissionMaterial
                        child.material.buffer = this.fboMain.texture
                        this.transmissionMeshes.push(child)
                    }

                    if (child.userData.is_water) {
                        child.material = this.waterMaterial
                        this.shaderMeshes.push(child)
                    }

                    if (
                        child.material.name.toLowerCase().includes("algue") &&
                        child.isInstancedMesh
                    ) {
                        const material = this.createShadeDeformationrMaterial(child.material.map)
                        material.name = child.material.name
                        child.material = material
                        this.shaderMeshes.push(child)
                    }

                    if (child.material.name.toLowerCase().includes("verre") && !child.userData.is_aquarium_glass){
                        disposeMaterial(child.material)
                        child.material = this.glassMaterial
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
        if(playAnimation){
            object.animations.forEach((clip) => {
                mixer.clipAction(clip).play()
            })
        }
    
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

    addPointLight(
        position,
        color = 0xffffff,
        intensity = 1.0,
        distance = 100,
        decay = 2
    ) {
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

    addEventTrigger(position, width, height, depth, callback) {
        const halfExtents = new CANNON.Vec3(width / 2, height / 2, depth / 2)
        const shape = new CANNON.Box(halfExtents)
        const body = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC })
        body.addShape(shape)
        body.position.copy(position)
        body.collisionResponse = false

        this.app.physicsManager.world.addBody(body)

        if (this.app.debug.active) {
            const geometry = new THREE.BoxGeometry(width, height, depth)
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.copy(position)
            this.app.scene.add(mesh)

            this.triggersWireframes.push(mesh)
        }

        this.triggers.push({
            body,
            callback,
            triggered: false,
            halfExtents,
        })
    }

    checkTriggers() {
        const playerPos = this.app.physicsManager.sphereBody.position

        for (const trigger of this.triggers) {
            if (trigger.triggered) continue

            const pos = trigger.body.position
            const half = trigger.halfExtents

            const insideX = playerPos.x >= pos.x - half.x && playerPos.x <= pos.x + half.x
            const insideY = playerPos.y >= pos.y - half.y && playerPos.y <= pos.y + half.y
            const insideZ = playerPos.z >= pos.z - half.z && playerPos.z <= pos.z + half.z

            if (insideX && insideY && insideZ) {
                trigger.triggered = true
                trigger.callback()
            }
        }
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

            geom.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(vertices, 3)
            )
            geom.computeBoundingSphere()

            if (
                !shape.vertices ||
                shape.vertices.length === 0 ||
                !shape.indices ||
                shape.indices.length === 0
            ) {
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
            const shapeOrientation =
                body.shapeOrientations[index] || new CANNON.Quaternion()

            const shapeOffsetTHREE = new THREE.Vector3(
                shapeOffset.x,
                shapeOffset.y,
                shapeOffset.z
            )
            const shapeQuatTHREE = new THREE.Quaternion(
                shapeOrientation.x,
                shapeOrientation.y,
                shapeOrientation.z,
                shapeOrientation.w
            )

            const bodyQuatTHREE = new THREE.Quaternion(
                body.quaternion.x,
                body.quaternion.y,
                body.quaternion.z,
                body.quaternion.w
            )
            const bodyPosTHREE = new THREE.Vector3(
                body.position.x,
                body.position.y,
                body.position.z
            )

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
        const indices = geometry.index
            ? geometry.index.array
            : [...Array(vertices.length / 3).keys()]

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

    removeCollisionsForObject(name) {
        const storedObject = this.objects.get(name)
        if (!storedObject) {
            console.warn(`Object with name "${name}" not found.`)
            return
        }

        storedObject.object.scene.traverse((child) => {
            if (child.isMesh && child.userData.collide) {
                // Trouve et retire le corps physique lié
                const index = this.bodies.findIndex((body) => {
                    return body.shapes.some((shape) => {
                        return shape instanceof CANNON.Trimesh
                    })
                })

                if (index !== -1) {
                    const body = this.bodies[index]
                    this.app.physicsManager.world.removeBody(body)
                    this.bodies.splice(index, 1)
                }

                // Supprimer le wireframe de debug correspondant
                const wireframe = this.collisionWireframes[index]
                if (wireframe) {
                    this.app.scene.remove(wireframe)
                    this.collisionWireframes.splice(index, 1)
                }
            }
        })
    }

    createCustomShaderMaterial(baseMap) {
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
                cameraPos: {
                    value: this.app.physicsManager.sphereBody.position,
                },
            },
            vertexShader: CausticShader.vertexShader,
            fragmentShader: CausticShader.fragmentShader,
        })
    }

    createShadeDeformationrMaterial(baseMap) {
        const uDisplacementTexture = new THREE.TextureLoader().load(
            '/textures/shader/displacment-map.jpg'
        )
        uDisplacementTexture.wrapS = THREE.RepeatWrapping
        uDisplacementTexture.wrapT = THREE.RepeatWrapping
        uDisplacementTexture.minFilter = THREE.LinearFilter
        uDisplacementTexture.magFilter = THREE.LinearFilter

        const material = new THREE.ShaderMaterial({
            uniforms: {
              uTexture: { value: baseMap },
              uDisplacement: { value: uDisplacementTexture },
              uStrength: { value: 0.4 },
              time: { value: 0 },
              cameraPos: { value: this.app.physicsManager.sphereBody.position },
            },
            vertexShader: LayerShader.vertexShader,
            fragmentShader: LayerShader.fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            defines: { USE_INSTANCING: '' }
          });
          return material
    }

    createShadeWaterMaterial() {
        const textureLoader = new THREE.TextureLoader()
        const foamTexture = textureLoader.load('textures/water/foamNoise.png')
        foamTexture.wrapS = THREE.RepeatWrapping
        foamTexture.wrapT = THREE.RepeatWrapping
        
        const normalTexture = textureLoader.load('textures/water/normal.jpg')
        normalTexture.wrapS = THREE.RepeatWrapping
        normalTexture.wrapT = THREE.RepeatWrapping

        this.waterUniformData = {
            uTime: {
                value: this.clock.getElapsedTime(),
            },
            uWindowSize: {
                value: new THREE.Vector2(
                    this.app.canvasSize.width * this.app.canvasSize.pixelRatio,
                    this.app.canvasSize.height * this.app.canvasSize.pixelRatio
                ),
            },
            uSceneTexture: {
                value: this.app.renderer.renderTarget.texture,
            },
            uDepthTexture: {
                value: this.app.renderer.renderTarget.depthTexture,
            },
            uDistortFreq: {
                value: 28.0,
            },
            uDistortAmp: {
                value: 0.005,
            },
            uInverseProjectionMatrix: {
                value: this.app.camera.mainCamera.projectionMatrixInverse,
            },
            uWorldMatrix: {
                value: this.app.camera.mainCamera.matrixWorld,
            },
            uMaxDepth: {
                value: 4.5,
            },
            uColor1: {
                value: new THREE.Color(0x1494ad),
            },
            uColor2: {
                value: new THREE.Color(0x010165),
            },
            uReflectionTexture: {
                value: null,
            },
            uPlanarReflection: {
                value: true,
            },
            uFresnelFactor: {
                value: 1,
            },
            uFoamDepth: {
                value: 0.1,
            },
            uFoamTexture: {
                value: foamTexture,
            },
            uFoamColor: {
                value: new THREE.Color(0x323234),
            },
            uSolidFoamColor: {
                value: true,
            },
            uNormalTexture: {
                value: normalTexture,
            },
            uSpecularReflection: {
                value: false,
            },
            uFoamTiling: {
                value: 0.1,
            },
            uWaterLevel: {
                value: this.waterLevel,
            },
        }

        const waterMaterial = new THREE.ShaderMaterial();
        waterMaterial.uniforms = this.waterUniformData;
        waterMaterial.vertexShader = WaterShader.vertexShader;
        waterMaterial.fragmentShader = PerlinNoise.fragmentShader + WaterShader.fragmentShader;
        waterMaterial.needsUpdate = true;
        // waterMaterial.transparent = true
        // waterMaterial.side = THREE.DoubleSide

        return waterMaterial
    }

    updateWaterUniforms(time) {
        this.waterUniformData.uTime.value = time;
        this.waterUniformData.uWaterLevel.value = this.waterLevel;
        const cam = this.app.camera.mainCamera;

        const worldPos = new THREE.Vector3();
        cam.getWorldPosition(worldPos);

        cam.updateMatrixWorld(true);
        this.waterUniformData.uWorldMatrix.value.copy(cam.matrixWorld);
        this.waterUniformData.uInverseProjectionMatrix.value.copy(cam.projectionMatrixInverse);
    }

    addBoids(ammount, radius, position) {
        const boidManager = new BoidManager(
            this.app.scene,
            ammount,
            this.obstacles,
            radius,
            position
        )

        if (this.app.debug.active) {
            const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32)
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
            })
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
            sphere.position.set(position.x, position.y + radius, position.z)

            this.app.scene.add(sphere)
            this.boidSpheres.push(sphere)
        }

        boidManager.boids.forEach((boid) => {
            this.app.scene.add(boid.mesh)
        })

        this.boidManagers.push(boidManager)
    }

    addPlane(position, size, color = 0xffffff) {
        const geometry = new THREE.PlaneGeometry(size, size)
        const material = this.waterMaterial

        const plane = new THREE.Mesh(geometry, material)
        plane.rotateX(Math.PI * -0.5);

        plane.position.set(position.x, position.y, position.z)
        plane.userData.is_water = true
        this.shaderMeshes.push(plane)
        // plane.rotation.x = -Math.PI / 2 // Par défaut, orienter le plan horizontalement

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
    getItemFromObject(name, object = this.app.scene) {
        let found = null
        object.traverse((child) => {
            if (child.name === name) {
                found = child
            }
        })
        return found
    }

    applyVideoToMultipleScreens(objectName, meshNames = [], mediaId, audioName = null) {
        const stored = this.objects.get(objectName);
        if (!stored) return;

        const mediaData = this.app.mediaManager.mediaElements.get(mediaId);
        if (!mediaData) return;

        const video = mediaData.element;
        video.muted = true;

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBFormat;

        const sharedMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.FrontSide
        });

        const targetMeshes = meshNames
            .map(name => this.getItemFromObject(name, stored.object.scene))
            .filter(Boolean);

        targetMeshes.forEach(mesh => {
            mesh.material?.dispose();
            mesh.material = sharedMaterial;
        });

        const turnOn = async () => {
            return new Promise(async (resolve) => {
                video.currentTime = 0;

                if (audioName) {
                    this.app.soundManager.playSoundOnSpeakers(audioName, `audio/musics/${audioName}.mp3`, {
                        loop: false,
                        volume: 1,
                        maxDistance: 5
                    });
                }

                try {
                    await video.play();
                } catch (e) {
                    console.error("Video playback error", e);
                    return resolve(false);
                }

                setTimeout(() => {
                    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    targetMeshes.forEach(mesh => {
                        mesh.material.dispose();
                        mesh.material = blackMaterial;
                    });

                    if (audioName) {
                        this.app.soundManager.stopSound(audioName);
                    }

                    resolve(true);
                }, mediaData.config.duration);
            });
        };


        const turnOff = async () => {
            return new Promise((resolve) => {
                video.pause();

                const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                targetMeshes.forEach(mesh => {
                    mesh.material.dispose();
                    mesh.material = blackMaterial;
                });

                if (audioName) {
                    this.app.soundManager.stopSound(audioName);
                }

                resolve(true);
            });
        };

        return { turnOn, turnOff };
    }

    /**
     * Supprime un objet de la scène et libère la mémoire associée
     * @param {String} name - Nom de l'objet à supprimer
     */
    async remove(name) {
        this.removeCollisionsForObject(name)
        const storedObject = this.objects.get(name)
        if (!storedObject) {
            console.warn(`Object with name "${name}" not found.`)
            return
        }

        this.app.soundManager.removeSpeakersFromObject(storedObject.object)

        await disposeHierarchy(storedObject.object.scene)

        if (storedObject.mixer) {
            storedObject.mixer.stopAllAction()
            storedObject.mixer.uncacheRoot(storedObject.object.scene)
            storedObject.mixer.uncacheClip(storedObject.animations)
        }

        this.objects.delete(name)
    }

    removeBoids() {
        // Remove all boid managers
        this.boidManagers.forEach((manager) => {
            manager.destroy()
        })
        this.boidManagers = []

        // Remove all boid spheres
        this.boidSpheres.forEach((sphere) => {
            this.app.scene.remove(sphere)
        })
        this.boidSpheres = []
    }

    update(time) {
        const elapsedTime = this.clock.getElapsedTime();

        this.meshTransmissionMaterial.time = time * 0.001

        this.updateWaterUniforms(elapsedTime)

        if (this.boidManagers) {
            this.boidManagers.forEach((manager) => {
                manager.update(time.delta)
            })
        }

        this.rebuildFrameCounter++
        if (this.rebuildFrameCounter >= this.rebuildFrequency) {
            this.rebuildFrameCounter = 0
        
            this.bodies.forEach((body, index) => {
                 if (body.recreateFrom) {
                     // Supprimer l'ancien body
                     this.app.physicsManager.world.removeBody(body)
     
                     // Créer un nouveau body à partir du mesh animé
                     const newBody = this.createTrimeshBodyFromMesh(body.recreateFrom)
                     if (newBody) {
                         newBody.type = CANNON.Body.KINEMATIC
                         newBody.mass = 0
                         newBody.updateMassProperties()
                         newBody.recreateFrom = body.recreateFrom
     
                         this.bodies[index] = newBody
                         this.app.physicsManager.world.addBody(newBody)
                     }
                 }
             })
        }

        this.checkTriggers()

        this.objects.forEach((object) => {
            // Mise à jour des animations (GLTF)
            if (object.mixer && object.playAnimations) {
                object.mixer.update(time.delta)
            }

            // Mise à jour des shaders
            this.shaderMeshes.forEach((child) => {
                if (child.isMesh) {
                    if (child.material?.uniforms?.cameraPos) {
                        child.material.uniforms.cameraPos.value =
                            this.app.physicsManager.sphereBody.position
                    }

                    if (child.material?.uniforms?.time) {
                        child.material.uniforms.time.value += time.delta * 0.4
                    }

                    if (child.material?.uniforms?.uTime) {
                        child.material.uniforms.uTime.value += time.delta * 0.4
                    }
    
                    if (child.material?.uniforms?.cameraPos) {
                        child.material.uniforms.cameraPos.value.copy(this.app.physicsManager.sphereBody.position);
                    }
                }
            })
        })
    }

    /**
     * Rend un objet instable en termes de collisions et de positions
     * @param {THREE.Object3D} object - L'objet 3D à rendre instable
     * @param {Object} options - Options de configuration
     * @param {Number} options.positionJitter - Amplitude du mouvement aléatoire de position (défaut: 0.1)
     * @param {Number} options.rotationJitter - Amplitude de la rotation aléatoire (défaut: 0.05)
     * @param {Number} options.collisionJitter - Amplitude de la déformation des collisions (défaut: 0.2)
     * @param {Number} options.updateFrequency - Fréquence de mise à jour des mouvements (défaut: 5)
     * @param {Number} options.lodDistance - Distance à laquelle réduire la fréquence de mise à jour (défaut: 20)
     */
    makeObjectBuggy(object, options = {}) {
        if (!object || !(object instanceof THREE.Object3D)) {
            console.warn('Invalid object provided to makeObjectBuggy')
            return
        }

        const {
            positionJitter = 0.1,
            rotationJitter = 0.05,
            collisionJitter = 0.2,
            updateFrequency = 5,
            lodDistance = 20
        } = options

        // Stocker les données originales de manière optimisée
        const originalData = {
            position: new THREE.Vector3().copy(object.position),
            rotation: new THREE.Euler().copy(object.rotation),
            bodies: [],
            lastUpdate: 0,
            distance: 0
        }

        // Trouver et stocker les corps physiques associés de manière optimisée
        const bodies = []
        object.traverse((child) => {
            if (child.isMesh && child.userData.collide) {
                const bodyIndex = this.bodies.findIndex((body) => {
                    return body.shapes.some((shape) => shape instanceof CANNON.Trimesh)
                })

                if (bodyIndex !== -1) {
                    const body = this.bodies[bodyIndex]
                    const vertices = body.shapes[0].vertices
                    const originalVertices = new Float32Array(vertices.length)
                    originalVertices.set(vertices)
                    
                    bodies.push({
                        body,
                        originalVertices,
                        vertexCount: vertices.length
                    })
                }
            }
        })
        originalData.bodies = bodies

        // Ajouter les propriétés de bug à l'objet de manière optimisée
        object.isBuggy = true
        object.buggyData = {
            originalData,
            positionJitter,
            rotationJitter,
            collisionJitter,
            updateFrequency,
            lodDistance,
            frameCounter: 0,
            _tempVector: new THREE.Vector3(),
            _tempEuler: new THREE.Euler()
        }

        // Ajouter l'objet à la liste des objets à mettre à jour
        if (!this.buggyObjects) {
            this.buggyObjects = new Set()
        }
        this.buggyObjects.add(object)

        // Modifier la fonction update pour inclure le comportement buggy si ce n'est pas déjà fait
        if (!this._originalUpdate) {
            this._originalUpdate = this.update.bind(this)
            this.update = function(time) {
                this._originalUpdate(time)

                // Mise à jour des objets buggy
                if (this.buggyObjects) {
                    const cameraPosition = this.app.camera.mainCamera.position
                    const now = performance.now()

                    this.buggyObjects.forEach((object) => {
                        if (!object.isBuggy) return

                        const data = object.buggyData
                        const originalData = data.originalData

                        // Calcul de la distance à la caméra
                        data._tempVector.copy(object.position).sub(cameraPosition)
                        const distance = data._tempVector.length()
                        originalData.distance = distance

                        // Ajustement de la fréquence de mise à jour en fonction de la distance
                        const frequency = distance > data.lodDistance ? 
                            data.updateFrequency * 2 : data.updateFrequency

                        // Mise à jour uniquement si nécessaire
                        if (now - originalData.lastUpdate < 1000 / 60) return // Limite à 60 FPS
                        if (data.frameCounter++ < frequency) return

                        data.frameCounter = 0
                        originalData.lastUpdate = now

                        // Mouvement aléatoire de position optimisé
                        const posJitter = data.positionJitter
                        object.position.set(
                            originalData.position.x + this._getRandomFromPool() * posJitter,
                            originalData.position.y + this._getRandomFromPool() * posJitter,
                            originalData.position.z + this._getRandomFromPool() * posJitter
                        )

                        // Rotation aléatoire optimisée
                        const rotJitter = data.rotationJitter
                        object.rotation.set(
                            originalData.rotation.x + this._getRandomFromPool() * rotJitter,
                            originalData.rotation.y + this._getRandomFromPool() * rotJitter,
                            originalData.rotation.z + this._getRandomFromPool() * rotJitter
                        )

                        // Déformation des collisions optimisée
                        if (distance <= data.lodDistance) {
                            const colJitter = data.collisionJitter
                            originalData.bodies.forEach((bodyData) => {
                                const vertices = bodyData.body.shapes[0].vertices
                                const originalVertices = bodyData.originalVertices
                                const vertexCount = bodyData.vertexCount

                                for (let i = 0; i < vertexCount; i += 3) {
                                    const jitter = this._getRandomFromPool() * colJitter
                                    vertices[i] = originalVertices[i] + jitter
                                    vertices[i + 1] = originalVertices[i + 1] + jitter
                                    vertices[i + 2] = originalVertices[i + 2] + jitter
                                }

                                bodyData.body.shapes[0].updateConvexPolyhedronRepresentation()
                                bodyData.body.updateBoundingSphereRadius()
                            })
                        }
                    })
                }
            }.bind(this)
        }
    }

    /**
     * Arrête le comportement buggy d'un objet
     * @param {THREE.Object3D} object - L'objet à stabiliser
     */
    stopBuggyBehavior(object) {
        if (!object || !object.isBuggy) return

        const data = object.buggyData

        // Restaurer la position et rotation originales
        object.position.copy(data.originalData.position)
        object.rotation.copy(data.originalData.rotation)

        // Restaurer les collisions originales
        data.originalData.bodies.forEach((bodyData) => {
            const vertices = bodyData.body.shapes[0].vertices
            vertices.set(bodyData.originalVertices)
            bodyData.body.shapes[0].updateConvexPolyhedronRepresentation()
            bodyData.body.updateBoundingSphereRadius()
        })

        // Nettoyer les propriétés buggy
        delete object.isBuggy
        delete object.buggyData

        // Retirer l'objet de la liste des objets buggy
        if (this.buggyObjects) {
            this.buggyObjects.delete(object)
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
