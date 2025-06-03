import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'

export default class Ocean {
    constructor(scene, renderer) {
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

        this.water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(
                'textures/water/waternormals.jpg',
                function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
                }
            ),
            sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
            sunColor: 0x0A94C1,
            waterColor: 0x0A94C1,
            distortionScale: 0.5,
            fog: scene.fog !== undefined,
        })

        this.water.rotation.x = -Math.PI / 2
        this.water.position.y = -1
        this.water.material.uniforms.size.value = 3.0
        scene.add(this.water)
    }

    hide() {
        this.water.visible = false
    }

    show() {
        this.water.visible = true
    }

    setColor(hexColor) {
        this.water.material.uniforms.waterColor.value.set(hexColor)
        this.water.material.uniforms.sunColor.value.set(hexColor)
    }

    update(delta) {
        this.water.material.uniforms['time'].value += delta * 0.5
    }
}
