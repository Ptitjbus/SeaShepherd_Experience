import App from '../../App'

export default class StoryManager {
    constructor() {
        this.app = new App()
        this.experienceStarted = false

        this.activeTasks = []

        this.init()
    }

    init() {}

    async startExperience() {
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.activeTasks.push('intro')

        this.app.startOverlay.classList.add('hidden')
        this.app.canvas.style.opacity = '1'

        this.app.soundManager.playMusic('background_intro')

        if (!this.checkActiveTask('intro')) return
        
        await this.app.soundManager.playVoiceLine('1_INTRO')

        if (!this.checkActiveTask('intro')) return
        
        await this.app.choicesManager.showChoices({
            choice1: "Dites moi",
            choice2: "Non pas vraiment"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('2.1_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('2.2_CHOIX2');
            }
        });

        if (!this.checkActiveTask('intro')) return

        await this.app.soundManager.playVoiceLine('3.1_VOUSAVEZHATE')

        if (!this.checkActiveTask('intro')) return

        await this.app.choicesManager.showChoices({
            choice1: "Pour l'instant je suis pas convaincu …",
            choice2: "Ouais carrément !"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('3.2_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('3.3_CHOIX2');
            }
        });

        if (!this.checkActiveTask('intro')) return
        this.app.soundManager.stopAllMusicSounds(true, true)
        await this.app.mediaManager.playMediaWithGlitch('connexion')
        if (!this.checkActiveTask('intro')) return
        this.app.postProcessing.triggerGlitch()
        if (!this.checkActiveTask('intro')) return
        await this.app.soundManager.playVoiceLine('4_CONNEXION')
        if (!this.checkActiveTask('intro')) return
        this.app.doorManager.triggerOpenDoorByIndex(0)
        this.activeTasks = this.activeTasks.filter(task => task !== 'intro')
    }

    async initAquarium(){
        this.clearTasks(true)

        this.activeTasks.push('aquarium')
        this.app.doorManager.triggerCloseDoorByIndex(0)
        
        this.app.soundManager.playMusic('aquarium')
        await this.sleep(2000)
        if (!this.checkActiveTask('aquarium')) return
        await this.app.soundManager.playVoiceLine('5.1_DAUPHINS')

        if (!this.checkActiveTask('aquarium')) return
        await this.app.choicesManager.showChoices({
            choice1: "Dites m'en plus je veux tout savoir !",
            choice2: "Vous avez rien de plus intéressant ?"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('5.2_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('5.3_CHOIX2');
            }
        });

        if (!this.checkActiveTask('aquarium')) return
        await this.sleep(2000)
        this.app.objectManager.add("Couloir", new THREE.Vector3(0, 0, 0))
        await this.app.soundManager.playVoiceLine('5.4_FINDAUPHIN')
        this.app.doorManager.triggerOpenDoorByIndex(1)
        this.activeTasks = this.activeTasks.filter(task => task !== 'aquarium')
    }

    async initCorridor(){
        this.clearTasks()

        this.activeTasks.push('corridor')
        this.app.soundManager.attachToSpeakers()
        this.app.soundManager.stopAllMusicSounds(true,false)
        await this.app.doorManager.triggerCloseDoorByIndex(1)
        await this.sleep(2000)
        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.remove("Dauphins")
        this.app.objectManager.removeBoids()

        if (!this.checkActiveTask('corridor')) return
        await this.app.soundManager.playVoiceLine('6.1_PUB')

        if (!this.checkActiveTask('corridor')) return
        await this.app.choicesManager.showChoices({
            choice1: "Lancer la publicité",
            choice2: "Ne pas supporter le musée"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 2) {
                await this.app.soundManager.playVoiceLine('6.2_VIDEO');
            }
        });

        const screenControls = this.app.objectManager.applyVideoToMultipleScreens(
            "Couloir",
            ["Cube_1", "Cube013_1"],
            "pub",
            "pub"
        )
        if (!this.checkActiveTask('corridor')) return
        await screenControls.turnOn()
        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.add("Aquaturtle", new THREE.Vector3(0, 0, 0))
        this.app.objectManager.add("Elevator", new THREE.Vector3(0, 0, 0), {
            playAnimation : false,
            dynamicCollision: true,
        })
        this.app.objectManager.add("Tortue", new THREE.Vector3(0, 0, 0))
        this.app.postProcessing.triggerGlitch()

        if (!this.checkActiveTask('corridor')) return
        await this.app.soundManager.playVoiceLine('6.3_NARRATEURINCOMPREHENSION')

        if (!this.checkActiveTask('corridor')) return
        await this.app.choicesManager.showChoices({
            choice1: "Oui, allons-y !",
            choice2: "J'ai l'impression qu'on ne me dit pas tout"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('6.4_CHOIX1');
            } else {
                await this.app.soundManager.playVoiceLine('6.5_CHOIX2');
            }
        });

        await this.app.doorManager.triggerOpenDoorByIndex(2)
    }

    async initTurtleBottom(){
        this.clearTasks()

        this.activeTasks.push('aquaturtle')
        this.app.soundManager.attachToSpeakers()
        this.app.soundManager.stopAllMusicSounds(true,false)
        await this.app.doorManager.triggerCloseDoorByIndex(2)
        await this.sleep(2000)
        this.app.postProcessing.triggerGlitch()
        this.app.objectManager.remove("Couloir")

        this.app.soundManager.playMusic('aquaturtles')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.soundManager.playVoiceLine('7.1_TORTUES');
    }

    async initElevator(){
        const elevator = this.app.objectManager.get("Elevator")
        console.log(elevator)
        elevator.animations.forEach((clip) => {
            elevator.mixer.clipAction(clip).play()
        })

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.soundManager.playVoiceLine('7.1_TORTUES2');

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('error1')
        await this.app.soundManager.playVoiceLine('7.2_VIDEO')

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('bigvideo')
        await this.app.soundManager.playVoiceLine('7.2_BUG')

        if (!this.checkActiveTask('aquaturtle')) return
        await this.app.choicesManager.showChoices({
            choice1: "C'est trop mignon les tortues !",
            choice2: "Connaître la vérité"
        }).then(async (choiceIndex) => {
            this.app.mediaManager.playMediaWithGlitch('bigvideo')
        });
        await this.app.soundManager.playVoiceLine('7.3_FAKENEWS')
        this.app.postProcessing.triggerBigGlitch()

        if (!this.checkActiveTask('aquaturtle')) return
        this.app.mediaManager.playMediaWithGlitch('error1')
        await this.app.soundManager.playVoiceLine('7.4_INTOX')
        this.app.postProcessing.triggerGlitch()

    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async checkActiveTask(task){
        if (!this.activeTasks.includes(task)) return false
        return true
    }

    async clearTasks(forceStopSounds = false){
        if(forceStopSounds){
            this.app.soundManager.stopAllCustomSounds(true,true)
            this.app.soundManager.stopAllMusicSounds(true,true)
        }
        this.activeTasks = []
    }

    endExperience() {
        if (this.experienceEnded) return
        this.experienceEnded = true

        this.app.endOverlay.classList.remove('hidden')

        void this.app.endOverlay.offsetWidth

        this.app.canvas.style.opacity = '0'

        setTimeout(() => {
            this.app.endOverlay.classList.add('visible')
        }, 100)
    }

    destroy() {}
}
