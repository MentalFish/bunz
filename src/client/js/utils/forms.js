'use strict';

/**
 * BUNZ Forms - Advanced form serialization
 * Nested objects, arrays, files, and complex data structures
 */
class BunzForms {
    /**
     * Serialize form to object with nested support
     */
    serialize(form) {
        const data = {};
        const formData = new FormData(form);
        
        for (const [key, value] of formData.entries()) {
            this.setNestedValue(data, key, value);
        }
        
        return data;
    }
    
    /**
     * Serialize to JSON (handles files as base64)
     */
    async serializeToJSON(form) {
        const data = {};
        const formData = new FormData(form);
        
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                // Convert file to base64
                data[key] = await this.fileToBase64(value);
            } else {
                this.setNestedValue(data, key, value);
            }
        }
        
        return JSON.stringify(data);
    }
    
    /**
     * Set nested value in object using dot/bracket notation
     * Supports: user[email], user.name, items[0], tags[]
     */
    setNestedValue(obj, path, value) {
        // Parse path: user[email] -> ['user', 'email']
        const keys = path.match(/[^\[\].]+/g);
        if (!keys) return;
        
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const nextKey = keys[i + 1];
            
            // Check if next is array index
            const isArray = !isNaN(parseInt(nextKey)) || nextKey === '';
            
            if (!(key in current)) {
                current[key] = isArray ? [] : {};
            }
            
            current = current[key];
        }
        
        const finalKey = keys[keys.length - 1];
        
        // Handle array push (tags[])
        if (path.endsWith('[]')) {
            const arrayKey = keys[keys.length - 2];
            if (!Array.isArray(current[arrayKey])) {
                current[arrayKey] = [];
            }
            current[arrayKey].push(value);
        } else {
            current[finalKey] = value;
        }
    }
    
    /**
     * Convert File to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result
            });
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Populate form from object
     */
    populate(form, data) {
        const flat = this.flatten(data);
        
        for (const [key, value] of Object.entries(flat)) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else if (input.type === 'radio') {
                    if (input.value === value) input.checked = true;
                } else {
                    input.value = value;
                }
            }
        }
    }
    
    /**
     * Flatten nested object to dot notation
     */
    flatten(obj, prefix = '') {
        const flat = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flat, this.flatten(value, newKey));
            } else {
                flat[newKey] = value;
            }
        }
        
        return flat;
    }
    
    /**
     * Validate form
     */
    validate(form) {
        const errors = [];
        const inputs = form.querySelectorAll('[required], [pattern], [minlength], [maxlength]');
        
        inputs.forEach(input => {
            if (input.required && !input.value) {
                errors.push({ field: input.name, message: 'This field is required' });
            }
            if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
                errors.push({ field: input.name, message: 'Invalid format' });
            }
            if (input.minlength && input.value.length < input.minlength) {
                errors.push({ field: input.name, message: `Minimum ${input.minlength} characters` });
            }
            if (input.maxlength && input.value.length > input.maxlength) {
                errors.push({ field: input.name, message: `Maximum ${input.maxlength} characters` });
            }
        });
        
        return { valid: errors.length === 0, errors };
    }
}

window.bunzForms = new BunzForms();
console.log('✅ BUNZ Forms initialized');

