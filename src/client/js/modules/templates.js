'use strict';

/**
 * BUNZ Templates - Atomic micro-template system
 * Loads and renders HTX atoms (smallest reusable HTML units)
 * 
 * Hierarchy:
 * - atoms/      : Micro-templates (video-item, toggle-button, etc.)
 * - components/ : Medium UI elements (modal, toast, navbar)
 * - pages/      : Full pages (dashboard, room, etc.)
 */
class BunzTemplates {
    cache = new Map();
    
    /**
     * Load an atom template from HTX
     * @param {string} name - Atom name (without .htx extension)
     * @returns {Promise<string>} HTML template string
     */
    async loadAtom(name) {
        const cacheKey = `atom:${name}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`/htx/atoms/${name}.htx`);
            if (!response.ok) {
                throw new Error(`Atom not found: ${name}`);
            }
            
            const html = await response.text();
            
            // Extract just the HTML, skip comments and style tags
            const temp = document.createElement('div');
            temp.innerHTML = html;
            
            // Remove comment nodes
            const walker = document.createTreeWalker(temp, NodeFilter.SHOW_COMMENT);
            const commentsToRemove = [];
            while (walker.nextNode()) {
                commentsToRemove.push(walker.currentNode);
            }
            commentsToRemove.forEach(comment => comment.remove());
            
            const cleanedTemplate = temp.innerHTML.trim();
            this.cache.set(cacheKey, cleanedTemplate);
            
            return cleanedTemplate;
        } catch (error) {
            console.error(`Failed to load atom: ${name}`, error);
            throw error;
        }
    }
    
    /**
     * Render a template with data
     * @param {string} template - HTML template string
     * @param {Object} data - Data to interpolate
     * @returns {string} Rendered HTML
     */
    render(template, data = {}) {
        // Simple template interpolation: {key} -> value
        return template.replace(/{(\w+)}/g, (match, key) => {
            const value = data[key];
            return value !== undefined ? value : '';
        });
    }
    
    /**
     * Load and render an atom template
     * @param {string} atomName - Atom name
     * @param {Object} data - Data to interpolate
     * @returns {Promise<string>} Rendered HTML
     */
    async renderAtom(atomName, data = {}) {
        const template = await this.loadAtom(atomName);
        return this.render(template, data);
    }
    
    /**
     * Create a DOM element from an atom template
     * @param {string} atomName - Atom name
     * @param {Object} data - Data to interpolate
     * @returns {Promise<Element>} DOM element
     */
    async createElement(atomName, data = {}) {
        const html = await this.renderAtom(atomName, data);
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        const element = temp.firstElementChild;
        if (!element) {
            throw new Error(`Failed to create element from atom: ${atomName}`);
        }
        
        return element;
    }
    
    /**
     * Create multiple elements from an atom template
     * @param {string} atomName - Atom name
     * @param {Array<Object>} dataArray - Array of data objects
     * @returns {Promise<Element[]>} Array of DOM elements
     */
    async createElements(atomName, dataArray = []) {
        return Promise.all(
            dataArray.map(data => this.createElement(atomName, data))
        );
    }
    
    /**
     * Preload multiple atoms for performance
     * @param {string[]} atomNames - Array of atom names to preload
     * @returns {Promise<void>}
     */
    async preload(atomNames = []) {
        await Promise.all(
            atomNames.map(name => this.loadAtom(name))
        );
        console.log(`✅ Preloaded ${atomNames.length} atom(s):`, atomNames.join(', '));
    }
    
    /**
     * Clear template cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Template cache cleared');
    }
}

// Export global instance
window.bunzTemplates = new BunzTemplates();
console.log('✅ BUNZ Templates initialized (atomic micro-templates)');

