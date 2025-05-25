function disposeObject(object) {
    object.traverse(child => {
        if (child.isMesh || child.isPoints || child.isLine) {
            // Dispose la géométrie
            if (child.geometry) {
                child.geometry.dispose()
            }

            // Dispose les matériaux
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        disposeMaterial(material)
                    })
                } else {
                    disposeMaterial(child.material)
                }
            }
        }

        // Dispose les render targets ou textures spéciales
        if (child.isRenderTarget) {
            child.dispose()
        }
    })
}

function disposeMaterial(material) {
    // Dispose les textures dans les uniforms ou dans le matériel
    for (const key in material) {
        if (Object.prototype.hasOwnProperty.call(material, key)) {
            const value = material[key]
            if (value && value.isTexture) {
                value.dispose()
            }
        }
    }
    material.dispose()
}

async function disposeHierarchy(node, removeFromParent = true) {
    if (!node) return

    // Supprimer géométrie
    if (node.geometry) {
        node.geometry.dispose()
        node.geometry = null
    }

    // Supprimer matériel
    if (node.material) {
        if (Array.isArray(node.material)) {
            for (const mat of node.material) {
                await cleanMaterial(mat)
            }
        } else {
            await cleanMaterial(node.material)
        }
        node.material = null
    }

    // Supprimer les enfants récursivement
    while (node.children.length > 0) {
        await disposeHierarchy(node.children[0])
        node.remove(node.children[0])
    }

    // Supprimer de la scène
    if (removeFromParent && node.parent) {
        node.parent.remove(node)
    }
}

async function cleanMaterial(material) {
    if (material.map) {
        await material.map.dispose()
        material.map = null
    }

    if (material.lightMap) {
        await material.lightMap.dispose()
        material.lightMap = null
    }

    if (material.bumpMap) {
        await material.bumpMap.dispose()
        material.bumpMap = null
    }

    if (material.normalMap) {
        await material.normalMap.dispose()
        material.normalMap = null
    }

    if (material.specularMap) {
        await material.specularMap.dispose()
        material.specularMap = null
    }

    if (material.envMap) {
        await material.envMap.dispose()
        material.envMap = null
    }

    await material.dispose()
}

export { disposeObject, disposeMaterial, disposeHierarchy }
