export const LayerShader = {
  uniforms: {
    uTexture: { value: null },
    uDisplacement: { value: null },
    uStrength: { value: 0.1 },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
      gl_FragColor = color;
    }
  `
}
