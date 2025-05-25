import { DepthFormat, DepthTexture, FloatType, WebGLRenderer, WebGLRenderTarget } from "three"
import App from "../App"
import EventEmitter from "../Utils/EventEmitter"

export default class Renderer extends EventEmitter {
    constructor() {
        super()

        this.app = new App()

        this.instance = null
        this.maxPixelRatio = 1

        this.resizeHandlerBound = this.resizeHandler.bind(this)
        this.renderTarget = null
        this.reflectionRenderTarget = null

        this.init()
    }

    init() {
        // TODO : rendre les ombres : https://threejs.org/docs/#api/en/renderers/WebGLRenderer PCFShadowMap
        this.instance = new WebGLRenderer({
            canvas : this.app.canvas,
            antialias : true
        })
        this.instance.setPixelRatio(Math.min(this.app.canvasSize.pixelRatio, this.maxPixelRatio))
        this.instance.setSize(this.app.canvasSize.width, this.app.canvasSize.height)

        this.renderTarget = new WebGLRenderTarget(this.app.canvasSize.width * this.app.canvasSize.pixelRatio, this.app.canvasSize.height * this.app.canvasSize.pixelRatio)
        this.renderTarget.depthTexture = new DepthTexture(this.app.canvasSize.width * this.app.canvasSize.pixelRatio, this.app.canvasSize.height * this.app.canvasSize.pixelRatio)
        this.renderTarget.depthTexture.type = FloatType
        this.renderTarget.depthTexture.format = DepthFormat

        this.reflectionRenderTarget = new WebGLRenderTarget(this.app.canvas.width * this.app.canvasSize.pixelRatio, this.app.canvas.height * this.app.canvasSize.pixelRatio)


        this.app.canvasSize.on('resize', this.resizeHandlerBound)
    }

    resizeHandler(data) {
        const { width, height } = data
        this.instance.setSize(width, height)
    }

    destroy() {
        this.app.canvasSize.off('resize')
        this.resizeHandlerBound = null

        this.instance.dispose()
        this.instance = null

        this.app = null
    }
}