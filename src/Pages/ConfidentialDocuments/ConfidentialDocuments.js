import EventEmitter from '../../Utils/EventEmitter'

export default class ConfidentialDocuments extends EventEmitter {
  constructor() {
    super()

    // Vérifie si nous sommes sur la page des documents confidentiels
    this.active = window.location.pathname === "http://localhost:5173/confidential-documents";

    this.eventsManager = new EventsManager();

    if(this.active) {
      this.init();
    }
  }

  init() {
    console.log('Page de documents confidentiels initialisée');
    
    // Créer un overlay pour l'effet d'erreur système
    const errorOverlay = document.createElement('div');
    errorOverlay.style.position = 'fixed';
    errorOverlay.style.top = '0';
    errorOverlay.style.left = '0';
    errorOverlay.style.width = '100%';
    errorOverlay.style.height = '100%';
    errorOverlay.style.backgroundColor = '#000';
    errorOverlay.style.color = '#33ff33';
    errorOverlay.style.fontFamily = 'Courier New, monospace';
    errorOverlay.style.padding = '50px';
    errorOverlay.style.boxSizing = 'border-box';
    errorOverlay.style.zIndex = '9999';
    errorOverlay.style.display = 'none';
    
    errorOverlay.innerHTML = `
        <h2>ERREUR SYSTÈME</h2>
        <p>Intrusion détectée. Connexion interrompue.</p>
        <p>Code d'erreur: 0xC000021A</p>
        <p>Votre adresse IP a été enregistrée.</p>
        <div id="countdown">5</div>
    `;
    
    document.body.appendChild(errorOverlay);
    
    setTimeout(() => {
        // Afficher l'overlay d'erreur
        errorOverlay.style.display = 'block';
        
        // Décompte avant redirection
        let count = 5;
        const countdownElement = document.getElementById('countdown');
        
        const interval = setInterval(() => {
            count--;
            countdownElement.textContent = count;
            
            if (count <= 0) {
                clearInterval(interval);
                window.location.href = "/";
            }
        }, 1000);
    }, 5000);
    
    this.addEventListeners();
  }
  
  addEventListeners() {}
  
  playStaticSound() {

  }

  destroy() {
    this.eventsManager = null;
    console.log('Page de documents confidentiels détruite');
  }
}