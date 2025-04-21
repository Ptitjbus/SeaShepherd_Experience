import * as THREE from 'three'

import EventEmitter from "../Utils/EventEmitter"

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

import assets from "./assets"

import App from '../App';

import gsap from 'gsap'

export class AssetManager extends EventEmitter {
    constructor() {
        super()

        this.app = new App()
        
        this.assets = assets
        
        this.loaders = null
        this.items = null
        this.loadingCount = assets.length
        this.loadedCount = 0

        this.loadingComplete = false

        this.init()
    }

    init() {
        this.items = {}

        this.initProgressBar()

        this.loaders = {}
        
        this.loaders.texture = new THREE.TextureLoader(this.loadingManager)
        
        this.loaders.exr = new EXRLoader(this.loadingManager)
        this.loaders.hdr = new RGBELoader(this.loadingManager)

        this.loaders.fbx = new FBXLoader(this.loadingManager)
        this.loaders.gltf = new GLTFLoader(this.loadingManager)
        
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('./lib/draco/');
        this.loaders.gltf.setDRACOLoader(dracoLoader);
    }

    initProgressBar() {
        const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
        const overlayMaterial = new THREE.ShaderMaterial({
            transparent: true,
            vertexShader: `
                void main() {
                    gl_Position = vec4(position, 1.);
                }
            `,
                
            fragmentShader: `
                uniform float uAlpha;
                void main() {
                    gl_FragColor = vec4(0., 0., 0., uAlpha);
                }
            `,
            uniforms: {
                uAlpha : new THREE.Uniform(0)
            }
        })
        
        this.loadingOverlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial)
        this.loadingOverlayMesh.name = 'LoadingOverlay'
        this.loadingOverlayMesh.material.uniforms.uAlpha.value = 1.0
        
        this.loadingBarElement = document.querySelector('.loading-bar')
        this.loadingBarElement.style.opacity = 1
                
        this.loadingManager = new THREE.LoadingManager(
            // Loaded
            () => {
                this.loadingComplete = true

                this.trigger('ready')

                // Match 500ms 
                gsap.delayedCall(0.5, () => {
                    console.log(`AssetManager :: assets load complete`)
    
                    if (this.loadingBarElement !== null) {
                        this.loadingBarElement.classList.add('ended')
                        this.loadingBarElement.style.transform = ''
                    }
                    
                    const tl = gsap.timeline({
                        onComplete : () => {        
                            this.app.scene.remove(this.loadingOverlayMesh)
                            // Memory.releaseObject3D(this.loadingOverlayMesh)
                            this.loadingOverlayMesh = null
                        }
                    })
                    
                    tl.to(this.loadingOverlayMesh.material.uniforms.uAlpha, {value: 0.0, ease: "power4.in", duration: 1})
                })
            },
            
            // Progress 
            (itemUrl, itemsLoaded, itemsTotal) => {
                if (this.loadingBarElement !== null) {
                    const progressRatio = itemsLoaded / itemsTotal
                    this.loadingBarElement.style.transform = `scaleX(${progressRatio})`
                }
            }
        )
    }

    load() {
        if (this.assets.length === 0) {
            this.trigger('ready')
            return
        }

        for (const asset of this.assets) {
            if (asset.type.toLowerCase() === "texture") {
                this.loaders.texture.load(asset.path, (texture) => {
                    if (asset.envmap) {
                        texture.mapping = THREE.EquirectangularReflectionMapping
                    }
                    this.loadComplete(asset, texture)
                })
            }
            else
            if (asset.type.toLowerCase() === "exr") {
                this.loaders.exr.load(asset.path, (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    this.loadComplete(asset, texture)
                })
            }
            else
            if (asset.type.toLowerCase() === "hdr") {
                this.loaders.hdr.load(asset.path, (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping
                    this.loadComplete(asset, texture)
                })
            }
            else
            if (asset.type.toLowerCase() === "fbx") {
                this.loaders.fbx.load(asset.path, (model) => {
                    this.loadComplete(asset, model)
                })
            }
            else
            if (asset.type.toLowerCase() === "gltf") {
                this.loaders.gltf.load(asset.path, (model) => {
                    this.loadComplete(asset, model)
                })
            }
            else
            if (asset.type.toLowerCase() === "material") {
                const textures = Object.entries(asset.textures)
                const material = Object.assign(asset.textures)

                let nTex = textures.length
                let path = asset.path 
                if (path.charAt(path.length - 1) !== '/') {
                    path += '/'
                }
              
                textures.map((texObject, idx) => {
                    const type = texObject[0]
                    
                    if (typeof texObject[1] === 'object' && !Array.isArray(texObject[1]) && texObject[1] !== null) {
                        for (const [key, value] of Object.entries(texObject[1])) {                            
                            const url = path + value

                            this.loaders.texture.load(url, (texture) => {
                                texture.flipY = false
                                material[type][key] = texture
                                if (--nTex == 0) {
                                    this.loadComplete(asset, material)
                                }
                            })
                        }
                    }
                    else {
                        const url = path + texObject[1]
                        this.loaders.texture.load(url, (texture) => {
                            texture.flipY = false
                            material[type] = texture
                            if (--nTex == 0) {
                                this.loadComplete(asset, material)
                            }
                        })    
                    }
                })
            }
        }
    }

    loadComplete(asset, object) {
        console.log(`AssetManager :: new item stored : ${asset.name}`)
        this.items[asset.name] = object

    }

    getItemNamesOfType(type) {
        return this.assets.filter(asset => asset.type.toLowerCase() === type.toLowerCase()).map(e => e.name)
    }

    getItem(name) {
        // Check if it's a gltf material
        if (this.items[name].scene
            && this.items[name].scene.getObjectByName('pbr_node')
            && this.items[name].scene.getObjectByName('pbr_node').material) {
                return this.items[name].scene.getObjectByName('pbr_node').material
        }

        return this.items[name]
    }

    destroy() {
        this.assets = null

        this.loadingBarElement = null
        this.loadingManager = null

        this.loaders.model = null
        this.loaders.texture = null
        this.loaders = null

        this.items.length = 0
        this.items = null

        this.app = null
    }
}