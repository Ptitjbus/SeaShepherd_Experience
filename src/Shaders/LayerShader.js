export const LayerShader = {
  uniforms: {
    uTexture: { value: null },
    uDisplacement: { value: null },
    uStrength: { value: 0.1 },
  },

  vertexShader: `
    uniform vec3 cameraPos;
    uniform float time;

    varying vec2 vUv;

    mat4 getYRotationMatrix(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat4(
        c, 0.0, -s, 0.0,
        0.0, 1.0, 0.0, 0.0,
        s, 0.0, c, 0.0,
        0.0, 0.0, 0.0, 1.0
      );
    }

    void main() {
      vUv = uv;

      // Position de l'instance
      vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

      // Direction XZ vers la caméra
      vec2 toCamera = normalize(cameraPos.xz - instancePos.xz);
      float angle = atan(toCamera.x, toCamera.y);

      // Rotation de la géométrie vers la caméra
      mat4 rotationY = getYRotationMatrix(angle);

      // Appliquer rotation en local, PUIS transformation d'instance
      vec4 localPos = rotationY * vec4(position, 1.0);
      vec4 worldPos = instanceMatrix * localPos;

      gl_Position = projectionMatrix * modelViewMatrix * worldPos;
    }
  `,

  fragmentShader: `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform sampler2D uDisplacement;
    uniform float uStrength;
    uniform float time;

    varying vec2 vUv;

    void main() {
      // Scroll infini : wrap les UV de déplacement avec fract()
      vec2 animatedUv = fract(vUv + vec2(time * 0.1, 0.0));

      float displacement = texture2D(uDisplacement, animatedUv).r;

      // Déformation seulement sur X
      vec2 displacedUv = vUv + vec2((displacement - 0.5) * uStrength, 0.0);

      vec4 color = texture2D(uTexture, displacedUv);
      if (color.a < 0.5) discard;
      gl_FragColor = color;
    }
  `
}
