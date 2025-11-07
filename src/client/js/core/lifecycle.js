'use strict';

/**
 * @fileoverview BUNZ Lifecycle - Component lifecycle management
 * @description Provides hooks for before/after swap and cleanup
 * @version 1.0.0
 * @license MIT
 */

/**
 * BUNZ Lifecycle class for managing component lifecycles
 * @class
 */
class BunzLifecycle {
    /** @type {Map<string, Function[]>} Cleanup listeners map */
    listeners = new Map();
    
    /**
     * Trigger before content swap with cancellable event
     * @param {string} target - Target selector
     * @param {string} url - URL being loaded
     * @returns {Promise<boolean>} True if swap should proceed
     */
    async beforeSwap(target, url) {
        const event = new CustomEvent('bunz:beforeSwap', {
            detail: { target, url },
            cancelable: true
        });
        document.dispatchEvent(event);
        
        // Call registered cleanup functions
        if (this.listeners.has(target)) {
            for (const cleanup of this.listeners.get(target)) {
                await cleanup();
            }
            this.listeners.delete(target);
        }
        
        return !event.defaultPrevented;
    }
    
    /**
     * Trigger after content swap event
     * @param {string} target - Target selector
     * @param {string} url - URL that was loaded
     * @param {string} html - HTML content that was swapped
     * @returns {void}
     */
    afterSwap(target, url, html) {
        document.dispatchEvent(new CustomEvent('bunz:afterSwap', {
            detail: { target, url, html }
        }));
    }
    
    /**
     * Register cleanup function for target element
     * @param {string|HTMLElement} target - Target selector or element
     * @param {Function} fn - Cleanup function to execute
     * @returns {void}
     */
    onCleanup(target, fn) {
        const selector = typeof target === 'string' ? target : '#app';
        if (!this.listeners.has(selector)) {
            this.listeners.set(selector, []);
        }
        this.listeners.get(selector).push(fn);
    }
    
    /**
     * Manually trigger cleanup for target
     * @param {string} target - Target selector (default: '#app')
     * @returns {Promise<void>}
     */
    async cleanup(target = '#app') {
        if (this.listeners.has(target)) {
            for (const cleanup of this.listeners.get(target)) {
                await cleanup();
            }
            this.listeners.delete(target);
        }
        
        document.dispatchEvent(new CustomEvent('bunz:cleanup', {
            detail: { target }
        }));
    }
}

/** @type {BunzLifecycle} Global BunzLifecycle instance */
window.bunzLifecycle = new BunzLifecycle();

console.log('✅ BUNZ Lifecycle initialized');
