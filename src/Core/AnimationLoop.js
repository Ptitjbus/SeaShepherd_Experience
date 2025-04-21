import EventEmitter from "../Utils/EventEmitter"

export class AnimationLoop extends EventEmitter {

    constructor() {
        super()

        /**
         * Timestamps [s]
        */
        this.startTS = 0
        this.currentTS = 0

        /**
         * Animation loop state
        */
       this.running = false

       /**
        * Animation loop properties [s]
        */
       this.elapsed = 0
       this.delta = 0
    }

    start() {
        this.running = true

        this.startTS = Date.now() / 1000
        this.currentTS = this.startTS

        window.requestAnimationFrame(() => {
            this.update()
        })
    }

    stop() {
        this.running = false
    }

    update() {
        if (this.running === true) {
            window.requestAnimationFrame(() => {
                this.update()
            })
        }

        const currentTime = Date.now() / 1000
        this.delta = currentTime - this.currentTS
        this.currentTS = currentTime
        this.elapsed = this.currentTS - this.startTS

        this.trigger('update', [{elapsed: this.elapsed, delta: this.delta}])
    }

    destroy() {
    }
}


