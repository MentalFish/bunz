'use strict';

/**
 * BUNZ A11y - Accessibility features
 * ARIA announcements, focus management, keyboard navigation
 */
class BunzA11y {
    liveRegion = null;
    focusHistory = [];
    
    constructor() {
        this.createLiveRegion();
        this.setupKeyboardNav();
    }
    
    /**
     * Create ARIA live region for announcements
     */
    createLiveRegion() {
        this.liveRegion = document.createElement('div');
        this.liveRegion.className = 'sr-only';
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.liveRegion);
    }
    
    /**
     * Announce message to screen readers
     */
    announce(message, priority = 'polite') {
        if (!this.liveRegion) this.createLiveRegion();
        
        this.liveRegion.setAttribute('aria-live', priority);
        this.liveRegion.textContent = '';
        
        setTimeout(() => {
            this.liveRegion.textContent = message;
        }, 100);
    }
    
    /**
     * Manage focus after content swap
     */
    manageFocus(container, options = {}) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;
        
        // Save current focus
        if (document.activeElement && document.activeElement !== document.body) {
            this.focusHistory.push(document.activeElement);
        }
        
        // Focus target
        if (options.focus) {
            const target = el.querySelector(options.focus);
            if (target) {
                target.focus();
                return;
            }
        }
        
        // Auto-focus first heading within the container (not outside it)
        // Look for h1 first, then h2, prioritizing direct children over nested elements
        const heading = el.querySelector(':scope > header h1, :scope > h1, :scope h1, :scope > header h2, :scope > h2, :scope h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            // Don't visually focus headings - only set for screen reader navigation
            // heading.focus() causes unwanted blue outline
            // Remove tabindex after brief delay to restore natural tab order
            setTimeout(() => heading.removeAttribute('tabindex'), 100);
            return;
        }
        
        // Focus the container itself if no heading found
        if (el.id) {
            el.setAttribute('tabindex', '-1');
            el.focus();
            setTimeout(() => el.removeAttribute('tabindex'), 100);
        }
    }
    
    /**
     * Restore previous focus
     */
    restoreFocus() {
        const previous = this.focusHistory.pop();
        if (previous && document.body.contains(previous)) {
            previous.focus();
        }
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNav() {
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal.active');
                if (modal && window.closeModal) {
                    window.closeModal();
                }
            }
        });
        
        // Trap focus in modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const modal = document.querySelector('.modal.active .modal-content');
                if (modal) {
                    this.trapFocus(e, modal);
                }
            }
        });
    }
    
    /**
     * Trap focus within container
     */
    trapFocus(event, container) {
        const focusable = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
    
}

window.bunzA11y = new BunzA11y();
console.log('✅ BUNZ A11y initialized');

