import App from '../../App'

export default class StoryManager {
    constructor() {
        this.app = new App()
        this.experienceStarted = false

        this.init()
    }

    init() {}

    async startExperience() {
        if (this.experienceStarted) return

        this.experienceStarted = true

        this.app.startOverlay.classList.add('hidden')
        this.app.canvas.style.opacity = '1'

        this.app.soundManager.playMusic('background_intro')

        await this.app.soundManager.playVoiceLine('1-INTRO')
        

        await this.app.choicesManager.showChoices({
            choice1: "Dites moi",
            choice2: "Non pas vraiment"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('1.1-INTRO-CHOICE-1');
            } else {
                await this.app.soundManager.playVoiceLine('1.2-INTRO-CHOICE-2');
            }
        });

        await this.app.soundManager.playVoiceLine('2-INTRO-VOUS-AVEZ-HATE')

        await this.app.choicesManager.showChoices({
            choice1: "Pour l'instant je suis pas convaincu …",
            choice2: "Ouais carrément !"
        }).then(async (choiceIndex) => {
            if (choiceIndex === 1) {
                await this.app.soundManager.playVoiceLine('2.1-PAS-CONVAINCU');
            } else {
                await this.app.soundManager.playVoiceLine('2.2-OUAI-CARREMENT');
            }
        });
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
