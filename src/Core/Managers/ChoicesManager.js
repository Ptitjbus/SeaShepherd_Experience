import EventEmitter from '../../Utils/EventEmitter.js';

export class ChoicesManager {
    constructor() {
        this.container = null;
        this.buttons = [];
        this.eventEmitter = new EventEmitter();
        
        this.init();
    }
    
    init() {
        // Create container for choices
        this.container = document.createElement('div');
        this.container.classList.add('choices-container');
        
        
        
        const styleEl = document.createElement('style');
        document.head.appendChild(styleEl);
        
        // Hide by default
        this.hide();
        
        // Append to DOM
        document.body.appendChild(this.container);
    }
    
    /**
     * Handle a choice selection
     * @param {number} choiceIndex - The index of the selected choice (1 or 2)
     * @param {Function} callback - Callback to execute with the choice
     */
    handleChoice(choiceIndex, resolve) {
        // Résoudre la Promise avec le choix sélectionné
        if (resolve && typeof resolve === 'function') {
            resolve(choiceIndex);
        }

        // Emit event
        this.eventEmitter.trigger('choice', choiceIndex);
        
        // Supprimer le gestionnaire de touches
        if (this._currentKeyHandler) {
            document.removeEventListener('keydown', this._currentKeyHandler);
            this._currentKeyHandler = null;
        }
        
        // Complètement détruire et supprimer le container du DOM
        if (this.container && this.container.parentNode) {
            this.container.innerHTML = ''; // D'abord vider le contenu
            this.container.parentNode.removeChild(this.container);
        }
        
        // Supprimer les écouteurs d'événement des boutons
        this.buttons.forEach(button => {
            if (button.clickHandler) {
                button.removeEventListener('click', button.clickHandler);
            }
        });
        this.buttons = [];
        
        // Recréer un tout nouveau container
        this.container = document.createElement('div');
        this.container.classList.add('choices-container');
        this.container.style.display = 'none'; // Caché par défaut
        document.body.appendChild(this.container);

        // === Remettre le pointer lock ===
        const canvas = document.querySelector('canvas');
        if (canvas && typeof canvas.requestPointerLock === 'function') {
            canvas.requestPointerLock();
        }
    }
    
    /**
     * Show choice buttons with the given options
     * @param {Object} options - Configuration for the choices
     * @param {string} options.choice1 - Text for the first button
     * @param {string} options.choice2 - Text for the second button
     * @param {Function} callback - Function to call when a choice is made, receives the choice index (1 or 2)
     */
    showChoices(options, callback) {
        return new Promise((resolve) => {
            // Clear previous buttons
            this.container.innerHTML = '';
            this.buttons = [];

            // Tout d'abord, supprimer tous les écouteurs d'événements précédents
            this.eventEmitter.off('choice');

            // Create first button with key hint
            const button1Wrapper = document.createElement('div');
            button1Wrapper.style.position = 'relative';
            
            // Create key hint for button 1
            const keyHint1 = document.createElement('div');
            keyHint1.classList.add('key-hint');
            keyHint1.innerHTML = 'Appuyez sur <span class="key-letter">U</span>';
            
            const button1 = document.createElement('button');
            button1.classList.add('choice-button');
            button1.textContent = options.choice1;
            button1.clickHandler = () => {
                this.handleChoice(1, resolve);
            };
            button1.addEventListener('click', button1.clickHandler);
            
            button1Wrapper.appendChild(keyHint1);
            button1Wrapper.appendChild(button1);

            // Create second button with key hint
            const button2Wrapper = document.createElement('div');
            button2Wrapper.style.position = 'relative';
            
            // Create key hint for button 2
            const keyHint2 = document.createElement('div');
            keyHint2.classList.add('key-hint');
            keyHint2.innerHTML = 'Appuyez sur <span class="key-letter">I</span>';
            
            const button2 = document.createElement('button');
            button2.classList.add('choice-button');
            button2.textContent = options.choice2;
            button2.clickHandler = () => {
                this.handleChoice(2, resolve);
            };
            button2.addEventListener('click', button2.clickHandler);
            
            button2Wrapper.appendChild(keyHint2);
            button2Wrapper.appendChild(button2);

            // Add buttons to container
            this.container.appendChild(button1Wrapper);
            this.container.appendChild(button2Wrapper);
            this.buttons.push(button1, button2);

            // Ajouter le container au DOM s'il n'y est pas déjà
            if (!document.body.contains(this.container)) {
                document.body.appendChild(this.container);
            }

            // Afficher le container
            this.container.style.display = 'flex';

            // Ajouter un gestionnaire pour les touches 1 et 2
            const keyHandler = (event) => {
                if (event.key === 'u' || event.key === 'U') {
                    document.removeEventListener('keydown', keyHandler);
                    this._currentKeyHandler = null; // Important de mettre à null ici
                    this.handleChoice(1, resolve);
                } else if (event.key === 'i' || event.key === 'I') {
                    document.removeEventListener('keydown', keyHandler);
                    this._currentKeyHandler = null; // Important de mettre à null ici
                    this.handleChoice(2, resolve);
                }
            };

            // Supprimer tout gestionnaire keydown précédent (si possible)
            if (this._currentKeyHandler) {
                document.removeEventListener('keydown', this._currentKeyHandler);
            }
            
            // Stocker la référence du nouveau gestionnaire
            this._currentKeyHandler = keyHandler;
            
            // Ajouter le nouveau gestionnaire
            document.addEventListener('keydown', this._currentKeyHandler);
        })
    }
    
    /**
     * Add an event listener for choices
     * @param {Function} callback - Function to call when a choice is made
     */
    onChoice(callback) {
        this.eventEmitter.on('choice', callback);
    }
    
    /**
     * Show the choices container
     */
    show() {
        this.container.style.display = 'flex';

        // Forcer la sortie du pointer lock si actif
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
    
    /**
     * Hide the choices container
     */
    hide() {
        this.container.style.display = 'none';
    }
    
    /**
     * Change the style of the buttons
     * @param {Object} styles - Style properties to apply
     */
    setButtonStyles(styles) {
        const styleProps = Object.entries(styles);
        
        this.buttons.forEach(button => {
            styleProps.forEach(([prop, value]) => {
                button.style[prop] = value;
            });
        });
    }
    
    /**
     * Destroy the choices manager
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.eventEmitter.off('choice');
        this.buttons = [];
    }
}