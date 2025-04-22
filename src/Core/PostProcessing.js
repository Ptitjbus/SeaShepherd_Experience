import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { FisheyeShader } from '../Shaders/FisheyeShader.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import App from '../App.js'

export default class PostProcessing {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer)
        this.scene = scene
        this.camera = camera
        this.app = new App()

        this.renderPass = new RenderPass(scene, camera)
        this.pixelSize = 1.8
        this.renderPixelatedPass = new RenderPixelatedPass( this.pixelSize, scene, camera )
        this.renderPixelatedPass.normalEdgeStrength = 0.1
        this.renderPixelatedPass.depthEdgeStrength = 0.1
        this.fisheyePass = new ShaderPass(FisheyeShader)
        this.glitchPass = new GlitchPass()
        this.fxaaPass = new ShaderPass( FXAAShader )
        this.fxaaPass.enabled = false

        // this.fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( this.app.canvas.width * renderer.pixelRatio );
        // this.fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( this.app.canvas.height * renderer.pixelRatio );

        this.glitchPass.goWild = false
        this.glitchPass.randX = 0

        this.composer.addPass(this.renderPass)
        this.composer.addPass(this.renderPixelatedPass)
        this.composer.addPass(this.glitchPass)
        this.composer.addPass(this.fisheyePass)
        this.composer.addPass(this.fxaaPass)
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
        this.renderPixelatedPass.camera = camera

        this.composer.render()
    }

    resize(width, height) {
        this.composer.setSize(width, height)
    }

    destroy() {
        this.composer = null
        this.scene = null
        this.camera = null
    }
}
