import * as THREE from 'three'

import EventEmitter from "../Utils/EventEmitter"

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { RGBELoader } from 'three/examples/jsm/Addons.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

import assets from "./assets.js"

import App from '../App'

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

        this.videoManager = new VideoManager()
        
        this.soundReadyHandlerBound = this.soundReadyHandler.bind(this)
        
        this.app.soundManager.on('ready', this.soundReadyHandlerBound)

        this.soundReady = false
        this.assetsReady = false

        this.allReady = true

        this.init()
    }

    init() {
        this.items = {}

        // Replace initProgressBar with initVideoLoader
        this.initVideoLoader()
        this.app.soundManager.initSounds()

        this.loaders = {}

        this.loadingBarElement = document.querySelector('.loading-bar')
        
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
                console.log("loadingManager loaded") 
                this.assetsReady = true
                this.checkAllReady()
            },
            
            // Progress callback 
            (itemUrl, itemsLoaded, itemsTotal) => {
                const progressRatio = itemsLoaded / itemsTotal
                this.loadingBarElement.style.width = `${progressRatio * 100}%`
            }
        )
        
        // Load intro video - utiliser une vidéo locale qui existe
        this.videoManager.loadVideo('/videos/intro.mp4')
    }

    soundReadyHandler() {
        console.log(`AssetManager :: sound ready`)
        this.soundReady = true
        this.checkAllReady()
    }

    checkAllReady() {
        console.log(`AssetManager :: checkAllReady - soundReady: ${this.soundReady}, assetsReady: ${this.assetsReady}`)
        if (this.soundReady && this.assetsReady) {
            this.allReady = true
            console.log(`AssetManager :: all assets loaded and ready`)
            this.loadingBarElement.style.width = `100%`
            this.loadingBarElement.style.opacity = 0
            this.videoManager.showSkipButton()
            setTimeout(() => {
                this.trigger('ready')
            }, 100)
        }
    }

    showMainScreen() {
        if (this.app.debug.active) {
            this.videoManager.hideVideoScreen()
            this.app.canvas.style.opacity = '1'
            return
        }

        if (this.videoManager.videoEnded && this.allReady) {
            this.videoManager.hideVideoScreen()
            this.app.canvas.style.opacity = '1'
        }
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
        const item = this.items[name]
    
        // Vérifie que c'est bien un GLTF avec un pbr_node
        if (
            item &&
            item.scene &&
            typeof item.scene.getObjectByName === 'function'
        ) {
            const pbrNode = item.scene.getObjectByName('pbr_node')
            if (pbrNode && pbrNode.material) {
                return pbrNode.material
            }
        }
    
        // Retourne l'item tel quel sinon (utile pour HDR, textures, etc.)
        return item
    }

    destroy() {
        // Clean up VideoManager and SoundManager
        if (this.videoManager) {
            this.videoManager.destroy()
            this.videoManager = null
        }
        
        if (this.soundManager) {
            this.soundManager.off('ready', this.soundReadyHandlerBound)
            this.soundManager.destroy()
            this.soundManager = null
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