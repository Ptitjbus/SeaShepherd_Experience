import EventEmitter from '../../Utils/EventEmitter'
import App from '../../App'

/**
 * Classe gérant les alertes du système via des éléments dialog HTML5
 */
export default class EventsManager extends EventEmitter {
    constructor() {
        super()
        this.activeDialogs = []
        this.dialogCounter = 0
        this.app = new App()

        // Vérifier que le conteneur existe
        this.dialogContainer = document.getElementById('dialog-container')
        if (!this.dialogContainer) {
            this.dialogContainer = document.createElement('div')
            this.dialogContainer.id = 'dialog-container'
            document.body.appendChild(this.dialogContainer)
        }
    }


    /**
     * Ferme une popin spécifique par son ID
     * @param {string} dialogId - L'ID de la popin à fermer
     */
    closeDialog(dialogId) {
        const dialogInfo = this.activeDialogs.find(d => d.id === dialogId)
        if (!dialogInfo) return

        const dialog = dialogInfo.element
        dialog.classList.remove('popin-visible')

        // Attendre la fin de l'animation avant de fermer
        setTimeout(() => {
            dialog.close()
            dialog.remove()
            this.activeDialogs = this.activeDialogs.filter(d => d.id !== dialogId)
            this.trigger('dialogClosed', dialogId)
        }, 400)
    }

    /**
     * Affiche une alerte via un élément dialog HTML5
     * @param {string} message - Message à afficher
     * @param {string} type - Type d'alerte (par défaut 'information')
     * @param {string} title - Titre optionnel
     * @returns {string} - L'ID de la dialog créée
     */
    displayAlert(message = null, time = 2000, type = 'information', title = null) {
        message = this.app.translationManager.t(message)
        title = this.app.translationManager.t(title)
        const displayMessage = message || 'Information'

        // Check if template exists, if not create dialog manually
        const template = document.getElementById('dialog-template')
        let dialog

        if (template && template.content) {
            dialog = template.content.querySelector('dialog').cloneNode(true)
        } else {
            // Create dialog manually if template doesn't exist
            dialog = document.createElement('dialog')
            dialog.innerHTML = `
            <div class="dialog-content-wrapper">
                <div class="dialog-title"></div>
                <div class="dialog-content"></div>
            </div>
        `
        }

        // Générer un ID unique
        const dialogId = `dialog-${++this.dialogCounter}`
        dialog.id = dialogId

        // Set content
        const titleElement = dialog.querySelector('.dialog-title')
        const contentElement = dialog.querySelector('.dialog-content')

        if (titleElement && title !== null) titleElement.textContent = title
        if (contentElement) contentElement.innerHTML = displayMessage

        // Ajouter une classe basée sur le type
        if (type) {
            dialog.classList.add(`type-${type}`)
        }

        // Ajouter au conteneur
        this.dialogContainer.appendChild(dialog)

        // Ouvrir la dialog
        dialog.showModal()

        // Animation d'apparition
        setTimeout(() => {
            dialog.classList.add('popin-visible')
        }, 10)

        // Conserver une référence
        this.activeDialogs.push({
            id: dialogId,
            element: dialog,
        })

        this.trigger('dialogShown', dialogId)

        // Attendre la fin de l'animation avant de fermer
        setTimeout(() => {
            this.closeDialog(dialogId)
        }, time)
        
        return dialogId
    }

    closeAllDialogs() {
        this.activeDialogs.forEach(dialog => {
            dialog.element.classList.remove('popin-visible')

            setTimeout(() => {
                dialog.element.close()
                dialog.element.remove()
            }, 400)
        })
        this.activeDialogs = []
    }

    openWindow(url) {
        const newWindow = window.open(url, '_blank')
        if (newWindow) {
            newWindow.focus()
        } else {
            console.error(
                "La fenêtre n'a pas pu être ouverte. Vérifiez que les fenêtres contextuelles ne sont pas bloquées."
            )
        }
    }

    closeWindow() {
        window.close()
    }

    destroy() {
        // Supprimer l'écouteur d'événement global pour éviter les fuites de mémoire
        document.removeEventListener('keydown', this.handleKeyDown.bind(this))

        this.closeAllDialogs()
        if (this.dialogContainer) {
            this.dialogContainer.remove()
            this.dialogContainer = null
        }
    }
}
