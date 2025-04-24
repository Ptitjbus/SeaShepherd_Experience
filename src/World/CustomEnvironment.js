import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

export default class CustomEnvironment {
  constructor(scene, renderer, pathToExr) {
    this.scene = scene
    this.renderer = renderer
    this.pathToExr = pathToExr

    this.envMap = null

    this.initEnvMap()
  }

  initEnvMap() {
    const loader = new EXRLoader()
    loader.load(this.pathToExr, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping

      const pmremGenerator = new THREE.PMREMGenerator(this.renderer)
      pmremGenerator.compileEquirectangularShader()

      this.envMap = pmremGenerator.fromEquirectangular(texture).texture

      this.scene.environment = this.envMap
      this.scene.background = this.envMap

      texture.dispose()
      pmremGenerator.dispose()
    })
  }
}
