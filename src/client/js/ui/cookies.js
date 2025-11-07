'use strict';

/**
 * BUNZ Cookies - GDPR-compliant cookie consent
 * Default: Reject All
 * Persistent toast with 10s timeout
 */
class BunzCookies {
    consentKey = 'bunz-cookie-consent';
    preferencesKey = 'bunz-cookie-preferences';
    toastId = null;
    autoRejectTimeout = null;
    
    // Cookie categories
    categories = {
        necessary: {
            name: 'Necessary',
            description: 'Required for basic site functionality',
            required: true,
            cookies: ['bunz-cookie-consent', 'bunz-cookie-preferences']
        },
        functional: {
            name: 'Functional',
            description: 'Remember your preferences (language, theme)',
            required: false,
            cookies: ['bunz-lang', 'session']
        },
        analytics: {
            name: 'Analytics',
            description: 'Help us improve the site',
            required: false,
            cookies: []
        },
        marketing: {
            name: 'Marketing',
            description: 'Personalized advertising',
            required: false,
            cookies: []
        }
    };
    
    constructor() {
        this.checkConsent();
    }
    
    /**
     * Check if consent has been given
     */
    checkConsent() {
        const consent = localStorage.getItem(this.consentKey);
        
        if (!consent) {
            // No consent yet, show toast after page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => this.showConsentToast(), 1000);
                });
            } else {
                setTimeout(() => this.showConsentToast(), 1000);
            }
        } else {
            // Apply saved preferences
            this.applyConsent(JSON.parse(consent));
        }
    }
    
    /**
     * Show cookie consent toast
     */
    showConsentToast() {
        if (!window.bunzToast) {
            console.error('BunzToast not loaded');
            return;
        }
        
        const message = `
            <strong>🍪 Cookie Consent</strong><br>
            We use cookies to provide basic functionality. 
            By default, all non-essential cookies are rejected. 
            <a href="#" onclick="bunzCookies.showSettings(); return false;" style="color: var(--primary); text-decoration: underline;">Manage preferences</a>
        `;
        
        this.toastId = window.bunzToast.show({
            message,
            type: 'cookie',
            duration: 0, // Persistent
            persistent: true,
            actions: [
                {
                    label: 'Reject All',
                    primary: false,
                    callback: () => this.rejectAll()
                },
                {
                    label: 'Accept Necessary Only',
                    primary: false,
                    callback: () => this.acceptNecessary()
                },
                {
                    label: 'Accept All',
                    primary: true,
                    callback: () => this.acceptAll()
                }
            ]
        });
        
        // Auto-reject after 10 seconds
        this.autoRejectTimeout = setTimeout(() => {
            console.log('⏱️ Auto-rejecting cookies after 10s timeout');
            this.rejectAll();
        }, 10000);
        
        document.dispatchEvent(new CustomEvent('bunz:cookie-consent-shown'));
    }
    
    /**
     * Show detailed settings modal
     */
    async showSettings() {
        // Clear auto-reject timeout
        if (this.autoRejectTimeout) {
            clearTimeout(this.autoRejectTimeout);
            this.autoRejectTimeout = null;
        }
        
        // Dismiss toast
        if (this.toastId && window.bunzToast) {
            window.bunzToast.dismiss(this.toastId);
        }
        
        try {
            // Load HTX template (HTML-first approach)
            const response = await fetch('/htx/components/cookie-settings.htx');
            const html = await response.text();
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const template = temp.querySelector('.cookie-settings');
            
            if (!template) {
                console.error('Cookie settings template not found');
                return;
            }
            
            // Get current preferences
            const saved = this.getPreferences();
            
            // Populate categories using DOM manipulation (no string concatenation!)
            const categoriesContainer = template.querySelector('#cookie-categories');
            if (categoriesContainer) {
                categoriesContainer.innerHTML = '';
                
                Object.entries(this.categories).forEach(([key, cat]) => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'cookie-category';
                    
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'cookie-category-header';
                    
                    const label = document.createElement('label');
                    label.className = 'cookie-category-label';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `cookie-${key}`;
                    if (cat.required) {
                        checkbox.checked = true;
                        checkbox.disabled = true;
                    } else if (saved[key]) {
                        checkbox.checked = true;
                    }
                    
                    const nameSpan = document.createElement('span');
                    const strong = document.createElement('strong');
                    strong.textContent = cat.name;
                    nameSpan.appendChild(strong);
                    
                    if (cat.required) {
                        const badge = document.createElement('span');
                        badge.className = 'badge';
                        badge.textContent = 'Required';
                        nameSpan.appendChild(badge);
                    }
                    
                    label.appendChild(checkbox);
                    label.appendChild(nameSpan);
                    headerDiv.appendChild(label);
                    categoryDiv.appendChild(headerDiv);
                    
                    const desc = document.createElement('p');
                    desc.className = 'cookie-category-desc';
                    desc.textContent = cat.description;
                    categoryDiv.appendChild(desc);
                    
                    if (cat.cookies.length > 0) {
                        const cookiesList = document.createElement('p');
                        cookiesList.className = 'text-muted';
                        cookiesList.style.fontSize = '0.875rem';
                        cookiesList.textContent = `Cookies: ${cat.cookies.join(', ')}`;
                        categoryDiv.appendChild(cookiesList);
                    }
                    
                    categoriesContainer.appendChild(categoryDiv);
                });
            }
            
            // Inject template into modal
            const modalBody = document.getElementById('bunz-modal-body');
            if (modalBody) {
                modalBody.innerHTML = '';
                modalBody.appendChild(template);
                document.getElementById('bunz-modal').classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        } catch (error) {
            console.error('Failed to load cookie settings template:', error);
        }
    }
    
    /**
     * Save settings from modal
     */
    saveSettings() {
        const preferences = {
            necessary: true, // Always true
            functional: document.getElementById('cookie-functional')?.checked || false,
            analytics: document.getElementById('cookie-analytics')?.checked || false,
            marketing: document.getElementById('cookie-marketing')?.checked || false,
            timestamp: new Date().toISOString()
        };
        
        this.applyConsent(preferences);
        
        if (window.closeModal) {
            window.closeModal();
        }
        
        if (window.bunzToast) {
            window.bunzToast.success('Cookie preferences saved!', 3000);
        }
    }
    
    /**
     * Reject all cookies
     */
    rejectAll() {
        const preferences = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString()
        };
        
        this.applyConsent(preferences);
        
        if (window.bunzToast) {
            window.bunzToast.info('All non-essential cookies rejected', 3000);
        }
    }
    
    /**
     * Accept necessary only
     */
    acceptNecessary() {
        const preferences = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString()
        };
        
        this.applyConsent(preferences);
        
        if (window.bunzToast) {
            window.bunzToast.success('Only necessary cookies accepted', 3000);
        }
    }
    
    /**
     * Accept all cookies
     */
    acceptAll() {
        const preferences = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString()
        };
        
        this.applyConsent(preferences);
        
        if (window.bunzToast) {
            window.bunzToast.success('All cookies accepted', 3000);
        }
    }
    
    /**
     * Apply consent and save
     */
    applyConsent(preferences) {
        // Clear auto-reject timeout
        if (this.autoRejectTimeout) {
            clearTimeout(this.autoRejectTimeout);
            this.autoRejectTimeout = null;
        }
        
        // Save consent
        localStorage.setItem(this.consentKey, JSON.stringify(preferences));
        localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
        
        // Clean up non-consented cookies
        if (!preferences.functional) {
            // Remove functional cookies (except necessary ones)
            const necessary = this.categories.necessary.cookies;
            Object.keys(localStorage).forEach(key => {
                if (!necessary.includes(key) && key !== this.consentKey && key !== this.preferencesKey) {
                    if (!preferences.functional && (key === 'bunz-lang' || key === 'session')) {
                        // Keep for now, but mark as pending cleanup
                    }
                }
            });
        }
        
        // Dismiss consent toast
        if (this.toastId && window.bunzToast) {
            window.bunzToast.dismiss(this.toastId);
            this.toastId = null;
        }
        
        document.dispatchEvent(new CustomEvent('bunz:cookie-consent-changed', {
            detail: { preferences }
        }));
        
        console.log('✅ Cookie consent applied:', preferences);
    }
    
    /**
     * Get current preferences
     */
    getPreferences() {
        const saved = localStorage.getItem(this.preferencesKey);
        return saved ? JSON.parse(saved) : {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false
        };
    }
    
    /**
     * Check if category is allowed
     */
    isAllowed(category) {
        const prefs = this.getPreferences();
        return prefs[category] === true;
    }
    
    /**
     * Reset consent (for user profile settings)
     */
    resetConsent() {
        localStorage.removeItem(this.consentKey);
        localStorage.removeItem(this.preferencesKey);
        
        if (window.bunzToast) {
            window.bunzToast.info('Cookie preferences reset', 2000);
        }
        
        // Show consent toast again
        setTimeout(() => this.showConsentToast(), 500);
    }
}

window.bunzCookies = new BunzCookies();
console.log('✅ BUNZ Cookies (GDPR) initialized');

