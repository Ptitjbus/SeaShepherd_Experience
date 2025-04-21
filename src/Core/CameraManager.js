import * as core from '@theatre/core'
// import studio from '@theatre/studio'

import state from '../../static/cameraAnimations/aquarium.json'

export default class CameraManager {
    constructor(camera) {
        this.camera = camera
        this.project = null
        this.sheet = null
        this.cameraObj = null

        this.init()
    }

    init() {
        // studio.initialize()
        this.loadSequence()
    }

    async loadSequence() {
        this.project = core.getProject('CameraProject', { state: state })
        this.sheet = this.project.sheet('CameraSheet')

        this.cameraObj = this.sheet.object('Camera', {
            position: {
                x: this.camera.mainCamera.position.x,
                y: this.camera.mainCamera.position.y,
                z: this.camera.mainCamera.position.z
            },
            lookAt: {
                x: 0, y: 0, z: 0
            }
        }, {reconfigure: true})

        this.cameraObj.onValuesChange(values => {
            this.camera.mainCamera.position.set(
                values.position.x,
                values.position.y,
                values.position.z
            )
            this.camera.mainCamera.lookAt(
                values.lookAt.x,
                values.lookAt.y,
                values.lookAt.z
            )
        })
    }

    async playSequence() {
        if (this.sheet && this.sheet.sequence) {
            this.project.ready.then(() => {
                this.sheet.sequence.play()
            })
        } else {
            console.warn("No sequence available to play")
        }
    }
}
