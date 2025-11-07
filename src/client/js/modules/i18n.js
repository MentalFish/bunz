'use strict';

/**
 * BUNZ i18n - Minimal internationalization
 */
class BunzI18n {
    translations = {};
    supportedLanguages = ['en', 'no', 'es', 'de', 'fr'];
    currentLang = localStorage.getItem('bunz-lang') || 'en';
    
    constructor() {
        this.init().then(() => this.ready = true);
    }
    
    async init() {
        await this.loadLanguage(this.currentLang);
        this.translatePage();
        document.documentElement.lang = this.currentLang;
        
        // Update navbar display
        this.updateNavbarLangDisplay();
        
        // Event listeners
        document.addEventListener('bunz:lang-change', e => this.setLanguage(e.detail.lang));
        ['bunz:loaded', 'bz:loaded', 'bunz:modal-opened'].forEach(evt => 
            document.addEventListener(evt, () => this.translatePage())
        );
        
        console.log(`🌍 BUNZ i18n initialized (${this.currentLang})`);
        document.dispatchEvent(new CustomEvent('bunz:i18n-ready', { detail: { lang: this.currentLang } }));
    }
    
    updateNavbarLangDisplay() {
        const el = document.getElementById('current-lang');
        if (el) el.textContent = this.currentLang.toUpperCase();
    }
    
    async loadLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Language ${lang} not supported, using 'en'`);
            lang = 'en';
        }
        
        try {
            const res = await fetch(`/lang/${lang}.json`);
            if (!res.ok) throw new Error(`Failed to load ${lang}.json`);
            
            this.translations = await res.json();
            this.currentLang = lang;
            localStorage.setItem('bunz-lang', lang);
            document.documentElement.lang = lang;
            return true;
        } catch (e) {
            console.error(`Failed to load language ${lang}:`, e);
            return false;
        }
    }
    
    async setLanguage(lang) {
        if (await this.loadLanguage(lang)) {
            this.translatePage();
            this.updateNavbarLangDisplay();
            document.dispatchEvent(new CustomEvent('bunz:lang-changed', { detail: { lang: this.currentLang } }));
        }
    }
    
    translate(key) {
        let val = this.translations;
        for (const k of key.split('.')) {
            val = val?.[k];
            if (!val) return key;
        }
        return val || key;
    }
    
    translatePage() {
        console.log('🔄 Translating page...', this.translations);
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const text = this.translate(el.getAttribute('data-i18n'));
            if (text?.includes?.('<')) el.innerHTML = text;
            else if (text) el.textContent = text;
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => 
            el.placeholder = this.translate(el.getAttribute('data-i18n-placeholder'))
        );
        
        document.querySelectorAll('[data-i18n-aria]').forEach(el => 
            el.setAttribute('aria-label', this.translate(el.getAttribute('data-i18n-aria')))
        );
        
        document.querySelectorAll('[data-i18n-title]').forEach(el => 
            el.title = this.translate(el.getAttribute('data-i18n-title'))
        );
        
        console.log('✅ Page translated');
    }
}

window.bunzI18n = new BunzI18n();
window.t = key => bunzI18n.translate(key);
