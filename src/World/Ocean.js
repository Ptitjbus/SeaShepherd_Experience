import * as THREE from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'

export default class Ocean {
  constructor(scene, renderer) {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000)

    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('textures/water/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      }),
      sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    })

    this.water.rotation.x = -Math.PI / 2
    this.water.position.y = -0.5
    this.water.material.uniforms.size.value = 5
    scene.add(this.water)
  }

  update(delta) {
    this.water.material.uniforms['time'].value += delta
  }
}
