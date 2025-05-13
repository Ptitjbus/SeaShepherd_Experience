import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Object3D, Vector3, Quaternion, Euler } from 'three'
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
        
        // Accéder au physics manager via l'instance d'App
        this.app = new App()
        this.physicsManager = this.app.physicsManager
        
        // État des portes
        this.isOpen = false
        this.isAnimating = false
        this.canBeOpened = true
        this.playerInRange = false
        
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
        
        // Positionnement des portes (par rapport au conteneur)
        this.leftDoor.position.copy(this.leftInitialPos)
        this.rightDoor.position.copy(this.rightInitialPos)
        
        // Ajout au conteneur au lieu de la scène directement
        this.container.add(this.leftDoor)
        this.container.add(this.rightDoor)
        
        // Créer les corps physiques via le physics manager
        this.createPhysicsBodies()
    }
    
    createPhysicsBodies() {
        if (!this.physicsManager) return;
        
        // Épaisseur de la porte pour la collision
        const doorThickness = 0.1;
        
        // Calcul des positions mondiales pour les corps physiques
        const leftWorldPos = new Vector3();
        this.leftDoor.getWorldPosition(leftWorldPos);
        
        const rightWorldPos = new Vector3();
        this.rightDoor.getWorldPosition(rightWorldPos);
        
        // Quaternion pour appliquer la rotation aux corps physiques
        const quaternion = new Quaternion().setFromEuler(new Euler(0, this.rotation, 0));
        
        // Utilisez les méthodes du PhysicsManager pour créer les corps physiques
        this.leftBody = this.physicsManager.createBox(
            {
                width: this.width,
                height: this.height,
                depth: doorThickness
            },
            {
                mass: 0,
                position: {
                    x: leftWorldPos.x,
                    y: leftWorldPos.y,
                    z: leftWorldPos.z
                },
                quaternion: {
                    x: quaternion.x,
                    y: quaternion.y,
                    z: quaternion.z,
                    w: quaternion.w
                },
                material: {
                    friction: 0.3,
                    restitution: 0.2
                }
            },
            this.leftDoor
        );
        
        this.rightBody = this.physicsManager.createBox(
            {
                width: this.width,
                height: this.height,
                depth: doorThickness
            },
            {
                mass: 0,
                position: {
                    x: rightWorldPos.x,
                    y: rightWorldPos.y,
                    z: rightWorldPos.z
                },
                quaternion: {
                    x: quaternion.x,
                    y: quaternion.y,
                    z: quaternion.z,
                    w: quaternion.w
                },
                material: {
                    friction: 0.3,
                    restitution: 0.2
                }
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
        
        // Supprimer les anciens corps physiques
        if (this.leftBody) {
            this.physicsManager.removeBody(this.leftBody);
        }
        
        if (this.rightBody) {
            this.physicsManager.removeBody(this.rightBody);
        }
        
        // Recréer les corps physiques avec la nouvelle orientation
        this.createPhysicsBodies();
    }
    
    setOpenable(canOpen) {
        this.canBeOpened = canOpen;
    }
    
    isOpenable() {
        return this.canBeOpened;
    }
    
    openAnimated(duration = 1.7) {
        if (this.isOpen || this.isAnimating || !this.canBeOpened) return
        
        this.isAnimating = true
        
        // Supprimer temporairement les corps physiques pendant l'animation
        if (this.leftBody) {
            this.physicsManager.removeBody(this.leftBody);
            this.leftBody = null;
        }
        
        if (this.rightBody) {
            this.physicsManager.removeBody(this.rightBody);
            this.rightBody = null;
        }
        
        gsap.to(this.leftDoor.position, {
            x: this.leftOpenPos.x,
            duration: duration,
            ease: "ease.inOut",
        });
        
        gsap.to(this.rightDoor.position, {
            x: this.rightOpenPos.x,
            duration: duration,
            ease: "ease.inOut",
            onComplete: () => {
                this.isOpen = true;
                this.isAnimating = false;
                
                // Recréer les corps physiques une fois l'animation terminée
                this.createPhysicsBodies();
            }
        });
    }
    
    closeAnimated(duration = 1) {
        if (!this.isOpen || this.isAnimating) return
        
        this.isAnimating = true
        
        // Supprimer temporairement les corps physiques pendant l'animation
        if (this.leftBody) {
            this.physicsManager.removeBody(this.leftBody);
            this.leftBody = null;
        }
        
        if (this.rightBody) {
            this.physicsManager.removeBody(this.rightBody);
            this.rightBody = null;
        }
        
        gsap.to(this.leftDoor.position, {
            x: this.leftInitialPos.x,
            duration: duration,
            ease: "power2.out"
        });
        
        gsap.to(this.rightDoor.position, {
            x: this.rightInitialPos.x,
            duration: duration,
            ease: "power2.out",
            onComplete: () => {
                this.isOpen = false;
                this.isAnimating = false;
                
                // Recréer les corps physiques une fois l'animation terminée
                this.createPhysicsBodies();
            }
        });
    }
    
    update(playerPosition) {
        // Vérifier si le joueur est proche
        const isNear = this.isPlayerNear(playerPosition, 7);
        
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
    
    dispose() {
        if (this.leftBody && this.physicsManager) {
            this.physicsManager.removeBody(this.leftBody);
        }
        
        if (this.rightBody && this.physicsManager) {
            this.physicsManager.removeBody(this.rightBody);
        }
        
        // Supprimer le conteneur de la scène (ce qui supprimera aussi les portes)
        if (this.container && this.scene) {
            this.scene.remove(this.container);
        }
        
        // Nettoyer les références
        this.leftDoor = null;
        this.rightDoor = null;
        this.container = null;
    }
}