import App from '../../App'

export default class StoryManager {
    constructor() {
        this.app = new App()
        this.experienceStarted = false

        this.init()
    }

    init() {}

    startExperience() {
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.app.startOverlay.classList.add('hidden')

        this.app.canvas.style.opacity = '1'
        // this.camera.switchCamera()

        // this.soundManager.resumeAll()

        if (this.app.museumMixer) {
            this.app.museumMixer.stopAllAction()

            const museum = this.app.assetManager.getItem('Museum')
            museum.animations.forEach((clip) => {
                this.museumMixer.clipAction(clip).reset().play()
            })
        }
    }

    endExperience() {
        if (this.experienceEnded) return
        this.experienceEnded = true

        this.endOverlay.classList.remove('hidden')

        void this.endOverlay.offsetWidth

        this.canvas.style.opacity = '0'

        setTimeout(() => {
            this.endOverlay.classList.add('visible')
        }, 100)
    }

    destroy() {}
}
