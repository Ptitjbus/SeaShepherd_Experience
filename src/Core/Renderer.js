import { WebGLRenderer } from "three"
import App from "../App"
import EventEmitter from "../Utils/EventEmitter"

export default class Renderer extends EventEmitter {
    constructor() {
        super()

        this.app = new App()

        this.instance = null
        this.maxPixelRatio = 1

        this.resizeHandlerBound = this.resizeHandler.bind(this)

        this.init()
    }

    init() {
        // TODO : rendre les ombres : https://threejs.org/docs/#api/en/renderers/WebGLRenderer PCFShadowMap
        this.instance = new WebGLRenderer({
            canvas : this.app.canvas,
            context: this.app.canvas.getContext('webgl2'),
            antialias : true
        })

        this.instance.setSize(this.app.canvasSize.width, this.app.canvasSize.height)
        this.instance.setPixelRatio(Math.min(this.app.canvasSize.pixelRatio, this.maxPixelRatio))

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