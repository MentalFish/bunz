'use strict';

/**
 * BUNZ State - State preservation across swaps
 * Preserve elements and form state during navigation
 */
class BunzState {
    preserved = new Map();
    
    /**
     * Preserve elements before swap
     */
    preserveElements(container) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;
        
        // Find all elements with bz-preserve
        const toPreserve = el.querySelectorAll('[bz-preserve]');
        
        toPreserve.forEach(element => {
            const id = element.getAttribute('bz-preserve') || element.id;
            if (id) {
                this.preserved.set(id, {
                    element: element.cloneNode(true),
                    parent: element.parentElement,
                    state: this.captureState(element)
                });
            }
        });
    }
    
    /**
     * Restore preserved elements after swap
     */
    restoreElements(container) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;
        
        this.preserved.forEach((data, id) => {
            // Find new element with same preserve id
            const newElement = el.querySelector(`[bz-preserve="${id}"], #${id}[bz-preserve]`);
            if (newElement && data.element) {
                // Replace with preserved version
                newElement.replaceWith(data.element.cloneNode(true));
                
                // Restore state
                const restored = el.querySelector(`[bz-preserve="${id}"], #${id}[bz-preserve]`);
                if (restored) {
                    this.restoreState(restored, data.state);
                }
            }
        });
        
        this.preserved.clear();
    }
    
    /**
     * Capture element state (forms, scroll position, etc)
     */
    captureState(element) {
        const state = {};
        
        // Form inputs
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
            state.value = element.value;
            if (element.type === 'checkbox' || element.type === 'radio') {
                state.checked = element.checked;
            }
        }
        
        // Scroll position
        if (element.scrollTop || element.scrollLeft) {
            state.scroll = { top: element.scrollTop, left: element.scrollLeft };
        }
        
        // Child form elements
        const inputs = element.querySelectorAll('input, textarea, select');
        if (inputs.length > 0) {
            state.inputs = Array.from(inputs).map(input => ({
                name: input.name || input.id,
                value: input.value,
                checked: input.checked
            }));
        }
        
        return state;
    }
    
    /**
     * Restore element state
     */
    restoreState(element, state) {
        if (!state) return;
        
        // Restore direct element state
        if (state.value !== undefined) {
            element.value = state.value;
        }
        if (state.checked !== undefined) {
            element.checked = state.checked;
        }
        if (state.scroll) {
            element.scrollTop = state.scroll.top;
            element.scrollLeft = state.scroll.left;
        }
        
        // Restore child inputs
        if (state.inputs) {
            state.inputs.forEach(inputState => {
                const input = element.querySelector(`[name="${inputState.name}"], #${inputState.name}`);
                if (input) {
                    input.value = inputState.value;
                    if (inputState.checked !== undefined) {
                        input.checked = inputState.checked;
                    }
                }
            });
        }
    }
    
    /**
     * Clear preserved state
     */
    clear() {
        this.preserved.clear();
    }
}

window.bunzState = new BunzState();
console.log('✅ BUNZ State initialized');

