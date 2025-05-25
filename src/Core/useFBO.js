import * as THREE from 'three'

function useFBO(
    /** Width in pixels */
    width = 1024,
    /** Height in pixels */
    height = 1024,
    /**Settings */
    settings = {
        samples: 0,
        depth: false,
    }
) {
    var _width = width
    var _height = height
    var _settings = settings
    var samples = _settings.samples || 0
    var depth = _settings.depth
    var targetSettings = Object.assign({}, _settings)
    delete targetSettings.samples
    delete targetSettings.depth
    var target = new THREE.WebGLRenderTarget(
        _width,
        _height,
        Object.assign(
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                type: THREE.HalfFloatType,
            },
            targetSettings
        )
    )

    if (depth) {
        target.depthTexture = new THREE.DepthTexture(_width, _height, THREE.FloatType)
    }

    target.samples = samples

    return target
}

export { useFBO }
