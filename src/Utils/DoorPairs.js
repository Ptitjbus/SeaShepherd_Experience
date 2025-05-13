import { Mesh, BoxGeometry, MeshBasicMaterial, DoubleSide, Object3D, Vector3, Quaternion, Euler } from 'three'
import { gsap } from 'gsap'
import App from '../App.js'

export default class DoorPair {
    constructor(scene, position, width = 5, height = 7, colorLeft = 0x707070, colorRight = 0x707070, sliding = true, rotation = 0) {
        this.scene = scene
        this.position = position
        this.width = width
        this.height = height
        this.isSliding = sliding
        this.rotation = rotation // Angle de rotation en radians
        
        // Accéder au physics manager et au sound manager via l'instance d'App
        this.app = new App()
        this.physicsManager = this.app.physicsManager
        this.soundManager = this.app.soundManager
        
        // État des portes
        this.isOpen = false
        this.isAnimating = false
        this.canBeOpened = true
        this.playerInRange = false
        this.canBeTriggeredByPlayer = true
        
        // Identifiants pour les sons de cette porte
        this.doorOpenSoundId = `door_open_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        this.doorCloseSoundId = `door_close_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        
        // Créer un conteneur parent pour faciliter la rotation
        this.container = new Object3D()
        this.container.position.copy(position)
        this.container.rotation.y = rotation
        this.scene.add(this.container)
        
        // Positions locales (relatives au conteneur)
        this.leftInitialPos = new Vector3(-width/2, height/2, 0)
        this.rightInitialPos = new Vector3(width/2, height/2, 0)
        
        // Positions d'ouverture (locales)
        this.leftOpenPos = new Vector3(-width*1.5, height/2, 0)
        this.rightOpenPos = new Vector3(width*1.5, height/2, 0)
        
        // Corps physiques
        this.leftBody = null
        this.rightBody = null
        
        // Créer les portes
        this.createDoors(colorLeft, colorRight)
        
        // Créer un haut-parleur virtuel pour les sons
        this.createSpeaker()
    }
    
    createDoors(colorLeft, colorRight) {
        // Significantly thicker doors for better visibility
        const doorThickness = 0.07; // Increase visual thickness
        const doorGeometry = new BoxGeometry(this.width, this.height, doorThickness);
        
        // Matériaux
        const leftMaterial = new MeshBasicMaterial({ color: colorLeft });
        const rightMaterial = new MeshBasicMaterial({ color: colorRight });
        
        // Mesh des portes
        this.leftDoor = new Mesh(doorGeometry, leftMaterial);
        this.rightDoor = new Mesh(doorGeometry, rightMaterial);
        
        // Positionnement des portes (par rapport au conteneur)
        this.leftDoor.position.copy(this.leftInitialPos);
        this.rightDoor.position.copy(this.rightInitialPos);
        
        // Ajout au conteneur au lieu de la scène directement
        this.container.add(this.leftDoor);
        this.container.add(this.rightDoor);
        
        // Créer les corps physiques via le physics manager
        this.createPhysicsBodies();
    }
    
    createPhysicsBodies() {
        if (!this.physicsManager) return;
        
        // Supprimer les corps physiques existants
        if (this.leftBody) {
            this.physicsManager.removeBody(this.leftBody);
            this.leftBody = null;
        }
        
        if (this.rightBody) {
            this.physicsManager.removeBody(this.rightBody);
            this.rightBody = null;
        }
        
        // Créer des boîtes de collision correctement orientées
        // On va échanger width et depth pour aligner avec la rotation à 90°
        const doorThickness = this.width * 1.1; // Utiliser la largeur de la porte comme épaisseur
        const doorWidth = 1; // Épaisseur de collision dans la direction perpendiculaire
        
        // Obtenir les positions mondiales
        const leftWorldPos = new Vector3();
        this.leftDoor.getWorldPosition(leftWorldPos);
        
        const rightWorldPos = new Vector3();
        this.rightDoor.getWorldPosition(rightWorldPos);
        
        // Utiliser la rotation du conteneur pour l'orientation des portes
        const containerQuat = new Quaternion();
        this.container.getWorldQuaternion(containerQuat);
        
        // Créer des corps physiques avec les dimensions correctement orientées
        this.leftBody = this.physicsManager.createBox(
            {
                width: doorWidth,         // Épaisseur dans l'axe X (après rotation)
                height: this.height * 1.1, // Hauteur inchangée
                depth: doorThickness      // Largeur de la porte devient la profondeur
            },
            {
                mass: 0,  // Corps statique
                position: {
                    x: leftWorldPos.x,
                    y: leftWorldPos.y,
                    z: leftWorldPos.z
                },
                quaternion: {
                    x: containerQuat.x,
                    y: containerQuat.y,
                    z: containerQuat.z,
                    w: containerQuat.w
                },
                material: {
                    friction: 0.5,      // Plus de friction
                    restitution: 0.0    // Pas de rebond
                },
                collisionFlags: 1,      // Flag d'objet statique
                collisionFilterGroup: 1 // Groupe de collision par défaut
            },
            this.leftDoor
        );
        
        this.rightBody = this.physicsManager.createBox(
            {
                width: doorWidth,         // Épaisseur dans l'axe X (après rotation)
                height: this.height * 1.1, // Hauteur inchangée
                depth: doorThickness      // Largeur de la porte devient la profondeur
            },
            {
                mass: 0,  // Corps statique
                position: {
                    x: rightWorldPos.x,
                    y: rightWorldPos.y,
                    z: rightWorldPos.z
                },
                quaternion: {
                    x: containerQuat.x,
                    y: containerQuat.y,
                    z: containerQuat.z,
                    w: containerQuat.w
                },
                material: {
                    friction: 0.5,      // Plus de friction
                    restitution: 0.0    // Pas de rebond
                },
                collisionFlags: 1,      // Flag d'objet statique
                collisionFilterGroup: 1 // Groupe de collision par défaut
            },
            this.rightDoor
        );
    }
    
    setRotation(angle) {
        this.rotation = angle;
        this.container.rotation.y = angle;
        
        // Mettre à jour les corps physiques
        this.updatePhysicsBodies();
    }
    
    updatePhysicsBodies() {
        if (!this.physicsManager) return;
        
        // Remove existing physics bodies
        if (this.leftBody) {
            this.physicsManager.removeBody(this.leftBody);
            this.leftBody = null;
        }
        
        if (this.rightBody) {
            this.physicsManager.removeBody(this.rightBody);
            this.rightBody = null;
        }
        
        // Create new physics bodies at current door positions
        this.createPhysicsBodies();
    }
    
    setOpenable(canOpen) {
        this.canBeOpened = canOpen;
    }
    
    isOpenable() {
        return this.canBeOpened;
    }

    setCanBeTriggered(canTrigger) {
         this.canBeTriggeredByPlayer = canTrigger;
    }

    canBeTriggered() {
        return this.canBeTriggeredByPlayer;
    }
    
    openAnimated(duration = 1.7) {
        if (this.isOpen || this.isAnimating || !this.canBeOpened) return;
        
        this.isAnimating = true;
        
        // Jouer le son d'ouverture
        this.playOpenSound();

        // Keep track of the animation progress
        let progress = 0;
        const updateInterval = 0.1; // Update physics every 10% of animation
        
        gsap.to(this.leftDoor.position, {
            x: this.leftOpenPos.x,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
                // Calculate current progress
                const currentProgress = gsap.getProperty(this.leftDoor.position, "x");
                const normalizedProgress = (currentProgress - this.leftInitialPos.x) / 
                                          (this.leftOpenPos.x - this.leftInitialPos.x);
                
                // Update physics every 10% of animation
                if (normalizedProgress >= progress + updateInterval) {
                    progress = Math.floor(normalizedProgress / updateInterval) * updateInterval;
                    this.updatePhysicsBodies(); // Update both door physics bodies
                }
            }
        });
        
        gsap.to(this.rightDoor.position, {
            x: this.rightOpenPos.x,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                this.isOpen = true;
                this.isAnimating = false;
                this.updatePhysicsBodies(); // Final update when fully open
            }
        });
    }
    
    closeAnimated(duration = 1) {
        if (!this.isOpen || this.isAnimating) return;
        
        this.isAnimating = true;
        
        // Jouer le son de fermeture
        this.playCloseSound();
        
        // Keep track of the animation progress
        let progress = 0;
        const updateInterval = 0.1; // Update physics every 10% of animation
        
        gsap.to(this.leftDoor.position, {
            x: this.leftInitialPos.x,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
                // Calculate current progress
                const currentProgress = gsap.getProperty(this.leftDoor.position, "x");
                const normalizedProgress = 1 - (currentProgress - this.leftOpenPos.x) / 
                                          (this.leftInitialPos.x - this.leftOpenPos.x);
                
                // Update physics every 10% of animation
                if (normalizedProgress >= progress + updateInterval) {
                    progress = Math.floor(normalizedProgress / updateInterval) * updateInterval;
                    this.updatePhysicsBodies(); // Update both door physics bodies
                }
            }
        });
        
        gsap.to(this.rightDoor.position, {
            x: this.rightInitialPos.x,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                this.isOpen = false;
                this.isAnimating = false;
                this.updatePhysicsBodies(); // Final update when fully closed
            }
        });
    }
    
    update(playerPosition) {
        // Vérifier si le joueur est proche
        const isNear = this.isPlayerNear(playerPosition, 7);
        
        // Si le joueur vient d'entrer dans la zone et que la porte peut s'ouvrir
        if (isNear && !this.isOpen && this.canBeTriggeredByPlayer && !this.isAnimating) {
            this.openAnimated();
        }
        // Si le joueur vient de sortir de la zone et que la porte est ouverte
        else if (!isNear && this.isOpen && !this.isAnimating && this.canBeTriggeredByPlayer) {
            this.closeAnimated();
        }
        
        // Mettre à jour l'état de présence du joueur
        this.playerInRange = isNear;
    }
    
    isPlayerNear(playerPosition, threshold = 4) {
        if (!playerPosition) return false;
        
        // Utiliser la position mondiale du conteneur
        const doorCenter = new Vector3();
        this.container.getWorldPosition(doorCenter);
        doorCenter.y = playerPosition.y; // Pour ne comparer que la distance horizontale
        
        // Afficher la distance pour debug
        const distance = doorCenter.distanceTo(playerPosition);
        
        return distance < threshold;
    }
    
    // Nouvelle méthode pour créer un haut-parleur virtuel
    createSpeaker() {
        // Créer un objet 3D invisible qui servira de haut-parleur
        this.speaker = new Object3D()
        this.speaker.position.set(0, this.height / 2, 0) // Placer au milieu de la porte
        this.speaker.userData.is_speaker = true // Marquer comme haut-parleur pour le SoundManager
        this.container.add(this.speaker)
    }
    
    // Nouvelles méthodes pour les sons
    playOpenSound() {
        console.log('Attempting to play door open sound');
        if (!this.soundManager) {
            console.error('SoundManager not available');
            return;
        }
        
        // Arrêter le son de fermeture si en cours
        this.soundManager.stopSound(this.doorCloseSoundId);
        
        console.log('Playing sound:', this.doorOpenSoundId, 'path:', '/audio/doors/open.mp3');
        
        // Jouer le son d'ouverture sur le haut-parleur
        this.soundManager.playSoundOnSpeakers(
            this.doorOpenSoundId,
            '/audio/doors/open.mp3', // Chemin vers le son d'ouverture
            {
                volume: 0.4,
                maxDistance: 15,
                refDistance: 3,
                rolloffFactor: 2
            },
            this.speaker // Assurez-vous de passer explicitement le haut-parleur
        );
        console.log('Sound play command sent');
    }
    
    playCloseSound() {
        console.log('Attempting to play door close sound');
        if (!this.soundManager) {
            console.error('SoundManager not available');
            return;
        }
        
        // Arrêter le son d'ouverture si en cours
        this.soundManager.stopSound(this.doorOpenSoundId);
        
        console.log('Playing sound:', this.doorCloseSoundId, 'path:', '/audio/doors/close.mp3');
        
        // Jouer le son de fermeture sur le haut-parleur
        this.soundManager.playSoundOnSpeakers(
            this.doorCloseSoundId,
            '/audio/doors/close.mp3', // Chemin vers le son de fermeture
            {
                volume: 0.5,
                maxDistance: 15,
                refDistance: 3,
                rolloffFactor: 2
            },
            this.speaker // Assurez-vous de passer explicitement le haut-parleur
        );
        console.log('Sound play command sent');
    }
    
    dispose() {
        // Arrêter les sons liés à cette porte
        if (this.soundManager) {
            this.soundManager.stopSound(this.doorOpenSoundId);
            this.soundManager.stopSound(this.doorCloseSoundId);
        }
        
        if (this.leftBody && this.physicsManager) {
            this.physicsManager.removeBody(this.leftBody);
        }
        
        if (this.rightBody && this.physicsManager) {
            this.physicsManager.removeBody(this.rightBody);
        }
        
        // Supprimer le conteneur de la scène (ce qui supprimera aussi les portes et le haut-parleur)
        if (this.container && this.scene) {
            this.scene.remove(this.container);
        }
        
        // Nettoyer les références
        this.leftDoor = null;
        this.rightDoor = null;
        this.container = null;
        this.speaker = null;
    }
}