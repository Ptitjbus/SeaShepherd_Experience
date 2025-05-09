import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FisheyeShader } from '../../Shaders/FisheyeShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import App from '../../App.js'
import { Vector2 } from 'three'

export default class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer)
        this.scene = scene
        this.camera = camera
        this.app = new App()

        this.renderPass = new RenderPass(scene, camera)
        this.fisheyePass = new ShaderPass(FisheyeShader)
        this.fisheyePass.uniforms['strength'].value = 0.5
        this.glitchPass = new GlitchPass()

        const bloomParams = {
            strength: 0.5,
            radius: 0.4,
            threshold: 0.9
        }
        this.bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            bloomParams.strength,
            bloomParams.radius,
            bloomParams.threshold
        )

        this.glitchPass.goWild = false
        this.glitchPass.randX = 0

        this.composer.addPass(this.renderPass)
        this.composer.addPass(this.fisheyePass)
        this.composer.addPass(this.glitchPass)
        this.composer.addPass(this.bloomPass)
    }

    triggerGlitch() {
        const duration = Math.floor(Math.random() * (200 - 50 + 1) + 50)
        this.glitchPass.curF = 0
        this.glitchPass.generateTrigger()
        setTimeout(() => {
            this.glitchPass.randX = 0
        }, duration)
    }

    triggerBigGlitch() {
        this.glitchPass.curF = 0
        this.glitchPass.generateTrigger()
        setTimeout(() => {
            this.glitchPass.randX = 0
        }, 600)
    }

    render(camera = this.camera) {
        this.renderPass.camera = camera

        this.composer.render()
    }

    resize(width, height) {
        const scaleFactor = 0.8
        this.composer.setSize(width * scaleFactor, height * scaleFactor)
    }

    destroy() {
        this.composer.passes.forEach(pass => {
            if (pass.dispose) pass.dispose()
        })
        this.composer = null
        this.scene = null
        this.camera = null
    }
}
