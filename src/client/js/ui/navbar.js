'use strict';

/**
 * BUNZ Navbar - Auth state & language switcher
 * Loads navbar from HTX component
 */
class BunzNavbar {
    navbarLoaded = false;
    
    constructor() {
        this.init();
    }
    
    async init() {
        // Load navbar component first
        await this.loadNavbar();
        
        this.container = document.getElementById('navbar-auth');
        this.updateAuthState();
        
        // Event listeners
        ['bunz:auth-success', 'bunz:auth-logout', 'bunz:lang-changed'].forEach(evt =>
            document.addEventListener(evt, e => {
                this.updateAuthState();
                if (evt === 'bunz:lang-changed') this.updateLangDisplay(e.detail.lang);
            })
        );
        
        document.addEventListener('bunz:i18n-ready', e => this.updateLangDisplay(e.detail.lang));
        
    // Delegate events
    document.addEventListener('click', async e => {
      const logout = e.target.closest('#logout-btn');
      const langTrigger = e.target.closest('#lang-trigger');
      const langOption = e.target.closest('.lang-option');
      
      if (logout) {
        e.preventDefault();
        this.handleLogout();
      } else if (langTrigger) {
        e.stopPropagation();
        
        // Lazy-load i18n module if not loaded
        if (window.bunzLoader && !window.bunzLoader.isLoaded('i18n')) {
          console.log('🌍 Loading i18n module...');
          await window.bunzLoader.load('i18n');
        }
        
        this.toggleLangDropdown();
      } else if (langOption) {
        // Ensure i18n is loaded before changing language
        if (window.bunzLoader && !window.bunzLoader.isLoaded('i18n')) {
          await window.bunzLoader.load('i18n');
        }
        
        document.dispatchEvent(new CustomEvent('bunz:lang-change', { 
          detail: { lang: langOption.getAttribute('data-lang') } 
        }));
        this.closeLangDropdown();
      } else if (!e.target.closest('.lang-dropdown')) {
        this.closeLangDropdown();
      }
    });
        
        // Init language display
        const lang = localStorage.getItem('bunz-lang') || 'en';
        this.updateLangDisplay(lang);
        this.updateLangOptions(lang);
    }
    
    async loadNavbar() {
        if (this.navbarLoaded) return;
        
        // Check if navbar was already SSR'd (look for .navbar anywhere in DOM)
        if (document.querySelector('.navbar')) {
            this.navbarLoaded = true;
            console.log('✅ Navbar already SSR\'d, skipping client load');
            return;
        }
        
        // Navbar not SSR'd, load it client-side
        const container = document.getElementById('bunz-navbar');
        if (!container) {
            console.warn('⚠️ Navbar container not found and navbar not SSR\'d');
            return;
        }
        
        // Load navbar component (fallback for non-SSR pages)
        try {
            const response = await fetch('/htx/components/navbar.htx');
            if (response.ok) {
                const html = await response.text();
                container.innerHTML = html;
                this.navbarLoaded = true;
                console.log('✅ Navbar component loaded (client-side)');
            } else {
                console.error('Failed to load navbar component');
            }
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }
    
    toggleLangDropdown() {
        document.querySelector('.lang-dropdown')?.classList.toggle('open');
    }
    
    closeLangDropdown() {
        document.querySelector('.lang-dropdown')?.classList.remove('open');
    }
    
    updateLangDisplay(lang) {
        const el = document.getElementById('current-lang');
        if (el) el.textContent = lang.toUpperCase();
        this.updateLangOptions(lang);
    }
    
    updateLangOptions(lang) {
        document.querySelectorAll('.lang-option').forEach(opt => 
            opt.classList.toggle('active', opt.getAttribute('data-lang') === lang)
        );
    }
    
    async handleLogout() {
        try {
            console.log('🚪 Logging out...');
            const res = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
            console.log('Logout response:', res.status);
            document.dispatchEvent(new CustomEvent('bunz:auth-logout'));
        } catch (e) {
            console.error('Logout failed:', e);
        }
    }
    
    async updateAuthState() {
        if (!this.container) return;
        console.log('🔄 Updating navbar auth state...');
        
        try {
            const res = await fetch('/api/me', { credentials: 'include' });
            res.ok ? this.showAuthenticatedState(await res.json()) : this.showUnauthenticatedState();
        } catch (e) {
            console.error('Auth check failed:', e);
            this.showUnauthenticatedState();
        }
    }
    
    showAuthenticatedState(user) {
        if (!this.container) return;
        const initial = user.name?.[0]?.toUpperCase() || 'U';
        const logoutText = window.t?.('nav.logout') || 'Logout';
        const profileText = window.t?.('nav.profile') || 'Profile';
        
        this.container.innerHTML = `
            <div class="navbar-user">
                <a href="/htx/pages/profile.htx#app" class="navbar-user-info">
                    <div class="navbar-user-avatar">${initial}</div>
                    <span class="navbar-user-name">${user.name || 'User'}</span>
                </a>
                <button id="logout-btn" class="btn-danger btn-sm">${logoutText}</button>
            </div>`;
    }
    
    showUnauthenticatedState() {
        if (!this.container) return;
        const loginText = window.t?.('nav.login') || 'Login';
        this.container.innerHTML = `<button onclick="openModal('pages/login.htx')" class="btn-secondary btn-sm">${loginText}</button>`;
    }
}

window.bunzNavbar = new BunzNavbar();
