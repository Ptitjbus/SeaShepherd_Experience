import * as THREE from 'three'

import EventEmitter from "../Utils/EventEmitter"

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

import assets from "./assets.js"

import App from '../App'

import gsap from 'gsap'

import VideoManager from '../Core/Managers/VideoManager.js';

export default class AssetManager extends EventEmitter {
    constructor() {
        super()

        this.app = new App()
        
        this.assets = assets
        
        this.loaders = null
        this.items = null
        this.loadingCount = assets.length
        this.loadedCount = 0

        this.loadingComplete = false
        
        // Create a VideoManager instance
        this.videoManager = new VideoManager()
        this.videoReadyHandlerBound = this.videoReadyHandler.bind(this)
        this.videoManager.on('ready', this.videoReadyHandlerBound)

        this.init()
    }

    init() {
        this.items = {}

        // Replace initProgressBar with initVideoLoader
        this.initVideoLoader()

        this.loaders = {}
        
        this.loaders.texture = new THREE.TextureLoader(this.loadingManager)
        
        this.loaders.exr = new EXRLoader(this.loadingManager)
        this.loaders.hdr = new RGBELoader(this.loadingManager)

        // Initialisation correcte du DRACOLoader
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
        
        this.loaders.fbx = new FBXLoader(this.loadingManager)
        this.loaders.gltf = new GLTFLoader(this.loadingManager)
        this.loaders.gltf.setDRACOLoader(dracoLoader) // Attacher DRACOLoader au GLTFLoader
    }

    // Replace initProgressBar with this method
    initVideoLoader() {
        this.loadingManager = new THREE.LoadingManager(
            // Loaded callback
            () => {
                this.loadingComplete = true
                this.videoManager.notifyAssetsLoaded()
            },
            
            // Progress callback 
            (itemUrl, itemsLoaded, itemsTotal) => {
                const progressRatio = itemsLoaded / itemsTotal
                this.videoManager.updateLoadingProgress(progressRatio)
            }
        )
        
        // Load intro video - utiliser une vidéo locale qui existe
        this.videoManager.loadVideo('/videos/test.mp4')
    }
    
    videoReadyHandler() {
        console.log(`AssetManager :: assets load complete and video ended`)
        // Donner un court délai pour s'assurer que tout est bien chargé avant de continuer
        setTimeout(() => {
            this.trigger('ready')
        }, 100)
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
        // Add this line to clean up VideoManager
        if (this.videoManager) {
            this.videoManager.off('ready', this.videoReadyHandlerBound)
            this.videoManager.destroy()
            this.videoManager = null
        }
        
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