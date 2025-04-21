import { BoxGeometry, Mesh, MeshNormalMaterial } from "three"
import App from "../App"

export default class Cube {
    constructor() {
        this.instance = null

        this.app = new App()
        
        this.init()
    }

    init() {
        const geometry = new BoxGeometry(2, 2, 2)
        const material = new MeshNormalMaterial()
        this.instance = new Mesh(geometry, material)

        this.app.animationLoop.on('update', (data) => {
            this.update(data)
        })
    }

    update(data) {
        const { delta } = data

        this.instance.rotation.y += delta
        this.instance.rotation.z += delta
    }

    destroy() {
        this.instance.geometry.dispose()
        this.instance.material.dispose()
        this.instance = null

        this.app = null
    }
}
