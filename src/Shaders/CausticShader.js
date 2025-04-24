import * as THREE from 'three';

export const CausticShader = {
  uniforms: {
    baseMap: { value: null },
    causticsMap: { value: null },
    time: { value: 0.0 },
    scale: { value: 0.1 },
    intensity: { value: 1.5 },
    causticTint: { value: new THREE.Color(0.2, 0.5, 1.0) },
    fogColor: { value: new THREE.Color(0xe0e0e0) },
    fogNear: { value: 10 },
    fogFar: { value: 50 },
    cameraPosition: { value: new THREE.Vector3() }
  },

  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,

  fragmentShader: `
    uniform sampler2D baseMap;
    uniform sampler2D causticsMap;
    uniform float time;
    uniform float scale;
    uniform float intensity;
    uniform vec3 causticTint;

    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec3 baseColor = texture2D(baseMap, vUv).rgb;
      vec2 uv = vWorldPosition.xz * scale + vec2(time * 0.05, time * 0.02);
      float c = texture2D(causticsMap, uv).r;

      vec3 finalColor = baseColor + causticTint * c * intensity;

      float fogDistance = length(vWorldPosition - cameraPosition);
      float fogFactor = smoothstep(fogNear, fogFar, fogDistance);
      finalColor = mix(finalColor, fogColor, fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
}
