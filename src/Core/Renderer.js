import { WebGLRenderer } from "three"
import App from "../App"
import EventEmitter from "../Utils/EventEmitter"

export default class Renderer extends EventEmitter {
    constructor() {
        super()

        this.app = new App()

        this.instance = null

        this.resizeHandlerBound = this.resizeHandler.bind(this)

        this.init()
    }

    init() {
        this.instance = new WebGLRenderer({
            canvas : this.app.canvas,
            antialias : true
        })

        this.instance.setSize(this.app.canvasSize.width, this.app.canvasSize.height)
        this.instance.setPixelRatio(this.app.canvasSize.pixelRatio)

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