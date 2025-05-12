import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Object3D, Vector3 } from 'three'
import { gsap } from 'gsap'
import App from '../App.js'

export default class DoorPair {
    constructor(scene, position, width = 2, height = 4, colorLeft = 0xff0000, colorRight = 0x00ff00, sliding = true) {
        this.scene = scene
        this.position = position
        this.width = width
        this.height = height
        this.isSliding = sliding
        
        // Accéder au physics manager via l'instance d'App
        this.app = new App()
        this.physicsManager = this.app.physicsManager
        
        // État des portes
        this.isOpen = false
        this.isAnimating = false
        this.canBeOpened = false // Nouvel état pour contrôler si la porte peut être ouverte
        this.playerInRange = false // Suivi de la présence du joueur dans la zone
        
        // Positions initiales et finales pour l'animation
        this.leftInitialPos = new Vector3(position.x - width/2, position.y + height/2, position.z)
        this.rightInitialPos = new Vector3(position.x + width/2, position.y + height/2, position.z)
        
        // Positions d'ouverture
        this.leftOpenPos = new Vector3(position.x - width*1.5, position.y + height/2, position.z)
        this.rightOpenPos = new Vector3(position.x + width*1.5, position.y + height/2, position.z)
        
        // Corps physiques
        this.leftBody = null
        this.rightBody = null
        
        // Créer les portes
        this.createDoors(colorLeft, colorRight)
    }
    
    createDoors(colorLeft, colorRight) {
        // Géométrie commune
        const doorGeometry = new PlaneGeometry(this.width, this.height)
        
        // Matériaux
        const leftMaterial = new MeshBasicMaterial({ color: colorLeft, side: DoubleSide })
        const rightMaterial = new MeshBasicMaterial({ color: colorRight, side: DoubleSide })
        
        // Mesh des portes
        this.leftDoor = new Mesh(doorGeometry, leftMaterial)
        this.rightDoor = new Mesh(doorGeometry, rightMaterial)
        
        // Positionnement des portes
        this.leftDoor.position.copy(this.leftInitialPos)
        this.rightDoor.position.copy(this.rightInitialPos)
        
        // Ajout à la scène
        this.scene.add(this.leftDoor)
        this.scene.add(this.rightDoor)
        
        // Créer les corps physiques via le physics manager
        this.createPhysicsBodies()
    }
    
    createPhysicsBodies() {
        if (!this.physicsManager) return;
        
        // Épaisseur de la porte pour la collision
        const doorThickness = 0.1;
        
        // Utilisez les méthodes du PhysicsManager pour créer les corps physiques
        this.leftBody = this.physicsManager.createBox(
            {
                width: this.width,
                height: this.height,
                depth: doorThickness
            },
            {
                mass: 0, // Masse 0 = statique
                position: {
                    x: this.leftDoor.position.x,
                    y: this.leftDoor.position.y,
                    z: this.leftDoor.position.z
                },
                material: {
                    friction: 0.3,
                    restitution: 0.2
                }
            },
            this.leftDoor // Mesh associé pour synchroniser les positions
        );
        
        this.rightBody = this.physicsManager.createBox(
            {
                width: this.width,
                height: this.height,
                depth: doorThickness
            },
            {
                mass: 0, // Masse 0 = statique
                position: {
                    x: this.rightDoor.position.x,
                    y: this.rightDoor.position.y,
                    z: this.rightDoor.position.z
                },
                material: {
                    friction: 0.3,
                    restitution: 0.2
                }
            },
            this.rightDoor // Mesh associé pour synchroniser les positions
        );
    }
    
    /**
     * Définit si la porte peut être ouverte ou non
     * @param {boolean} canOpen - Vrai si la porte peut être ouverte, faux sinon
     */
    setOpenable(canOpen) {
        this.canBeOpened = canOpen;
    }
    
    /**
     * Vérifie si la porte peut être ouverte
     * @return {boolean} Vrai si la porte peut être ouverte, faux sinon
     */
    isOpenable() {
        return this.canBeOpened;
    }
    
    openAnimated(duration = 1) {
        // Vérifier si la porte peut être ouverte
        if (this.isOpen || this.isAnimating || !this.canBeOpened) return
        
        this.isAnimating = true
        
        gsap.to(this.leftDoor.position, {
            x: this.leftOpenPos.x,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                this.isOpen = true
                this.isAnimating = false
            },
            onUpdate: () => {
                // Mettre à jour la position du corps physique via le physics manager
                if (this.leftBody) {
                    this.physicsManager.updateBodyPosition(this.leftBody, {
                        x: this.leftDoor.position.x,
                        y: this.leftDoor.position.y,
                        z: this.leftDoor.position.z
                    });
                }
            }
        })
        
        gsap.to(this.rightDoor.position, {
            x: this.rightOpenPos.x,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
                // Mettre à jour la position du corps physique via le physics manager
                if (this.rightBody) {
                    this.physicsManager.updateBodyPosition(this.rightBody, {
                        x: this.rightDoor.position.x,
                        y: this.rightDoor.position.y,
                        z: this.rightDoor.position.z
                    });
                }
            }
        })
    }
    
    closeAnimated(duration = 1) {
        if (!this.isOpen || this.isAnimating) return
        
        this.isAnimating = true
        
        gsap.to(this.leftDoor.position, {
            x: this.leftInitialPos.x,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                this.isOpen = false
                this.isAnimating = false
            },
            onUpdate: () => {
                // Mettre à jour la position du corps physique via le physics manager
                if (this.leftBody) {
                    this.physicsManager.updateBodyPosition(this.leftBody, {
                        x: this.leftDoor.position.x,
                        y: this.leftDoor.position.y,
                        z: this.leftDoor.position.z
                    });
                }
            }
        })
        
        gsap.to(this.rightDoor.position, {
            x: this.rightInitialPos.x,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
                // Mettre à jour la position du corps physique via le physics manager
                if (this.rightBody) {
                    this.physicsManager.updateBodyPosition(this.rightBody, {
                        x: this.rightDoor.position.x,
                        y: this.rightDoor.position.y,
                        z: this.rightDoor.position.z
                    });
                }
            }
        })
    }
    
    update(playerPosition) {
        // Vérifier si le joueur est proche
        const isNear = this.isPlayerNear(playerPosition);
        
        // Si le joueur vient d'entrer dans la zone et que la porte peut s'ouvrir
        if (isNear && !this.isOpen && this.canBeOpened && !this.isAnimating) {
            this.openAnimated();
        }
        // Si le joueur vient de sortir de la zone et que la porte est ouverte
        else if (!isNear && this.isOpen && !this.isAnimating) {
            this.closeAnimated();
        }
        
        // Mettre à jour l'état de présence du joueur
        this.playerInRange = isNear;
    }
    
    isPlayerNear(playerPosition, threshold = 2) {
        if (!playerPosition) return false;
        
        const center = new Vector3().addVectors(this.leftDoor.position, this.rightDoor.position).multiplyScalar(0.5)
        center.y = playerPosition.y // Pour ne comparer que la distance horizontale
        
        return center.distanceTo(playerPosition) < threshold
    }
    
    // Méthode pour nettoyer les ressources à la suppression de la porte
    dispose() {
        if (this.leftBody && this.physicsManager) {
            this.physicsManager.removeBody(this.leftBody);
        }
        
        if (this.rightBody && this.physicsManager) {
            this.physicsManager.removeBody(this.rightBody);
        }
        
        // Supprimer les maillages de la scène
        if (this.leftDoor && this.scene) {
            this.scene.remove(this.leftDoor);
        }
        
        if (this.rightDoor && this.scene) {
            this.scene.remove(this.rightDoor);
        }
    }
}