import * as THREE from 'three'
import Boid from '../../World/Boid'

export default class BoidManager {
  /**
   *
   * @param {*} numberOfBoids
   * @param {*} obstacles other obstacles in the world to consider when avoiding collisions
   */
  constructor(scene, numberOfBoids = 20, obstacles = [], radius, origin) {

    // create the boids
    this.scene = scene
    this.radius = radius
    this.origin = new THREE.Vector3(origin.x, radius + origin.y, origin.z)
    
    this.initBoids(scene, numberOfBoids)

    // for each boid, add the other boids to its collidableMeshList, and also add
    // the meshes from the common collidableMeshList

    this.obstacles = obstacles
  }

  initBoids(scene, numberOfBoids) {
    this.boids = this.boids || []

    var randomX, randomY, randomZ, colour, quaternion

    for (let i = 0; i < numberOfBoids; i++) {
      let randomPosition = this.getRandomPositionInSphere(this.origin, this.radius)
      colour = null // will use default color in getBoid
      quaternion = null

      // reference boid
      if (i === 0) {
        randomPosition = this.origin.clone()
        colour = 0xe56289
        quaternion = null
      }

      var position = new THREE.Vector3(randomX, randomY, randomZ)

      var boid = new Boid(scene, randomPosition, this.origin, this.radius, quaternion, colour)
      this.boids.push(boid)
    }
  }

  getRandomPositionInSphere(center, radius) {
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = radius * Math.cbrt(Math.random()) // Ensures uniform distribution

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      return new THREE.Vector3(x, y, z).add(center)
  }

  update(delta) {
    this.boids.forEach(boid => {
      boid.update(delta, this.boids, this.obstacles)
    })
  }

  destroy() {
    this.boids.forEach(boid => {
      boid.destroy() // Assuming Boid has a destroy method to clean up resources
    })
    this.boids = []
  }
}