'use strict';

/**
 * @fileoverview BUNZ Core - Minimal Component Loader
 * @version 1.0.0
 * @license MIT
 */

/**
 * BUNZ Core class for loading and caching HTML components
 * @class
 */
class BunzCore {
    /** @type {Map<string, string>} Component cache */
    cache = new Map();
    
    /**
     * Load HTML component into target element
     * @param {string} path - Path to HTX component
     * @param {string|HTMLElement} target - Target element selector or element
     * @returns {Promise<void>}
     */
    async load(path, target) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return console.error('Target not found:', target);
        
        try {
            const html = await this.fetch(path);
            el.innerHTML = html;
            
            // Execute scripts in the loaded HTML
            if (window.bunzScripts) {
                await window.bunzScripts.execute(html, el);
            }
            
            document.dispatchEvent(new CustomEvent('bunz:loaded', { detail: { component: path } }));
        } catch (e) {
            console.error('Load error:', e);
        }
    }
    
    /**
     * Fetch component HTML with caching
     * @param {string} path - Path to HTX component
     * @returns {Promise<string>} HTML content
     * @throws {Error} If HTTP request fails
     */
    async fetch(path) {
        const url = path.startsWith('/htx/') ? path : `/htx/${path}`;
        if (this.cache.has(url)) return this.cache.get(url);
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const html = await res.text();
        this.cache.set(url, html);
        return html;
    }
}

/** @type {BunzCore} Global BunzCore instance */
window.bunzCore = new BunzCore();

/**
 * Global helper function to load components
 * @param {string} c - Component path
 * @param {string|HTMLElement} t - Target
 * @returns {Promise<void>}
 */
window.loadComponent = (c, t) => bunzCore.load(c, t);

console.log('✅ BUNZ Core initialized');
