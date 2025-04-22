import EventEmitter from './EventEmitter';

/**
 * Classe gérant les alertes du système via window.alert()
 */
export default class EventsManager extends EventEmitter {

    constructor() {
        super();
    }
    
    /**
     * Affiche une alerte simple
     * @param {string} message - Message à afficher
     * @param {string} title - Titre optionnel
     * @returns {boolean} - Toujours true
     */
    displayPopin(message = null, title = null) {
        const displayMessage = message || 'Information';
        const fullMessage = title ? `${title}\n\n${displayMessage}` : displayMessage;
        
        window.alert(fullMessage);
        return true;
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
    }
}