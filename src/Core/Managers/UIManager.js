import App from '../../App.js'
import EventEmitter from '../../Utils/EventEmitter.js'

export class UiManager extends EventEmitter {
    constructor() {
        super()
        this.app = new App()
        this.init()

        this.passedKeysTutorial = false
        this.passedMouseTutorial = false

        this.keyHintContainer = null
        this.currentKeyHint = null
        this.createKeyHintSystem()
    }
    
    init() {
        const container = document.getElementById('choices-container')
        container.style.display = 'none'
    }

    createKeyHintSystem() {
        this.keyHintContainer = document.createElement('div')
        this.keyHintContainer.className = 'tutorial-container'
        this.keyHintContainer.id = 'interaction-keyhint-container'
        this.keyHintContainer.style.top = '50%'
        this.keyHintContainer.style.color = '#fff'
        document.body.appendChild(this.keyHintContainer)
    }

    showKeyHint(key, labelText) {
        // Permettre de remplacer un hint existant avec la même clé
        if(this.currentKeyHint && this.currentKeyHint.key === key && this.currentKeyHint.labelText === labelText){
            return; // Même hint, pas besoin de le réafficher
        }

        this.currentKeyHint = document.createElement('div')

        this.currentKeyHint.style.position = 'fixed'
        this.currentKeyHint.style.top = '50%'

        this.keyHintContainer.innerHTML = `
        <div class="btn-base">
            <span class="key-letter">${key}</span>
            <span class="label">${labelText}</span>
        </div>
        `

        this.keyHintContainer.classList.add('show-tutorial')
        this.currentKeyHint = { key, labelText }
    }

    hideKeyHint() {
        if (this.keyHintContainer) {
            this.keyHintContainer.classList.remove('show-tutorial')
            this.currentKeyHint = null

            setTimeout(() => {
                this.keyHintContainer.innerHTML = ''
            }, 300)
        }
    }

    destroy() {
        this.hideKeyHint()
        if (this.keyHintContainer && this.keyHintContainer.parentNode) {
            this.keyHintContainer.parentNode.removeChild(this.keyHintContainer)
        }
        this.keyHintContainer = null
        this.currentKeyHint = null
    }

    handleChoice(choiceIndex, resolve) {
        if (resolve && typeof resolve === 'function') {
            resolve(choiceIndex)
        }

        if (this._currentKeyHandler) {
            document.removeEventListener('keydown', this._currentKeyHandler)
            this._currentKeyHandler = null
        }

        const container = document.getElementById('choices-container')
        setTimeout(() => container.style.display = 'none', 500)
    }

    showTutorial() {
        const container = document.getElementById('keys-tutorial-container')
        container.classList.add('show-tutorial')

        const containerKeys = container.querySelectorAll('.key-letter')

        // Track which keys have been pressed
        const pressedKeys = new Set();

        document.addEventListener('keydown', (event) => {
            if (this.passedKeysTutorial) return
            const keyPressed = event.key.toLowerCase();
            containerKeys.forEach(key => {
                if (keyPressed === key.dataset.key.toLowerCase()) {
                    key.classList.add('pressed');
                    pressedKeys.add(keyPressed);
                    if (pressedKeys.size === containerKeys.length) {
                        const btnBase = container.querySelector('.btn-base')
                        btnBase.classList.add('all-keys-pressed');
                        this.passedKeysTutorial = true
                        setTimeout(() => container.style.display = 'none', 800);
                        setTimeout(() => this.showMouseTutorial(), 1000);
                    } 
                }
            });
        });
    }

    showMouseTutorial() {
        const container = document.getElementById('mouse-tutorial-container')
        container.classList.add('show-tutorial')

        document.addEventListener('mousemove', (event) => {
            if (this.passedMouseTutorial) return
            this.passedMouseTutorial = true
            const container = document.getElementById('mouse-tutorial-container')
            const btnBase = container.querySelector('.btn-base')
            btnBase.classList.add('all-keys-pressed');
            setTimeout(() => container.style.display = 'none', 800);
        })
    }

    showChoices(options, callback) {
        return new Promise((resolve) => {

            const container = document.getElementById('choices-container')
            container.style.display = 'flex'

            if (options.title) {
                const titleElement = document.getElementById('choices-title')
                titleElement.textContent = options.title
            }

            const button1Wrapper = document.getElementById('dialog-button-1')
            const button2Wrapper = document.getElementById('dialog-button-2')

            const button1 = button1Wrapper.querySelector('button')
            const button1Text = button1.querySelector('span')

            const button2 = button2Wrapper.querySelector('button')
            const button2Text = button2.querySelector('span')

            button1Text.textContent = options.choice1
            button2Text.textContent = options.choice2

            if (options.disabledIndex === 0) {
                button1.setAttribute('disabled', 'disabled')
                button1.classList.add('disabled')
            }

            button1.addEventListener('click', () => this.handleChoice(1, resolve))            

            button2Text.innerText = options.choice2
            if (options.disabledIndex === 1) {
                button2.setAttribute('disabled', 'disabled')
                button2.classList.add('disabled')
            }

            button2.addEventListener('click', () => this.handleChoice(2, resolve))
        
            const keyHandler = (event) => {
                if (event.code === 'KeyU') {
                    if (options.disabledIndex === 0) {
                        button1.classList.add('shake')
                        this.app.postProcessing.triggerGlitch()
                        setTimeout(() => button1.classList.remove('shake'), 200)
                    } else {
                        document.removeEventListener('keydown', keyHandler)
                        this._currentKeyHandler = null
                        button1.classList.add('choosed')
                        setTimeout(() => button1.classList.remove('choosed'), 500)
                        this.handleChoice(1, resolve)
                    }
                } else if (event.code === 'KeyI') {
                    if (options.disabledIndex === 1) {
                        button2.classList.add('shake')
                        this.app.postProcessing.triggerGlitch()
                        setTimeout(() => button2.classList.remove('shake'), 200)
                    } else {
                        document.removeEventListener('keydown', keyHandler)
                        this._currentKeyHandler = null
                        button2.classList.add('choosed')
                        setTimeout(() => button2.classList.remove('choosed'), 500)
                        this.handleChoice(2, resolve)
                    }
                }
            }

            if (this._currentKeyHandler) {
                document.removeEventListener('keydown', this._currentKeyHandler)
            }

            this._currentKeyHandler = keyHandler

            document.addEventListener('keydown', this._currentKeyHandler)
        })
    }

    /**
     * Affiche une icône SVG avec du texte dans le HUD pour les interactions des panels
     * @param {string} svgPath - Chemin vers le fichier SVG
     * @param {string} text - Texte à afficher à côté de l'icône
     */
    showPanelHint(svgPath) {
        // Créer ou récupérer l'élément de hint pour les panels
        let panelHint = document.getElementById('panel-hint')
        
        if (!panelHint) {
            panelHint = document.createElement('div')
            panelHint.id = 'panel-hint'
            panelHint.className = 'panel-hint'
            panelHint.innerHTML = `
                <div class="panel-hint-content">
                    <img class="panel-hint-icon" src="${svgPath}" alt="Hint Icon">
                </div>
            `
            document.body.appendChild(panelHint)
        }
        
        const icon = panelHint.querySelector('.panel-hint-icon')
        const textElement = panelHint.querySelector('.panel-hint-text')
        
        icon.src = svgPath
        
        panelHint.classList.add('visible')
    }

    /**
     * Cache le hint des panels
     */
    hidePanelHint() {
        const panelHint = document.getElementById('panel-hint')
        if (panelHint) {
            panelHint.classList.remove('visible')
        }
    }
}