import EventEmitter from '../../Utils/EventEmitter'

/**
 * Classe gérant les alertes du système via des éléments dialog HTML5
 */
export default class EventsManager extends EventEmitter {

    constructor() {
        super()
        this.activeDialogs = []
        this.dialogCounter = 0
        
        // Créer un conteneur pour les dialogs si nécessaire
        this.initDialogContainer()
    }
    
    initDialogContainer() {
        this.dialogContainer = document.getElementById('dialog-container')
        if (!this.dialogContainer) {
            this.dialogContainer = document.createElement('div')
            this.dialogContainer.id = 'dialog-container'
            document.body.appendChild(this.dialogContainer)
            
            // Ajouter le style pour le conteneur
            const style = document.createElement('style')
            style.textContent = `
                #dialog-container {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                    pointer-events: none;
                }
                
                #dialog-container dialog {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    border: 3px solid #ff2a2a;
                    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.2);
                    background-color: rgba(20, 0, 0, 0.9);
                    color: #f0f0f0;
                    padding: 25px;
                    border-radius: 0;
                    max-width: 450px;
                    font-family: 'Sans serif', monospace;
                    margin: 0;
                    pointer-events: auto;
                }
                
                #dialog-container dialog::backdrop {
                    background-color: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(3px);
                }
                
                #dialog-container dialog h3 {
                    margin-top: 0;
                    color: #ff2a2a;
                    border-bottom: 2px solid #ff2a2a;
                    padding-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 1.2em;
                }
                
                #dialog-container dialog .dialog-content {
                    margin: 20px 0;
                    line-height: 1.5;
                    text-shadow: 0 0 5px rgba(255, 0, 0, 0.3);
                }
                
                #dialog-container dialog button {
                    background-color: #ff2a2a;
                    color: black;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 0;
                    cursor: pointer;
                    font-family: 'Sans serif', monospace;
                    float: right;
                    text-transform: uppercase;
                    font-weight: bold;
                    letter-spacing: 1px;
                    transition: all 0.3s ease;
                }
                
                #dialog-container dialog button:hover {
                    background-color: #ff0000;
                    box-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
                    transform: scale(1.05);
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.2); }
                    50% { box-shadow: 0 0 25px rgba(255, 0, 0, 0.7), 0 0 50px rgba(255, 0, 0, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.2); }
                }
                
                #dialog-container dialog {
                    animation: pulse 2s infinite;
                }
            `
            document.head.appendChild(style)
        }
    }
    
    /**
     * Affiche une alerte via un élément dialog HTML5
     * @param {string} message - Message à afficher
     * @param {string} title - Titre optionnel
     * @returns {string} - L'ID de la dialog créée
     */
    displayAlert(message = null, title = null) {
        const displayMessage = message || 'Information'
        const displayTitle = title || 'Message'
        
        // Créer la dialog
        const dialog = document.createElement('dialog')
        const dialogId = `dialog-${++this.dialogCounter}`
        dialog.id = dialogId
        
        // Construire le contenu
        dialog.innerHTML = `
            <h3>${displayTitle}</h3>
            <div class="dialog-content">${displayMessage}</div>
            <button type="button" data-action="close">OK</button>
        `
        
        // Ajouter au conteneur
        this.dialogContainer.appendChild(dialog)
        
        // Gérer la fermeture
        const closeButton = dialog.querySelector('button[data-action="close"]')
        closeButton.addEventListener('click', () => {
            dialog.close()
            dialog.remove()
            this.activeDialogs = this.activeDialogs.filter(d => d.id !== dialogId)
            this.trigger('dialogClosed', dialogId)
        })
        
        // Ouvrir la dialog
        dialog.showModal()
        
        // Conserver une référence
        this.activeDialogs.push({
            id: dialogId,
            element: dialog
        })
        
        this.trigger('dialogShown', dialogId)
        return dialogId
    }

    closeAllDialogs() {
        this.activeDialogs.forEach(dialog => {
            dialog.element.close()
            dialog.element.remove()
        })
        this.activeDialogs = []
    }

    openWindow(url) {
        const newWindow = window.open(url, '_blank')
        if (newWindow) {
            newWindow.focus()
        } else {
            console.error('La fenêtre n\'a pas pu être ouverte. Vérifiez que les fenêtres contextuelles ne sont pas bloquées.')
        }
    }

    closeWindow() {
        window.close()
    }

    destroy() {
        this.closeAllDialogs()
        if (this.dialogContainer) {
            this.dialogContainer.remove()
            this.dialogContainer = null
        }
    }
}