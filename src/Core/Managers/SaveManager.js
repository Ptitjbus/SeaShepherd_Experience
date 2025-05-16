export class SaveManager {

    constructor() {}

    init() {}

    saveProgress(step) {
        try {
            const savedData = {
                step: step,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('seaShepherdProgress', JSON.stringify(savedData));
            console.log(`Progression sauvegardée: ${step}`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la progression:', error);
        }
    }

    loadProgress() {
        try {
            const savedData = localStorage.getItem('seaShepherdProgress');
            if (!savedData) return null;
            
            const parsedData = JSON.parse(savedData);
            
            // Vérifier si la sauvegarde date de moins de 7 jours
            const currentTime = new Date().getTime();
            const savedTime = parsedData.timestamp || 0;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
            
            if (currentTime - savedTime > maxAge) {
                console.log('Sauvegarde expirée, suppression...');
                this.clearProgress();
                return null;
            }
            
            console.log(`Progression chargée: ${parsedData.step}`);
            return parsedData.step;
        } catch (error) {
            console.error('Erreur lors du chargement de la progression:', error);
            return null;
        }
    }
    
    clearProgress() {
        try {
            localStorage.removeItem('seaShepherdProgress');
            console.log('Progression effacée');
        } catch (error) {
            console.error('Erreur lors de la suppression de la progression:', error);
        }
    }
}