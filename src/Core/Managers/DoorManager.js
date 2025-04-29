import { Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, AxesHelper, BoxHelper, DirectionalLight } from 'three';

export default class DoorManager {
    constructor(scene) {
        this.scene = scene;
        this.doors = [];
        this.isOpen = false;
        this.isAnimating = false;
        this.targetLeftX = null;
        this.targetRightX = null;
        this.leftDoorOriginX = null;
        this.rightDoorOriginX = null;
        this.initDoors();
    }

    initDoors() {
        // Porte gauche
        const leftGeometry = new PlaneGeometry(2, 4);
        const leftMaterial = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
        this.leftDoor = new Mesh(leftGeometry, leftMaterial);
        this.leftDoor.position.set(-1, 1, -2);
        this.leftDoor.rotation.y = 0;
        this.leftDoor.lookAt(0, 1, 0);
        this.scene.add(this.leftDoor);

        // Porte droite
        const rightGeometry = new PlaneGeometry(2, 4);
        const rightMaterial = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });
        this.rightDoor = new Mesh(rightGeometry, rightMaterial);
        this.rightDoor.position.set(1, 1, -2);
        this.rightDoor.rotation.y = 0;
        this.rightDoor.lookAt(0, 1, 0);
        this.scene.add(this.rightDoor);

        this.doors.push(this.leftDoor, this.rightDoor);

        // Stocke la position d'origine
        this.leftDoorOriginX = this.leftDoor.position.x;
        this.rightDoorOriginX = this.rightDoor.position.x;

        this.scene.add(new AxesHelper(5));
        this.scene.add(new BoxHelper(this.leftDoor, 0xffff00));
        this.scene.add(new BoxHelper(this.rightDoor, 0x00ffff));

        const light = new DirectionalLight(0xffffff, 1);
        light.position.set(0, 10, 10);
        this.scene.add(light);
    }

    openDoors() {
        if (this.isOpen) return;
        this.leftDoor.position.x = this.leftDoorOriginX - 1;
        this.rightDoor.position.x = this.rightDoorOriginX + 1;
        this.isOpen = true;
    }

    openDoorsAnimated() {
        if (this.isOpen || this.isAnimating) return;
        this.targetLeftX = this.leftDoorOriginX - 1;
        this.targetRightX = this.rightDoorOriginX + 1;
        this.isAnimating = true;
    }

    closeDoors() {
        if (!this.isOpen) return;
        this.leftDoor.position.x = this.leftDoorOriginX;
        this.rightDoor.position.x = this.rightDoorOriginX;
        this.isOpen = false;
    }

    closeDoorsAnimated() {
        if (!this.isOpen || this.isAnimating) return;
        this.targetLeftX = this.leftDoorOriginX;
        this.targetRightX = this.rightDoorOriginX;
        this.isAnimating = true;
        this.isOpen = false;
    }

    update() {
        if (this.isAnimating && this.targetLeftX !== null && this.targetRightX !== null) {
            this.leftDoor.position.x += (this.targetLeftX - this.leftDoor.position.x) * 0.1;
            this.rightDoor.position.x += (this.targetRightX - this.rightDoor.position.x) * 0.1;

            if (Math.abs(this.leftDoor.position.x - this.targetLeftX) < 0.01 &&
                Math.abs(this.rightDoor.position.x - this.targetRightX) < 0.01) {
                this.leftDoor.position.x = this.targetLeftX;
                this.rightDoor.position.x = this.targetRightX;
                this.isOpen = (this.targetLeftX !== this.leftDoorOriginX); // true si ouvert
                this.isAnimating = false;
                this.targetLeftX = null;
                this.targetRightX = null;
            }
        }
    }
}