import EventEmitter from '../../Utils/EventEmitter.js';

export class ChoicesManager {
    constructor() {
        this.container = null;

        this.buttons = [];
        this.eventEmitter = new EventEmitter();
        
        this.init();
    }
    
    init() {
        this.container = document.createElement('div');
        this.container.classList.add('choices-container');
        
        const styleEl = document.createElement('style');
        document.head.appendChild(styleEl);

        this.hide();

        document.body.appendChild(this.container);
    }

    handleChoice(choiceIndex, resolve) {
        if (resolve && typeof resolve === 'function') {
            resolve(choiceIndex);
        }

        this.eventEmitter.trigger('choice', choiceIndex);

        if (this._currentKeyHandler) {
            document.removeEventListener('keydown', this._currentKeyHandler);
            this._currentKeyHandler = null;
        }
        
        if (this.container && this.container.parentNode) {
            this.container.innerHTML = '';
            this.container.parentNode.removeChild(this.container);
        }

        this.buttons.forEach(button => {
            if (button.clickHandler) {
                button.removeEventListener('click', button.clickHandler);
            }
        });
        this.buttons = [];
        
        this.container = document.createElement('div');
        this.container.classList.add('choices-container');
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

    }
    

    showChoices(options, callback) {
        return new Promise((resolve) => {
            this.container.innerHTML = '';
            this.buttons = [];

            this.eventEmitter.off('choice');

            if (options.title) {
                const titleElement = document.createElement('h2');
                titleElement.classList.add('choices-title');
                titleElement.textContent = options.title;
                this.container.appendChild(titleElement);
            }

            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = 'row';
            buttonsContainer.style.gap = '60px';
            buttonsContainer.style.justifyContent = 'center';

            const button1Wrapper = document.createElement('div');
            button1Wrapper.style.position = 'relative';
            
            const button1 = document.createElement('button');
            button1.classList.add('choice-button', 'btn-base');
            button1.innerHTML = `<span>${options.choice1}</span>`;
            button1.clickHandler = () => {
                this.handleChoice(1, resolve);
            };
            button1.addEventListener('click', button1.clickHandler);
            
            const keyHint1 = document.createElement('div');
            keyHint1.classList.add('key-hint');
            keyHint1.innerHTML = 'Appuyez sur <span class="key-letter">U</span>';
            
            button1Wrapper.appendChild(button1);
            button1Wrapper.appendChild(keyHint1);

            const button2Wrapper = document.createElement('div');
            button2Wrapper.style.position = 'relative';
            
            const button2 = document.createElement('button');
            button2.classList.add('choice-button', 'btn-base'); 
            button2.innerHTML = `<span>${options.choice2}</span>`;
            button2.clickHandler = () => {
                this.handleChoice(2, resolve);
            };
            button2.addEventListener('click', button2.clickHandler);
            
            const keyHint2 = document.createElement('div');
            keyHint2.classList.add('key-hint');
            keyHint2.innerHTML = 'Appuyez sur <span class="key-letter">I</span>';
            
            button2Wrapper.appendChild(button2);
            button2Wrapper.appendChild(keyHint2);

            buttonsContainer.appendChild(button1Wrapper);
            buttonsContainer.appendChild(button2Wrapper);
            
            this.container.appendChild(buttonsContainer);
            
            this.buttons.push(button1, button2);

            if (!document.body.contains(this.container)) {
                document.body.appendChild(this.container);
            }

            this.container.style.display = 'flex';

            const keyHandler = (event) => {
                if (event.key === 'u' || event.key === 'U') {
                    document.removeEventListener('keydown', keyHandler);
                    this._currentKeyHandler = null;
                    this.handleChoice(1, resolve);
                } else if (event.key === 'i' || event.key === 'I') {
                    document.removeEventListener('keydown', keyHandler);
                    this._currentKeyHandler = null;
                    this.handleChoice(2, resolve);
                }
            };

            if (this._currentKeyHandler) {
                document.removeEventListener('keydown', this._currentKeyHandler);
            }

            this._currentKeyHandler = keyHandler;

            document.addEventListener('keydown', this._currentKeyHandler);
        })
    }

    onChoice(callback) {
        this.eventEmitter.on('choice', callback);
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }

    setButtonStyles(styles) {
        const styleProps = Object.entries(styles);
        
        this.buttons.forEach(button => {
            styleProps.forEach(([prop, value]) => {
                button.style[prop] = value;
            });
        });
    }
    
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.eventEmitter.off('choice');
        this.buttons = [];
    }
}