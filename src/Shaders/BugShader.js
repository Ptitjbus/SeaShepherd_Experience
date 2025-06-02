export const BugShader = {
    vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform float uGlitchIntensity;
        uniform float uRandom;
        uniform float uDisappearTime;
        uniform float uChaosLevel;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vDisappear;
        
        // Fonction de bruit pour les glitches
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
            vUv = uv;
            vPosition = position;
            
            // Calculer si ce mesh doit disparaître
            float adjustedProgress = uProgress;
            if (uChaosLevel > 0.0) {
                adjustedProgress = uProgress - uDisappearTime;
                adjustedProgress = max(0.0, adjustedProgress) / (1.0 - uDisappearTime);
            }
            
            // Progression douce pour éviter le flash initial
            adjustedProgress = smoothstep(0.0, 1.0, adjustedProgress);
            adjustedProgress *= adjustedProgress; // Courbe plus douce
            
            vDisappear = adjustedProgress;
            
            vec3 pos = position;
            float time = uTime * 2.0 + uRandom * 10.0;
            
            // Intensité du glitch basée sur le progrès ajusté avec courbe douce
            float glitchAmount = adjustedProgress * uGlitchIntensity;
            glitchAmount = smoothstep(0.0, 1.0, glitchAmount); // Transition encore plus douce
            
            // Glitch vertical - lignes de scan chaotiques (réduit)
            float scanLine = sin(pos.y * 200.0 + time * 100.0) * glitchAmount;
            scanLine += sin(pos.y * 50.0 + time * 200.0) * glitchAmount * 0.3;
            
            // Glitch horizontal - décalages chaotiques (réduit)
            float horizontalGlitch = noise(vec2(pos.y * 0.2, time * 1.0)) * glitchAmount;
            horizontalGlitch += noise(vec2(pos.y * 0.05, time * 2.0)) * glitchAmount * 1.0;
            
            // Déformation aléatoire explosive (très réduit)
            float explosiveGlitch = (random(vec2(time * 0.2, pos.x + pos.z)) - 0.5) * glitchAmount;
            
            // Corruption totale des vertices (très réduit)
            if (random(vec2(pos.x + time * 0.1, pos.z + time * 0.15)) > 0.8 - adjustedProgress * 0.4) {
                pos.x += explosiveGlitch * 0.8;
                pos.y += scanLine * 0.4;
                pos.z += horizontalGlitch * 0.6;
            }
            
            // Ondulations chaotiques (très réduit)
            pos.x += sin(pos.y * 10.0 + time) * glitchAmount * 0.05;
            pos.y += cos(pos.x * 15.0 + time * 1.5) * glitchAmount * 0.03;
            pos.z += sin(pos.x * pos.y * 0.1 + time * 0.8) * glitchAmount * 0.04;
            
            // Déplacement général chaotique (très réduit)
            pos.x += horizontalGlitch * 0.08;
            pos.y += scanLine * 0.06;
            pos.z += explosiveGlitch * 0.1;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform float uGlitchIntensity;
        uniform sampler2D uTexture;
        uniform vec2 uResolution;
        uniform float uRandom;
        uniform float uEnableFade;
        uniform float uDisappearTime;
        uniform float uChaosLevel;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vDisappear;
        
        // Fonction de bruit
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
            // Si ce mesh n'est pas encore actif, on l'ignore
            if (vDisappear <= 0.0) {
                discard;
            }
            
            vec2 uv = vUv;
            float time = uTime * 3.0 + uRandom * 5.0;
            float progress = vDisappear;
            
            // Progression douce pour éviter les flashs
            progress = smoothstep(0.0, 1.0, progress);
            
            // Effet de scan lines multiples (plus doux)
            float scanLines = sin(uv.y * 1000.0 + time * 30.0) * 0.5 + 0.5;
            scanLines *= sin(uv.y * 200.0 + time * 80.0) * 0.5 + 0.5;
            scanLines = pow(scanLines, 0.3); // Moins intense
            
            // Aberration chromatique chaotique (réduite)
            float chaosOffset = progress * uGlitchIntensity * 0.02;
            vec2 redOffset = vec2(chaosOffset * sin(time * 20.0), chaosOffset * cos(time * 25.0));
            vec2 greenOffset = vec2(chaosOffset * sin(time * 15.0 + 2.0), chaosOffset * cos(time * 18.0 + 3.0));
            vec2 blueOffset = vec2(chaosOffset * sin(time * 30.0 + 4.0), chaosOffset * cos(time * 22.0 + 5.0));
            
            float r = texture2D(uTexture, uv + redOffset).r;
            float g = texture2D(uTexture, uv + greenOffset).g;
            float b = texture2D(uTexture, uv + blueOffset).b;
            
            vec3 color = vec3(r, g, b);
            
            // Lignes de glitch multiples et chaotiques
            float glitchLines = step(0.95, random(vec2(floor(uv.y * 50.0), time * 0.2)));
            glitchLines += step(0.97, random(vec2(floor(uv.y * 20.0), time * 0.15)));
            if (glitchLines > 0.5) {
                float shift = (random(vec2(time * 0.2, uv.y)) - 0.5) * progress * 0.2;
                color = texture2D(uTexture, vec2(uv.x + shift, uv.y)).rgb;
                // Couleurs multicolores chaotiques
                vec3 chaosColor = vec3(
                    random(uv + time * 0.1), 
                    random(uv + time * 0.2 + 10.0), 
                    random(uv + time * 0.3 + 20.0)
                );
                color = mix(color, chaosColor, 0.8);
            }
            
            // Pixels morts massifs
            float pixelChaos = random(uv + time * 0.005);
            if (pixelChaos > 0.95 - progress * 0.5) {
                color = vec3(
                    random(uv + time * 0.1), 
                    random(uv + time * 0.2), 
                    random(uv + time * 0.3)
                );
            }
            
            // Blocs de corruption massifs
            vec2 bigBlockUv = floor(uv * 20.0) / 20.0;
            float bigBlockCorruption = random(bigBlockUv + floor(time * 8.0));
            if (bigBlockCorruption > 0.9 - progress * 0.4) {
                vec3 blockColor = vec3(
                    random(bigBlockUv + time * 0.1), 
                    random(bigBlockUv + time * 0.2 + 100.0), 
                    random(bigBlockUv + time * 0.3 + 200.0)
                );
                color = mix(color, blockColor, 0.9);
            }
            
            // Déformation de couleurs extrême
            color *= scanLines;
            vec3 extremeColorShift = vec3(
                random(uv + time * 0.2), 
                random(uv + time * 0.3 + 50.0), 
                random(uv + time * 0.4 + 100.0)
            );
            color = mix(color, extremeColorShift, progress * 0.6);
            
            // Inversion de couleurs par zones
            if (random(floor(uv * 10.0) + time * 0.1) > 0.8 - progress * 0.3) {
                color = 1.0 - color;
            }
            
            // Alpha avec disparition chaotique
            float alpha = 1.0;
            if (uEnableFade > 0.5) {
                alpha = 1.0 - progress;
            }
            
            // Disparition par zones aléatoires
            float disappearChaos = random(uv + time * 0.02);
            if (disappearChaos < progress * 1.5) {
                alpha = 0.0;
            }
            
            // Scintillement chaotique
            if (random(uv + time * 0.5) > 0.5 + progress * 0.3) {
                alpha *= 0.3;
            }
            
            gl_FragColor = vec4(color, alpha);
        }
    `
}
