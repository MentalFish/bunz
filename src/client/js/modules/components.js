'use strict';

/**
 * BUNZ Components - Reusable HTX Component Loader
 * Provides an easy way to load and use HTX components
 */
class BunzComponents {
    cache = new Map();
    componentPath = '/htx/components/';
    
    /**
     * Load a component by name
     * @param {string} name - Component name (e.g., 'modal', 'panel', 'card')
     * @param {object} options - Optional configuration
     * @returns {Promise<string>} HTML content
     */
    async load(name, options = {}) {
        const cacheKey = `${name}_${JSON.stringify(options)}`;
        
        // Return from cache if available
        if (this.cache.has(cacheKey) && !options.noCache) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`${this.componentPath}${name}.htx`);
            
            if (!response.ok) {
                throw new Error(`Component '${name}' not found`);
            }
            
            let html = await response.text();
            
            // Replace slots if content provided
            if (options.content) {
                html = html.replace('<slot></slot>', options.content);
            }
            
            // Replace named slots
            if (options.slots) {
                Object.entries(options.slots).forEach(([slotName, slotContent]) => {
                    html = html.replace(`<slot name="${slotName}"></slot>`, slotContent);
                });
            }
            
            // Cache the result
            if (!options.noCache) {
                this.cache.set(cacheKey, html);
            }
            
            return html;
            
        } catch (error) {
            console.error(`Failed to load component '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Insert component into a target element
     * @param {string} name - Component name
     * @param {string|HTMLElement} target - Target selector or element
     * @param {object} options - Options including content/slots
     */
    async insert(name, target, options = {}) {
        const html = await this.load(name, options);
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
        
        if (!element) {
            throw new Error(`Target element not found: ${target}`);
        }
        
        if (options.append) {
            element.insertAdjacentHTML('beforeend', html);
        } else {
            element.innerHTML = html;
        }
        
        return element;
    }
    
    /**
     * Create a component and return as element
     * @param {string} name - Component name
     * @param {object} options - Options including content/slots
     * @returns {Promise<HTMLElement>}
     */
    async create(name, options = {}) {
        const html = await this.load(name, options);
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.firstElementChild;
    }
    
    /**
     * Clear component cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Component cache cleared');
    }
    
    /**
     * Preload components
     * @param {Array<string>} names - Component names to preload
     */
    async preload(names = []) {
        const promises = names.map(name => this.load(name));
        await Promise.all(promises);
        console.log(`✅ Preloaded ${names.length} component(s)`);
    }
}

// Global instance
window.bunzComponents = new BunzComponents();

// Convenience function
window.loadComponent = (name, target, options) => bunzComponents.insert(name, target, options);

console.log('✅ BUNZ Components initialized');

