export const BlackWhiteShader = {
    vertexShader: `
        varying vec3 vPosition;

        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D baseMap;
        uniform float scale;
        varying vec3 vPosition;

        void main() {
            vec2 uv = vPosition.xz * scale;
            vec4 color = texture2D(baseMap, uv);
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            gl_FragColor = vec4(vec3(gray), color.a);
        }
    `
}
