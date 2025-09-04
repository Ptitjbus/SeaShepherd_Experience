export default class TranslationManager {
    constructor() {
        this.translations = {}
        this.init()
    }

    async init() {
        this.languageSelect = document.getElementById('language-select')
        if (this.languageSelect) {
            this.currentLanguage = localStorage.getItem('language') || 'fr'
            
            this.languageSelect.value = this.currentLanguage
            
            this.languageSelect.addEventListener('change', async (event) => {
                this.currentLanguage = event.target.value
                localStorage.setItem('language', this.currentLanguage)
                await this.loadTranslations()
                this.updateInterface()
            })
        }
        
        await this.loadTranslations()
        this.updateInterface()
    }

    async loadTranslations() {
        try {
            const response = await fetch(`/locales/${this.currentLanguage}.json`)
            this.translations = await response.json()
        } catch (error) {
            console.error(`Failed to load translations for ${this.currentLanguage}:`, error)
            // Fallback vers français si erreur
            if (this.currentLanguage !== 'fr') {
                this.currentLanguage = 'fr'
                this.languageSelect.value = 'fr'
                localStorage.setItem('language', 'fr')
                await this.loadTranslations()
            }
        }
    }

    t(key) {
        return this.translations[key] || key
    }

    updateInterface() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n')
            const translation = this.t(key)
            
            if (translation) {
                element.textContent = translation
            }
        })
    }
}
