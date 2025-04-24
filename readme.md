# Three.js Journey

## Git clone
```bash
# To check if new LFS files are available
git lfs ls-files

# To clone project without downloading immediatly LFS files
git lfs clone --depth=1 [URL_REPO]
```

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```

## Git LFS Versionning

Check existing tracked patterns
`cat .gitattributes`

Add new file types if needed:
```bash
git lfs track "*.extension"

git add .gitattributes

git commit -m "Track new file type with Git LFS"
```

Add your files
```bash
git add path/to/your/files
```

Check if they are correctly tracked by LFS
```bash
git lfs ls-files --all
```

Commit as usual
```bash
git commit -m "Add new assets"
git push
```

## Git LFS Common commands
```bash
# List tracked files by Git LFS
git lfs ls-files

# Check status of LFS Files
git lfs status

# Pull LFS files specifically
git lfs pull

# Fetch all LFS content
git lfs fetch --all
```