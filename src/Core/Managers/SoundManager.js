import { Howl } from 'howler'
import App from '../../App'
import { Vector3 } from 'three'

export default class SoundManager {
    constructor() {
        this.app = new App()
        this.sound = null
        this.soundIds = []

        this.isPaused = true

        this.speakers = []
    }

    initSound() {
        this.sound = new Howl({
            src: ['audio/background_music.mp3'],
            loop: true,
            volume: 1.0,
            onload: () => this.attachToSpeakers()
        })
    }

    attachToSpeakers() {
        this.app.scene.traverse((child) => {
            if (child.name.startsWith('HAUT-PARLEUR')) {
                const position = new Vector3()
                const worldPosition = child.getWorldPosition(position)

                this.app.debug.createHelper(child, this.app.scene, worldPosition)

                const id = this.sound.play()
                
                this.sound.pos(position.x, position.y, position.z, id)
                this.sound.pannerAttr({
                    panningModel: 'HRTF',
                    distanceModel: 'inverse',
                    refDistance: 1,
                    maxDistance: 5,
                    rolloffFactor: 1
                }, id)

                this.soundIds.push(id)
            }
        })

        if (this.isPaused){
            this.pauseAll()
        }
    }

    updateListener() {
        const camera = this.app.camera
    
        if (!camera) return
    
        const position = new Vector3()
        const orientation = new Vector3()
    
        // Récupère la position et orientation
        camera.mainCamera.getWorldPosition(position)
        camera.mainCamera.getWorldDirection(orientation)
    
        // Applique au listener global Howler
        Howler.pos(position.x, position.y, position.z)
        Howler.orientation(
            orientation.x, orientation.y, orientation.z        )
    }

    pauseAll() {
        if (this.sound && this.soundIds.length > 0) {
            this.soundIds.forEach((id) => {
                this.sound.pause(id)
            })
            this.isPaused = true
        }
    }

    resumeAll() {
        if (this.sound && this.soundIds.length > 0 && this.isPaused) {
            this.soundIds.forEach((id) => {
                this.sound.play(id)
            })
            this.isPaused = false
        }
    }

    destroy() {
        this.stopAll()
        this.sound.unload()
    }
}
