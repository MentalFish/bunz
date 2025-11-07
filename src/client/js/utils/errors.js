'use strict';

/**
 * @fileoverview BUNZ Errors - Error boundaries and fallback UI
 * @description Graceful error handling for failed loads with retry logic
 * @version 1.0.0
 * @license MIT
 */

/**
 * BUNZ Errors class for handling load errors
 * @class
 */
class BunzErrors {
    /** @type {Map<string, number>} Retry attempts per URL */
    retryAttempts = new Map();
    
    /** @type {number} Maximum retry attempts */
    maxRetries = 3;
    
    /**
     * Handle load error with fallback UI and retry logic
     * @param {Error} error - Error object
     * @param {string} url - URL that failed to load
     * @param {string|HTMLElement} target - Target element
     * @param {Object} options - Options object
     * @param {boolean} [options.retry=true] - Whether to retry
     * @param {boolean} [options.pushState] - Whether to push state
     * @param {string} [options.fallback] - Custom fallback HTML
     * @returns {Promise<void>}
     */
    async handle(error, url, target, options = {}) {
        console.error('BUNZ Error:', error, url);
        
        const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetEl) return;
        
        // Dispatch error event
        const event = new CustomEvent('bunz:error', {
            detail: { error, url, target },
            cancelable: true
        });
        document.dispatchEvent(event);
        
        if (event.defaultPrevented) return; // Custom handler
        
        // Retry logic
        if (options.retry !== false && this.shouldRetry(url)) {
            return this.retry(url, target, options);
        }
        
        // Show fallback UI
        this.showFallback(targetEl, error, url, options);
    }
    
    /**
     * Check if URL should be retried
     * @param {string} url - URL to check
     * @returns {boolean} True if should retry
     */
    shouldRetry(url) {
        const attempts = this.retryAttempts.get(url) || 0;
        return attempts < this.maxRetries;
    }
    
    /**
     * Retry failed request with exponential backoff
     * @param {string} url - URL to retry
     * @param {string|HTMLElement} target - Target element
     * @param {Object} options - Options object
     * @returns {Promise<void>}
     */
    async retry(url, target, options) {
        const attempts = this.retryAttempts.get(url) || 0;
        this.retryAttempts.set(url, attempts + 1);
        
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts))); // Exponential backoff
        
        if (window.bunz) {
            return window.bunz.load(url, target, options.pushState);
        }
    }
    
    /**
     * Show fallback UI in target element
     * @param {HTMLElement} targetEl - Target element
     * @param {Error} error - Error object
     * @param {string} url - Failed URL
     * @param {Object} options - Options object
     * @returns {void}
     */
    showFallback(targetEl, error, url, options) {
        const fallback = options.fallback || this.defaultFallback(error, url);
        targetEl.innerHTML = fallback;
        targetEl.classList.add('bunz-error');
    }
    
    /**
     * Generate default fallback UI HTML
     * @param {Error} error - Error object
     * @param {string} url - Failed URL
     * @returns {string} Fallback HTML
     */
    defaultFallback(error, url) {
        const statusCode = error.message.match(/HTTP (\d+)/) ? error.message.match(/HTTP (\d+)/)[1] : '500';
        
        return `
            <div class="panel" style="text-align: center; padding: 3rem;">
                <h2 style="color: var(--danger); margin-bottom: 1rem;">⚠️ Failed to Load</h2>
                <p class="text-muted" style="margin-bottom: 2rem;">
                    ${statusCode === '404' ? 'Page not found' : 'Something went wrong'}
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="window.bunzErrors.retryManual('${url}')" class="btn-primary">
                        🔄 Retry
                    </button>
                    <a href="/" class="btn-secondary">
                        🏠 Go Home
                    </a>
                </div>
            </div>
        `;
    }
    
    /**
     * Manual retry trigger (called from fallback UI)
     * @param {string} url - URL to retry
     * @returns {Promise<void>}
     */
    async retryManual(url) {
        this.retryAttempts.delete(url);
        if (window.bunz) {
            await window.bunz.load(url, '#app');
        }
    }
    
    /**
     * Reset retry counter for URL
     * @param {string} url - URL to reset
     * @returns {void}
     */
    reset(url) {
        this.retryAttempts.delete(url);
    }
}

/** @type {BunzErrors} Global BunzErrors instance */
window.bunzErrors = new BunzErrors();

console.log('✅ BUNZ Errors initialized');
