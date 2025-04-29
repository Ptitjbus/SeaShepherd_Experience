import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Object3D, AxesHelper, BoxHelper, DirectionalLight } from 'three';

export default class DoorManager {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.isAnimating = false;
        this.targetLeftRot = 0;
        this.targetRightRot = 0;
        this.initDoors();
    }

    initDoors() {
        // Pivots
        this.leftPivot = new Object3D();
        this.rightPivot = new Object3D();

        const doorZ = -2;

        // Place les pivots pour que les portes soient côte à côte
        this.leftPivot.position.set(-2, 0, doorZ);  // Pivot du bord droit de la porte gauche
        this.rightPivot.position.set(2, 0, doorZ);  // Pivot du bord gauche de la porte droite

        // Porte gauche (rouge) - décalée de +1.01 (moitié largeur + epsilon) pour que son bord droit soit sur le pivot
        const leftGeometry = new PlaneGeometry(2, 4);
        const leftMaterial = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
        this.leftDoor = new Mesh(leftGeometry, leftMaterial);
        this.leftDoor.position.set(1, 2, 0); // Décalage léger sur X pour éviter le chevauchement
        this.leftPivot.add(this.leftDoor);

        // Porte droite (verte) - décalée de -1.01 (moitié largeur + epsilon) pour que son bord gauche soit sur le pivot
        const rightGeometry = new PlaneGeometry(2, 4);
        const rightMaterial = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });
        this.rightDoor = new Mesh(rightGeometry, rightMaterial);
        this.rightDoor.position.set(-1, 2, 0); // Décalage léger sur X pour éviter le chevauchement
        this.rightPivot.add(this.rightDoor);

        this.scene.add(this.leftPivot);
        this.scene.add(this.rightPivot);

        // Helpers et lumière
        this.scene.add(new AxesHelper(5));
        this.scene.add(new BoxHelper(this.leftDoor, 0xffff00));
        this.scene.add(new BoxHelper(this.rightDoor, 0x00ffff));
        const light = new DirectionalLight(0xffffff, 1);
        light.position.set(0, 10, 10);
        this.scene.add(light);

        this.leftDoorOriginRot = 0;
        this.rightDoorOriginRot = 0;
    }

    openDoorsAnimated() {
        if (this.isOpen || this.isAnimating) return;
        this.targetLeftRot = -Math.PI / 2;   // Ouvre vers la gauche (extérieur)
        this.targetRightRot = Math.PI / 2;   // Ouvre vers la droite (extérieur)
        this.isAnimating = true;
    }

    closeDoorsAnimated() {
        if (!this.isOpen || this.isAnimating) return;
        this.targetLeftRot = 0;
        this.targetRightRot = 0;
        this.isAnimating = true;
    }

    update() {
        if (this.isAnimating) {
            this.leftPivot.rotation.y += (this.targetLeftRot - this.leftPivot.rotation.y) * 0.1;
            this.rightPivot.rotation.y += (this.targetRightRot - this.rightPivot.rotation.y) * 0.1;

            if (Math.abs(this.leftPivot.rotation.y - this.targetLeftRot) < 0.01 &&
                Math.abs(this.rightPivot.rotation.y - this.targetRightRot) < 0.01) {
                this.leftPivot.rotation.y = this.targetLeftRot;
                this.rightPivot.rotation.y = this.targetRightRot;
                this.isOpen = (this.targetLeftRot !== 0);
                this.isAnimating = false;
            }
        }
    }

    openDoors() {
        if (this.isOpen) return;
        this.leftPivot.rotation.y = -Math.PI / 2;
        this.rightPivot.rotation.y = Math.PI / 2;
        this.isOpen = true;
    }

    closeDoors() {
        if (!this.isOpen) return;
        this.leftPivot.rotation.y = 0;
        this.rightPivot.rotation.y = 0;
        this.isOpen = false;
    }
}