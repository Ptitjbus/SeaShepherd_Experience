import * as THREE from 'three'
import { Sky as SkyObject } from 'three/examples/jsm/objects/Sky.js'

export default class Sky {
    constructor(scene, renderer) {
        this.scene = scene
        this.renderer = renderer

        this.sky = new SkyObject()
        this.sky.scale.setScalar(10000)
        this.scene.add(this.sky)

        this.sun = new THREE.Vector3()

        this.effectController = {
            turbidity: 10,
            rayleigh: 2,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.3,
            elevation: 2,
            azimuth: 180,
            exposure: 0.5,
        }

        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)
        this.pmremGenerator.compileEquirectangularShader()

        this.updateSky()
    }

    updateSky() {
        const uniforms = this.sky.material.uniforms
        uniforms['turbidity'].value = this.effectController.turbidity
        uniforms['rayleigh'].value = this.effectController.rayleigh
        uniforms['mieCoefficient'].value = this.effectController.mieCoefficient
        uniforms['mieDirectionalG'].value = this.effectController.mieDirectionalG

        const phi = THREE.MathUtils.degToRad(90 - this.effectController.elevation)
        const theta = THREE.MathUtils.degToRad(this.effectController.azimuth)

        this.sun.setFromSphericalCoords(1, phi, theta)
        uniforms['sunPosition'].value.copy(this.sun)

        this.sky.material.needsUpdate = true

        this.renderer.toneMappingExposure = this.effectController.exposure

        // Génère un envMap basé sur le ciel
        const renderTarget = this.pmremGenerator.fromScene(this.sky)
        this.scene.environment = renderTarget.texture
        this.scene.background = renderTarget.texture
    }

    setSunPosition(elevation, azimuth) {
        this.effectController.elevation = elevation
        this.effectController.azimuth = azimuth
        this.updateSky()
    }

    destroy() {
        this.pmremGenerator.dispose()
    }
}
