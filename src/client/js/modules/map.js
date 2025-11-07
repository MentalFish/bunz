'use strict';

/**
 * BUNZ Map - MapLibre GL integration with draggable avatars
 * Collaborative map with user presence and positioning
 */
class BunzMap {
    map = null;
    avatars = new Map();
    draggedAvatar = null;
    
    /**
     * Initialize MapLibre map
     */
    async init(containerId, options = {}) {
        const container = typeof containerId === 'string' 
            ? document.getElementById(containerId) 
            : containerId;
            
        if (!container) {
            console.error('Map container not found:', containerId);
            return;
        }
        
        // Load MapLibre GL if not already loaded
        if (!window.maplibregl) {
            await this.loadMapLibre();
        }
        
        // Default options
        const defaultOptions = {
            center: [10.7522, 59.9139], // Oslo, Norway
            zoom: 12,
            style: 'https://demotiles.maplibre.org/style.json'
        };
        
        // Create map
        this.map = new maplibregl.Map({
            container: container,
            ...defaultOptions,
            ...options
        });
        
        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
        
        // Setup map event handlers
        this.setupMapEvents();
        
        console.log('✅ MapLibre map initialized');
        return this.map;
    }
    
    /**
     * Load MapLibre GL library dynamically
     */
    async loadMapLibre() {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css';
        document.head.appendChild(link);
        
        // Load JS
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Setup map event handlers
     */
    setupMapEvents() {
        // Click to place own avatar
        this.map.on('click', (e) => {
            if (!this.draggedAvatar) {
                this.placeAvatar('me', e.lngLat.lng, e.lngLat.lat);
                this.broadcastPosition(e.lngLat.lng, e.lngLat.lat);
            }
        });
    }
    
    /**
     * Add draggable avatar to map
     */
    addAvatar(userId, lng, lat, options = {}) {
        if (this.avatars.has(userId)) {
            // Update existing avatar
            this.updateAvatarPosition(userId, lng, lat);
            return;
        }
        
        // Create avatar element
        const el = document.createElement('div');
        el.className = 'map-avatar';
        el.id = `avatar-${userId}`;
        el.innerHTML = `
            <div class="avatar-marker" style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${options.color || 'var(--primary)'};
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                cursor: ${userId === 'me' ? 'grab' : 'pointer'};
                user-select: none;
            ">
                ${options.label || userId.substring(0, 2).toUpperCase()}
            </div>
            ${options.name ? `
                <div class="avatar-label" style="
                    position: absolute;
                    top: 45px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    white-space: nowrap;
                    font-size: 12px;
                    pointer-events: none;
                ">
                    ${escapeHtml(options.name)}
                </div>
            ` : ''}
        `;
        
        // Create marker
        const marker = new maplibregl.Marker({
            element: el,
            draggable: userId === 'me'
        })
        .setLngLat([lng, lat])
        .addTo(this.map);
        
        // Handle drag events for own avatar
        if (userId === 'me') {
            marker.on('dragend', () => {
                const lngLat = marker.getLngLat();
                this.broadcastPosition(lngLat.lng, lngLat.lat);
            });
        }
        
        this.avatars.set(userId, { marker, element: el, options });
        console.log(`📍 Avatar added: ${userId} at [${lng}, ${lat}]`);
    }
    
    /**
     * Update avatar position
     */
    updateAvatarPosition(userId, lng, lat, animate = true) {
        const avatar = this.avatars.get(userId);
        if (!avatar) return;
        
        avatar.marker.setLngLat([lng, lat]);
        
        if (animate) {
            avatar.element.querySelector('.avatar-marker')?.classList.add('pulse');
            setTimeout(() => {
                avatar.element.querySelector('.avatar-marker')?.classList.remove('pulse');
            }, 300);
        }
    }
    
    /**
     * Remove avatar
     */
    removeAvatar(userId) {
        const avatar = this.avatars.get(userId);
        if (avatar) {
            avatar.marker.remove();
            this.avatars.delete(userId);
            console.log(`📍 Avatar removed: ${userId}`);
        }
    }
    
    /**
     * Place avatar (helper)
     */
    placeAvatar(userId, lng, lat, options = {}) {
        this.addAvatar(userId, lng, lat, options);
    }
    
    /**
     * Broadcast position to other users
     */
    broadcastPosition(lng, lat) {
        if (window.bunzWebRTC && window.bunzWebRTC.ws) {
            window.bunzWebRTC.ws.send(JSON.stringify({
                type: 'avatar-position',
                lng,
                lat,
                timestamp: Date.now()
            }));
        }
    }
    
    /**
     * Fly to location
     */
    flyTo(lng, lat, zoom = 14) {
        if (this.map) {
            this.map.flyTo({ center: [lng, lat], zoom });
        }
    }
    
    /**
     * Get map instance
     */
    getMap() {
        return this.map;
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.avatars.forEach((avatar, userId) => {
            avatar.marker.remove();
        });
        this.avatars.clear();
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

// HTML escape helper
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

window.bunzMap = new BunzMap();
console.log('✅ BUNZ Map initialized');

