import restart from 'vite-plugin-restart'

export default {
    root: 'src/', // Sources files (typically where index.html is)
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    server:
    {
        host: true, // Open to local network and display URL
        open: true, // Open browser automatically
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['three', 'gsap', 'howler'],
                    'ui': ['lil-gui', '@theatre/core', '@theatre/studio']
                }
            }
        }
    },
    plugins:
    [
        restart({ restart: [ '../static/**', ] }), // Restart server on static file change
        {
            name: 'confidential-documents-html',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/confidential-documents') {
                        // Rediriger vers la page des documents confidentiels
                        req.url = '/Pages/ConfidentialDocuments/ConfidentialDocuments.html';
                    }
                    next();
                });
            }
        }
    ],
}