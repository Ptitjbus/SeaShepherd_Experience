import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FisheyeShader } from '../../Shaders/FisheyeShader.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import App from '../../App.js'
import { Vector2 } from 'three'

export default class PostProcessingManager {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer)
        this.scene = scene
        this.camera = camera
        this.app = new App()

        this.renderPass = new RenderPass(scene, camera)
        this.fisheyePass = new ShaderPass(FisheyeShader)
        this.fisheyePass.uniforms['strength'].value = 0.5
        this.glitchPass = new GlitchPass()

        const bloomParams = {
            strength: 0.5,
            radius: 0.4,
            threshold: 0.9
        }
        this.bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            bloomParams.strength,
            bloomParams.radius,
            bloomParams.threshold
        )

        this.glitchPass.goWild = false
        this.glitchPass.randX = 0

        this.composer.addPass(this.renderPass)
        this.composer.addPass(this.fisheyePass)
        this.composer.addPass(this.glitchPass)
        this.composer.addPass(this.bloomPass)
    }

    triggerGlitch() {
        const duration = Math.floor(Math.random() * (200 - 50 + 1) + 50)
        this.glitchPass.curF = 0
        this.glitchPass.generateTrigger()
        const randomSound = Math.floor(Math.random() * 3)
        if (duration <= 100) {
            this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/100/${randomSound}.mp3`)
        }else{
            this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/200/${randomSound}.mp3`)
        }
        setTimeout(() => {
            this.glitchPass.randX = 0
            this.app.soundManager.stopSound('glitch')
        }, duration)
    }

    triggerBigGlitch() {
        const duration = Math.floor(Math.random() * (600 - 200 + 1) + 200)
        this.glitchPass.curF = 0
        this.glitchPass.generateTrigger()
        const randomSound = Math.floor(Math.random() * 3)
        if (duration <= 300) {
            this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/300/${randomSound}.mp3`)
        }else if (duration <= 400) {
            this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/400/${randomSound}.mp3`)
        }else if (duration <= 500) {
            this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/500/${randomSound}.mp3`)
        }else{
            this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/600/${randomSound}.mp3`)
        }
        setTimeout(() => {
            this.glitchPass.randX = 0
        }, duration)
    }

    triggerHugeGlitch() {
        this.app.soundManager.playSimpleSound('glitch', `audio/sfx/glitch/2000.mp3`, {
            stopAll: false
        })
        this.glitchPass.goWild = true
        setTimeout(() => {
            this.glitchPass.goWild = false
            this.glitchPass.randX = 0
        }, 2000)
    }

    /**
     * Démarre un système de glitches aléatoires avec différents niveaux de fréquence
     * @param {number} level - Niveau de fréquence (0: faible, 1: moyenne, 2: forte)
     * @returns {Object} - Objet contenant la fonction stop pour arrêter les glitches
     */
    startRandomGlitches(level = 0) {
        // Définir les intervalles de temps en fonction du niveau
        const intervals = {
            0: { min: 2000, max: 15000 },  // Faible: 10-20 secondes
            1: { min: 1000, max: 5000 },   // Moyenne: 5-10 secondes
            2: { min: 1000, max: 2000 }     // Forte: 2-5 secondes
        }

        // Définir les probabilités de gros glitch en fonction du niveau
        const bigGlitchProbabilities = {
            0: 0.1,  // 10% de chance de gros glitch
            1: 0.3,  // 30% de chance de gros glitch
            2: 0.5   // 50% de chance de gros glitch
        }

        let currentLevel = level
        let currentInterval = intervals[level] || intervals[0]
        let currentBigGlitchProb = bigGlitchProbabilities[level] || bigGlitchProbabilities[0]

        const triggerNextGlitch = () => {
            // Déterminer si c'est un gros glitch ou un petit
            const isBigGlitch = Math.random() < currentBigGlitchProb
            
            // Déclencher le glitch approprié
            if (isBigGlitch) {
                this.triggerBigGlitch()
            } else {
                this.triggerGlitch()
            }

            // Programmer le prochain glitch
            const nextDelay = Math.random() * (currentInterval.max - currentInterval.min) + currentInterval.min
            this.glitchTimeout = setTimeout(triggerNextGlitch, nextDelay)
        }

        // Démarrer le premier glitch
        triggerNextGlitch()

        // Retourner un objet avec des méthodes pour contrôler les glitches
        return {
            stop: () => {
                if (this.glitchTimeout) {
                    clearTimeout(this.glitchTimeout)
                    this.glitchTimeout = null
                }
            },
            setFrequencyLevel: (newLevel) => {
                if (newLevel >= 0 && newLevel <= 2) {
                    currentLevel = newLevel
                    currentInterval = intervals[newLevel]
                    currentBigGlitchProb = bigGlitchProbabilities[newLevel]
                    
                    // Si un glitch est déjà programmé, on l'annule et on en programme un nouveau
                    if (this.glitchTimeout) {
                        clearTimeout(this.glitchTimeout)
                        const nextDelay = Math.random() * (currentInterval.max - currentInterval.min) + currentInterval.min
                        this.glitchTimeout = setTimeout(triggerNextGlitch, nextDelay)
                    }
                } else {
                    console.warn('Niveau de fréquence invalide. Utilisez 0 (faible), 1 (moyen) ou 2 (fort).')
                }
            },
            getCurrentLevel: () => currentLevel
        }
    }

    render(camera = this.camera) {
        this.renderPass.camera = camera

        this.composer.render()
    }

    resize(width, height) {
        const scaleFactor = 0.8
        this.composer.setSize(width * scaleFactor, height * scaleFactor)
    }

    destroy() {
        this.composer.passes.forEach(pass => {
            if (pass.dispose) pass.dispose()
        })
        this.composer = null
        this.scene = null
        this.camera = null
    }
}
