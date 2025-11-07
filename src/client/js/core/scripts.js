'use strict';

/**
 * @fileoverview BUNZ Scripts - Reliable script execution in swapped content
 * @description Executes inline and external scripts from loaded HTML
 * @version 1.0.0
 * @license MIT
 */

/**
 * BUNZ Scripts class for managing script execution
 * @class
 */
class BunzScripts {
    /** @type {Set<string>} Loaded scripts cache */
    loadedScripts = new Set();
    
    /**
     * Execute all scripts in HTML string or element
     * @param {string} html - HTML string containing scripts
     * @param {string|HTMLElement} container - Container element
     * @returns {Promise<void>}
     */
    async execute(html, container) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const scripts = tempDiv.querySelectorAll('script');
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        
        for (const oldScript of scripts) {
            await this.executeScript(oldScript, el);
        }
        
        // Auto-load component script if exists
        this.autoLoadComponentScript(html);
    }
    
    /**
     * Execute a single script element
     * @param {HTMLScriptElement} oldScript - Original script element
     * @param {HTMLElement} container - Container element
     * @returns {Promise<void>}
     */
    async executeScript(oldScript, container) {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        // Handle external vs inline
        if (oldScript.src) {
            // External script
            if (this.loadedScripts.has(oldScript.src)) {
                return; // Already loaded
            }
            
            return new Promise((resolve, reject) => {
                newScript.onload = () => {
                    this.loadedScripts.add(oldScript.src);
                    resolve();
                };
                newScript.onerror = reject;
                document.head.appendChild(newScript);
            });
        } else {
            // Inline script - wrap in IIFE to avoid variable conflicts
            newScript.textContent = `(function() {\n${oldScript.textContent}\n})();`;
            container.appendChild(newScript);
        }
    }
    
    /**
     * Auto-load component-specific script based on route
     * DEPRECATED: Page scripts are now embedded in HTX files
     * Keeping method for backwards compatibility, but it does nothing
     * @param {string} html - HTML content (unused)
     * @returns {void}
     */
    autoLoadComponentScript(html) {
        // Page scripts are now self-contained in HTX files
        // This method is kept for backwards compatibility but does nothing
        return;
    }
    
    /**
     * Clear loaded scripts cache
     * @returns {void}
     */
    clearCache() {
        this.loadedScripts.clear();
    }
}

/** @type {BunzScripts} Global BunzScripts instance */
window.bunzScripts = new BunzScripts();

console.log('✅ BUNZ Scripts initialized');
