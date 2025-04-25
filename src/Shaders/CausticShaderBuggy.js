export const CausticShaderBuggy = {
    uniforms: {
      causticsMap: { value: null },
      time: { value: 0.0 },
      scale: { value: 0.1 },
      intensity: { value: 1.5 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
  
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D causticsMap;
      uniform float time;
      uniform float scale;
      uniform float intensity;
  
      varying vec3 vWorldPosition;
  
      void main() {
        vec2 uv = vWorldPosition.xy * scale + vec2(time * 0.05, time * 0.02); // projection XY
        vec3 caustic = texture2D(causticsMap, uv).rgb;
  
        gl_FragColor = vec4(caustic * intensity, 1.0);
      }
    `
  }
  