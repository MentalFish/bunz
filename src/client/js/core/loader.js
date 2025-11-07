'use strict';

/**
 * BUNZ Loader - Lazy load modules on demand
 * Only loads modules when actually needed
 */
class BunzLoader {
    loaded = new Set();
    loading = new Map();
    
    // Module path mappings
    modulePaths = {
        // Core modules (lazy-loaded when needed)
        'scripts': '/js/core/scripts.js',
        'state': '/js/core/state.js',
        'cache': '/js/core/cache.js',
        
        // UI modules (lazy-loaded when needed)
        'modal': '/js/ui/modal.js',
        'toast': '/js/ui/toast.js',
        'cookies': '/js/ui/cookies.js',
        'a11y': '/js/ui/a11y.js',
        
        // Utility modules (lazy-loaded when needed)
        'errors': '/js/utils/errors.js',
        'forms': '/js/utils/forms.js',
        
        // Feature modules (lazy-loaded when needed)
        'templates': '/js/modules/templates.js',
        'components': '/js/modules/components.js',
        'i18n': '/js/modules/i18n.js',
        'webrtc': '/js/modules/webrtc.js',
        'map': '/js/modules/map.js',
        'canvas': '/js/modules/canvas.js',
        'realtime': '/js/modules/realtime.js',
    };
    
    /**
     * Load a module lazily
     */
    async load(moduleName) {
        // Already loaded
        if (this.loaded.has(moduleName)) {
            return Promise.resolve();
        }
        
        // Currently loading
        if (this.loading.has(moduleName)) {
            return this.loading.get(moduleName);
        }
        
        // Start loading
        const promise = this.loadScript(moduleName);
        this.loading.set(moduleName, promise);
        
        try {
            await promise;
            this.loaded.add(moduleName);
            this.loading.delete(moduleName);
            console.log(`✅ Lazy-loaded: ${moduleName}`);
        } catch (error) {
            console.error(`❌ Failed to load: ${moduleName}`, error);
            this.loading.delete(moduleName);
            throw error;
        }
        
        return promise;
    }
    
    /**
     * Load script element
     */
    loadScript(moduleName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Use module path mapping, fallback to modules/ directory
            script.src = this.modulePaths[moduleName] || `/js/modules/${moduleName}.js`;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Check if module is loaded
     */
    isLoaded(moduleName) {
        return this.loaded.has(moduleName);
    }
    
    /**
     * Load multiple modules
     */
    async loadAll(moduleNames) {
        return Promise.all(moduleNames.map(name => this.load(name)));
    }
}

window.bunzLoader = new BunzLoader();
console.log('✅ BUNZ Loader initialized (lazy-loading enabled)');

// ============================================================================
// AUTO-LOAD MODULES ON DEMAND
// ============================================================================

// ============================================================================
// SMART AUTO-LOADING
// Load modules automatically when needed (after critical path)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Delay non-critical loads slightly (after critical path renders)
    requestIdleCallback(() => {
        // Scripts.js - BUNDLED, don't load again!
        // bunzLoader.load('scripts');
        
        // Modal.js - if modal container exists
        if (document.getElementById('bunz-modal')) {
            bunzLoader.load('modal');
        }
        
        // Toast.js - useful for notifications
        bunzLoader.load('toast');
        
        // Cookies.js - only if no consent given
        if (!localStorage.getItem('cookie-consent')) {
            bunzLoader.load('cookies');
        }
        
        // A11y.js - accessibility features
        bunzLoader.load('a11y');
        
        // Forms.js - only if forms exist
        if (document.querySelector('form')) {
            bunzLoader.load('forms');
        }
    }, { timeout: 1000 });
});

// Auto-load templates.js when needed (room/meeting pages)
document.addEventListener('bunz:loaded', () => {
    const needsTemplates = document.querySelector('.video-container, .room-page-container, .meeting-page');
    if (needsTemplates && !window.bunzTemplates) {
        bunzLoader.load('templates');
    }
});

