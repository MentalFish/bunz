'use strict';

/**
 * BUNZ Toast - Toast notification system
 * Center-bottom positioned, auto-dismiss, stackable
 */
class BunzToast {
    toasts = [];
    container = null;
    template = null;
    templateLoaded = false;
    
    constructor() {
        this.createContainer();
        this.loadTemplate();
    }
    
    /**
     * Create toast container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'bunz-toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }
    
    /**
     * Load toast HTX template (HTML-first approach)
     */
    async loadTemplate() {
        try {
            const response = await fetch('/htx/components/toast.htx');
            const html = await response.text();
            
            // Parse and extract template
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const templateEl = temp.querySelector('.toast');
            
            if (templateEl) {
                this.template = templateEl;
                this.templateLoaded = true;
            }
        } catch (error) {
            console.warn('Failed to load toast template, using fallback:', error);
            this.templateLoaded = false;
        }
    }
    
    /**
     * Show toast notification
     * @param {Object} options - Toast configuration
     * @param {string} options.message - Toast message
     * @param {string} options.type - Toast type: 'info', 'success', 'warning', 'error'
     * @param {number} options.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     * @param {Array} options.actions - Array of action buttons
     * @param {Function} options.onDismiss - Callback when dismissed
     */
    show(options) {
        const {
            message = '',
            type = 'info',
            duration = 5000,
            actions = [],
            onDismiss = null,
            persistent = false
        } = options;
        
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Icon mapping
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            cookie: '🍪'
        };
        const icon = icons[type] || icons.info;
        
        // Create toast from HTX template (HTML-first approach)
        let toast;
        if (this.templateLoaded && this.template) {
            // Clone HTX template
            toast = this.template.cloneNode(true);
            toast.id = id;
            toast.className = `toast toast-${type} ${persistent ? 'toast-persistent' : ''}`;
            
            // Populate template with data
            const iconEl = toast.querySelector('.toast-icon');
            const messageEl = toast.querySelector('.toast-message');
            const actionsEl = toast.querySelector('.toast-actions');
            const closeBtn = toast.querySelector('.toast-close');
            
            if (iconEl) iconEl.textContent = icon;
            if (messageEl) messageEl.innerHTML = message;
            
            // Add action buttons
            if (actions.length > 0 && actionsEl) {
                actionsEl.style.display = 'flex';
                actionsEl.innerHTML = '';
                actions.forEach((action, idx) => {
                    const btn = document.createElement('button');
                    btn.className = `toast-btn ${action.primary ? 'toast-btn-primary' : 'toast-btn-secondary'}`;
                    btn.setAttribute('data-action', idx);
                    btn.textContent = action.label;
                    actionsEl.appendChild(btn);
                });
            }
            
            // Handle persistent toasts
            if (persistent && closeBtn) {
                closeBtn.style.display = 'none';
            }
        } else {
            // Fallback: Create toast element manually
            toast = document.createElement('div');
            toast.id = id;
            toast.className = `toast toast-${type} ${persistent ? 'toast-persistent' : ''}`;
            
            // Fallback HTML structure
            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-content">
                    <div class="toast-message">${message}</div>
                    ${actions.length > 0 ? `<div class="toast-actions"></div>` : ''}
                </div>
                ${!persistent ? '<button class="toast-close" aria-label="Close">&times;</button>' : ''}
            `;
            
            // Add action buttons for fallback
            if (actions.length > 0) {
                const actionsEl = toast.querySelector('.toast-actions');
                actions.forEach((action, idx) => {
                    const btn = document.createElement('button');
                    btn.className = `toast-btn ${action.primary ? 'toast-btn-primary' : 'toast-btn-secondary'}`;
                    btn.setAttribute('data-action', idx);
                    btn.textContent = action.label;
                    actionsEl.appendChild(btn);
                });
            }
        }
        
        // Add event listeners for actions
        actions.forEach((action, idx) => {
            const btn = toast.querySelector(`[data-action="${idx}"]`);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (action.callback) action.callback();
                    this.dismiss(id);
                });
            }
        });
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismiss(id));
        }
        
        // Add to container
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('toast-show'), 10);
        
        // Store reference
        this.toasts.push({ id, element: toast, onDismiss });
        
        // Auto-dismiss
        if (duration > 0 && !persistent) {
            setTimeout(() => this.dismiss(id), duration);
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('bunz:toast-shown', {
            detail: { id, type, message }
        }));
        
        return id;
    }
    
    /**
     * Dismiss a toast
     */
    dismiss(id) {
        const toastData = this.toasts.find(t => t.id === id);
        if (!toastData) return;
        
        const { element, onDismiss } = toastData;
        
        // Animate out
        element.classList.remove('toast-show');
        element.classList.add('toast-hide');
        
        setTimeout(() => {
            element.remove();
            this.toasts = this.toasts.filter(t => t.id !== id);
            
            if (onDismiss) onDismiss();
            
            document.dispatchEvent(new CustomEvent('bunz:toast-dismissed', {
                detail: { id }
            }));
        }, 300);
    }
    
    /**
     * Dismiss all toasts
     */
    dismissAll() {
        this.toasts.forEach(t => this.dismiss(t.id));
    }
    
    /**
     * Quick helpers
     */
    info(message, duration = 5000) {
        return this.show({ message, type: 'info', duration });
    }
    
    success(message, duration = 5000) {
        return this.show({ message, type: 'success', duration });
    }
    
    warning(message, duration = 5000) {
        return this.show({ message, type: 'warning', duration });
    }
    
    error(message, duration = 5000) {
        return this.show({ message, type: 'error', duration });
    }
}

window.bunzToast = new BunzToast();
console.log('✅ BUNZ Toast initialized');

