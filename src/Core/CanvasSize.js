import App from "../App";
import EventEmitter from "../Utils/EventEmitter";

/*
Le CanvasSize gère la taille du canvas à tout instant et notifie les classes qui ont besoin des infos
*/

export default class CanvasSize extends EventEmitter {
    constructor() {
        super()

        this.app = new App()
        this.canvas = this.app.canvas
        
        this.resizeHandlerBound = this.resizeHandler.bind(this)
        
        this.width = 0
        this.height = 0
        this.aspect = 0
        this.pixelRatio = Math.min(2, window.devicePixelRatio)
    
        this.init()
    }

    init() {
        window.addEventListener('resize', this.resizeHandlerBound)

        this.width = window.innerWidth
        this.height = window.innerHeight
        this.aspect = this.width / this.height
    }

    resizeHandler() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        this.canvas.style.width = this.canvas.width + 'px'
        this.canvas.style.height = this.canvas.height + 'px'

        this.width = window.innerWidth
        this.height = window.innerHeight
        this.aspect = this.width / this.height

        this.trigger('resize', [{
            width: this.width,
            height: this.height,
            aspect: this.aspect
        }])
    }

    destroy() {
        window.removeEventListener('resize', this.resizeHandlerBound)

        this.resizeHandlerBound = null

        this.canvas = null
        this.app = null
    }
}
