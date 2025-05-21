import { EquirectangularReflectionMapping, PMREMGenerator } from 'three'
import App from '../App'

export default class CustomEnvironment {
    constructor() {
        this.app = new App()
        this.scene = this.app.scene
        this.renderer = this.app.renderer.instance
        this.assetManager = this.app.assetManager

        this.setEnvironment()
    }

    setEnvironment() {
        const envTexture = this.assetManager.getItem('studioHDR') // nom selon assets.js
        if (!envTexture) {
            console.warn('CustomEnvironment: HDR texture not found')
            return
        }

        envTexture.mapping = EquirectangularReflectionMapping

        const pmremGenerator = new PMREMGenerator(this.renderer)
        const envMap = pmremGenerator.fromEquirectangular(envTexture).texture

        this.scene.environment = envMap
        this.scene.background = envMap

        envTexture.dispose()
        pmremGenerator.dispose()
    }
}
