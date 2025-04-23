import { Howl } from 'howler'
import App from '../../App'
import { Vector3 } from 'three'

export default class SoundManager {
    constructor() {
        this.app = new App()
        this.sound = null
        this.soundIds = []

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
            if (child.name === 'HAUT-PARLEUR002') {
                const position = new Vector3()
                child.getWorldPosition(position)

                this.app.debug.createHelper(child, this.app.scene)

                const id = this.sound.play()
                
                this.sound.pos(position.x, position.y, position.z, id)
                this.sound.pannerAttr({
                    panningModel: 'HRTF',
                    distanceModel: 'inverse',
                    refDistance: 1,
                    maxDistance: 100,
                    rolloffFactor: 1
                }, id)

                this.soundIds.push(id)
            }
        })
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

    stopAll() {
        if (this.sound) this.sound.stop()
    }

    destroy() {
        this.stopAll()
        this.sound.unload()
    }
}
