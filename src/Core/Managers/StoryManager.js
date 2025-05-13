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
        this.clearTasks()

        this.activeTasks.push('aquarium')
        
        this.app.soundManager.playMusic('aquarium')
        await this.sleep(2000)
        if (!this.checkActiveTask('aquarium')) return
        await this.app.soundManager.playVoiceLine('5.1_DAUPHINS')

        this.activeTasks = this.activeTasks.filter(task => task !== 'aquarium')
    }

    async sleep(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    async checkActiveTask(task){
        if (!this.activeTasks.includes(task)) return false
        return true
    }

    async clearTasks(){
        this.app.soundManager.stopAllCustomSounds(true,true)
        this.app.soundManager.stopAllMusicSounds(true,true)
        this.activeTasks = []
    }

    endExperience() {
        if (this.experienceEnded) return
        this.experienceEnded = true

        this.endOverlay.classList.remove('hidden')

        void this.endOverlay.offsetWidth

        this.canvas.style.opacity = '0'

        setTimeout(() => {
            this.endOverlay.classList.add('visible')
        }, 100)
    }

    destroy() {}
}
