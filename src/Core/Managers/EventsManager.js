import EventEmitter from '../../Utils/EventEmitter'

/**
 * Classe gérant les alertes du système via des éléments dialog HTML5
 */
export default class EventsManager extends EventEmitter {

    constructor() {
        super()
        this.activeDialogs = []
        this.dialogCounter = 0
        
        // Vérifier que le conteneur existe
        this.dialogContainer = document.getElementById('dialog-container')
        if (!this.dialogContainer) {
            this.dialogContainer = document.createElement('div')
            this.dialogContainer.id = 'dialog-container'
            document.body.appendChild(this.dialogContainer)
        }

        // Listener global pour la touche Entrée
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
    
    /**
     * Gère les événements clavier pour fermer la popin avec la touche Entrée
     * @param {KeyboardEvent} event - L'événement clavier
     */
    handleKeyDown(event) {
        // Si la touche Entrée est pressée et qu'une dialogue est active
        if (event.key === 'Enter' && this.activeDialogs.length > 0) {
            // Fermer la dernière popin affichée (la plus récente)
            const lastDialog = this.activeDialogs[this.activeDialogs.length - 1];
            this.closeDialog(lastDialog.id);
            event.preventDefault();
        }
    }

    /**
     * Ferme une popin spécifique par son ID
     * @param {string} dialogId - L'ID de la popin à fermer
     */
    closeDialog(dialogId) {
        const dialogInfo = this.activeDialogs.find(d => d.id === dialogId);
        if (!dialogInfo) return;

        const dialog = dialogInfo.element;
        dialog.classList.remove('popin-visible');
        
        // Attendre la fin de l'animation avant de fermer
        setTimeout(() => {
            dialog.close();
            dialog.remove();
            this.activeDialogs = this.activeDialogs.filter(d => d.id !== dialogId);
            this.trigger('dialogClosed', dialogId);
        }, 400);
    }
    
    /**
     * Affiche une alerte via un élément dialog HTML5
     * @param {string} message - Message à afficher
     * @param {string} type - Type d'alerte (par défaut 'information')
     * @param {string} title - Titre optionnel
     * @returns {string} - L'ID de la dialog créée
     */
    displayAlert(message = null, type = 'information', title = null) {
        const displayMessage = message || 'Information';

        // Récupérer et cloner le template
        const template = document.getElementById('dialog-template');
        const dialog = template.content.querySelector('dialog').cloneNode(true);
        
        // Générer un ID unique
        const dialogId = `dialog-${++this.dialogCounter}`;
        dialog.id = dialogId;
        dialog.querySelector('.dialog-content').innerHTML = displayMessage;
        
        // Supprimer le bouton de fermeture s'il existe
        const closeButton = dialog.querySelector('button[data-action="close"]');
        if (closeButton) {
            closeButton.remove();
        }

        // Ajouter une classe basée sur le type
        if (type) {
            dialog.classList.add(`type-${type}`);
        }

        // Ajouter au conteneur
        this.dialogContainer.appendChild(dialog);

        // Ouvrir la dialog
        dialog.showModal();

        // Animation d'apparition
        setTimeout(() => {
            dialog.classList.add('popin-visible');
        }, 10);

        // Conserver une référence
        this.activeDialogs.push({
            id: dialogId,
            element: dialog
        });

        this.trigger('dialogShown', dialogId);
        return dialogId;
    }

    closeAllDialogs() {
        this.activeDialogs.forEach(dialog => {
            dialog.element.classList.remove('popin-visible');
            
            setTimeout(() => {
                dialog.element.close();
                dialog.element.remove();
            }, 400);
        });
        this.activeDialogs = [];
    }

    openWindow(url) {
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
            newWindow.focus();
        } else {
            console.error('La fenêtre n\'a pas pu être ouverte. Vérifiez que les fenêtres contextuelles ne sont pas bloquées.');
        }
    }

    closeWindow() {
        window.close();
    }

    destroy() {
        // Supprimer l'écouteur d'événement global pour éviter les fuites de mémoire
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        this.closeAllDialogs();
        if (this.dialogContainer) {
            this.dialogContainer.remove();
            this.dialogContainer = null;
        }
    }
}