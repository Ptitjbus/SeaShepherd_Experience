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
        
        // Add styles
        const styles = `
            .choices-container {
                position: fixed;
                bottom: 50px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 20px;
                z-index: 1000;
            }
            
            .choice-button {
                padding: 12px 24px;
                background-color: #0077cc;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            .choice-button:hover {
                background-color: #005fa3;
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
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
    handleChoice(choiceIndex, callback) {
        // Trigger callback if provided
        if (callback && typeof callback === 'function') {
            callback(choiceIndex);
        }
        
        // Emit event
        this.eventEmitter.trigger('choice', choiceIndex);
        
        // Remove all buttons from container to prevent triggering them again
        this.container.innerHTML = '';
        
        // Remove event listeners
        this.buttons.forEach(button => {
            button.removeEventListener('click', button.clickHandler);
        });
        this.buttons = [];
        
        // Détacher le container du DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            
            // Recréer un nouveau container pour les futurs choix
            this.container = document.createElement('div');
            this.container.classList.add('choices-container');
            this.container.style.display = 'none'; // Caché par défaut
        }

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
        // Clear previous buttons
        this.container.innerHTML = '';
        this.buttons = [];
        
        // Create first button
        const button1 = document.createElement('button');
        button1.classList.add('choice-button');
        button1.textContent = options.choice1;
        button1.clickHandler = () => {
            this.handleChoice(1, callback);
        };
        button1.addEventListener('click', button1.clickHandler);
        
        // Create second button
        const button2 = document.createElement('button');
        button2.classList.add('choice-button');
        button2.textContent = options.choice2;
        button2.clickHandler = () => {
            this.handleChoice(2, callback);
        };
        button2.addEventListener('click', button2.clickHandler);
        
        // Add buttons to container
        this.container.appendChild(button1);
        this.container.appendChild(button2);
        this.buttons.push(button1, button2);
        
        // Ajouter le container au DOM s'il n'y est pas déjà
        if (!document.body.contains(this.container)) {
            document.body.appendChild(this.container);
        }
        
        // Afficher le container
        this.container.style.display = 'flex';
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