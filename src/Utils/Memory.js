function disposeObject(object) {
    object.traverse((child) => {
        if (child.isMesh || child.isPoints || child.isLine) {

            // Dispose la géométrie
            if (child.geometry) {
                child.geometry.dispose();
            }

            // Dispose les matériaux
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => {
                        this.disposeMaterial(material);
                    });
                } else {
                    this.disposeMaterial(child.material);
                }
            }
        }

        // Dispose les render targets ou textures spéciales
        if (child.isRenderTarget) {
            child.dispose();
        }
    });
}

function disposeMaterial(material) {
    // Dispose les textures dans les uniforms ou dans le matériel
    for (const key in material) {
        if (Object.prototype.hasOwnProperty.call(material, key)) {
            const value = material[key];
            if (value && value.isTexture) {
                value.dispose();
            }
        }
    }
    material.dispose();
}

export { disposeObject, disposeMaterial };
