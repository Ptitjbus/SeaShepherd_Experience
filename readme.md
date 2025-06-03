 # Sea Shepherd Experience

Une expérience immersive en WebGL/Three.js qui sensibilise aux enjeux de la protection des océans à travers une visite virtuelle interactive.

## 📋 Prérequis

- [Node.js](https://nodejs.org/en/download/) (version 16 ou supérieure)
- [Git](https://git-scm.com/downloads)
- [Git LFS](https://git-lfs.github.io/) (pour les fichiers multimédias)

## 🚀 Installation locale

### 1. Cloner le projet

```bash
# Cloner le repository avec Git LFS
git clone git@github.com:Ptitjbus/SeaShepherd_Experience.git
cd SeaShepherd_Experience

# Ou cloner sans télécharger immédiatement les fichiers LFS
git lfs clone --depth=1 git@github.com:Ptitjbus/SeaShepherd_Experience.git
```

### 2. Installer les dépendances

```bash
# Installer les dépendances npm
npm install

# Ou avec pnpm (recommandé)
pnpm install
```

### 3. Télécharger les assets avec Git LFS

```bash
# Vérifier les fichiers LFS disponibles
git lfs ls-files

# Télécharger tous les fichiers LFS
git lfs pull
```

### 4. Lancer le serveur de développement

```bash
# Démarrer le serveur local
npm run dev

# Ou avec pnpm
pnpm dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build pour la production

```bash
# Construire pour la production
npm run build

# Ou avec pnpm
pnpm build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## 🌐 Déploiement en ligne

### Option 1: Vercel (Recommandé)

1. **Connecter votre repository à Vercel :**
   - Aller sur [vercel.com](https://vercel.com)
   - Importer votre projet depuis GitHub/GitLab
   - La configuration Vercel est déjà incluse dans `vercel.json`

2. **Configuration automatique :**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Option 2: Netlify

1. **Via l'interface Netlify :**
   - Aller sur [netlify.com](https://netlify.com)
   - Connecter votre repository
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Via Netlify CLI :**
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Build et déployer
npm run build
netlify deploy --prod --dir dist
```

### Option 3: Serveur traditionnel (Apache/Nginx)

1. **Build le projet :**
```bash
npm run build
```

2. **Uploader le contenu du dossier `dist/` :**
   - Copier tous les fichiers du dossier `dist/` vers votre serveur web
   - S'assurer que le serveur peut servir des fichiers statiques

3. **Configuration serveur (optionnel) :**
   - Pour Apache : ajouter un `.htaccess` pour les SPA
   - Pour Nginx : configurer les routes pour les SPA

## 📁 Structure du projet

```
src/
├── App.js                 # Point d'entrée principal
├── index.html            # Template HTML
├── style.css             # Styles globaux
├── script.js             # Script principal
├── Assets/               # Gestionnaire d'assets
├── Core/                 # Composants principaux
│   ├── Managers/         # Gestionnaires (Son, Média, etc.)
│   ├── Camera.js         # Configuration caméra
│   ├── Renderer.js       # Configuration rendu
│   └── ...
├── Shaders/              # Shaders GLSL
├── Utils/                # Utilitaires
└── World/                # Objets 3D du monde

static/                   # Assets statiques
├── audio/                # Fichiers audio
├── images/               # Images et textures
├── models/               # Modèles 3D
├── videos/               # Vidéos
└── ...
```

## 🎮 Contrôles

- **ZQSD** : Se déplacer
- **Souris** : Regarder autour
- **Entrée** : Interagir
- **U** / **I** : Choisir la réponse
- **Échap** : Quitter le mode pointer lock

### Personnalisation

- **Assets** : Placer les nouveaux assets dans le dossier `static/`
- **Shaders** : Modifier les shaders dans `src/Shaders/`
- **Scénario** : Modifier la logique dans [`src/Core/Managers/StoryManager.js`](src/Core/Managers/StoryManager.js)

## 📦 Gestion des assets avec Git LFS

### Ajouter de nouveaux types de fichiers

```bash
# Tracker de nouveaux types de fichiers
git lfs track "*.extension"

# Ajouter la configuration LFS
git add .gitattributes

# Commiter la configuration
git commit -m "Track new file type with Git LFS"
```

### Commandes utiles Git LFS

```bash
# Lister les fichiers trackés par LFS
git lfs ls-files

# Vérifier le status des fichiers LFS
git lfs status

# Télécharger uniquement les fichiers LFS
git lfs pull

# Récupérer tout le contenu LFS
git lfs fetch --all
```

## 🛠️ Développement

### Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run preview      # Preview du build
npm run lint         # Linting du code
```

### Debug

L'application inclut un panneau de debug accessible via la touche `D` en mode développement.

## 📱 Compatibilité

- **Navigateurs supportés** : Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **WebGL 2.0** requis
- **Résolutions** : Optimisé pour 1920x1080, responsive jusqu'à 320px
- **Performance** : GPU dédié recommandé pour une expérience optimale

## 🐛 Résolution de problèmes

### Problèmes courants

1. **Assets manquants** :
   ```bash
   git lfs pull
   ```

2. **Erreur de build** :
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Performance lente** :
   - Vérifier que WebGL 2.0 est supporté
   - Fermer les autres onglets
   - Mettre à jour les drivers graphiques

### Support

Pour signaler un bug ou demander de l'aide :
- Ouvrir une issue sur le repository
- Inclure les informations système et navigateur
- Joindre les logs de la console si possible

---

Développé avec ❤️ pour Sea Shepherd France
