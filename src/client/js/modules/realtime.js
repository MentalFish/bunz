'use strict';

/**
 * BUNZ Realtime - SSE and WebSocket support
 * Server-sent events and WebSocket connections
 */
class BunzRealtime {
    connections = new Map();
    reconnectAttempts = new Map();
    maxReconnectAttempts = 5;
    
    /**
     * Connect to SSE endpoint
     */
    sse(url, options = {}) {
        if (this.connections.has(url)) {
            console.warn('SSE already connected:', url);
            return this.connections.get(url);
        }
        
        const eventSource = new EventSource(url);
        
        eventSource.onopen = () => {
            console.log('✅ SSE connected:', url);
            this.reconnectAttempts.delete(url);
            
            document.dispatchEvent(new CustomEvent('bunz:sse-open', {
                detail: { url }
            }));
        };
        
        eventSource.onmessage = (event) => {
            this.handleSSEMessage(event, options);
        };
        
        eventSource.onerror = (error) => {
            console.error('SSE error:', url, error);
            this.handleSSEError(url, eventSource, options);
        };
        
        // Custom event listeners
        if (options.events) {
            for (const [eventName, handler] of Object.entries(options.events)) {
                eventSource.addEventListener(eventName, handler);
            }
        }
        
        this.connections.set(url, { type: 'sse', connection: eventSource });
        return eventSource;
    }
    
    /**
     * Handle SSE message
     */
    handleSSEMessage(event, options) {
        let data = event.data;
        
        try {
            data = JSON.parse(data);
        } catch (e) {
            // Not JSON, use as-is
        }
        
        // Auto-update target if specified
        if (options.target && data.html) {
            const el = document.querySelector(options.target);
            if (el) el.innerHTML = data.html;
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('bunz:sse-message', {
            detail: { data, raw: event.data }
        }));
        
        // Custom handler
        if (options.onMessage) {
            options.onMessage(data);
        }
    }
    
    /**
     * Handle SSE error
     */
    handleSSEError(url, eventSource, options) {
        const attempts = this.reconnectAttempts.get(url) || 0;
        
        if (attempts < this.maxReconnectAttempts && options.reconnect !== false) {
            this.reconnectAttempts.set(url, attempts + 1);
            
            const delay = 1000 * Math.pow(2, attempts);
            console.log(`🔄 SSE reconnecting in ${delay}ms...`);
            
            setTimeout(() => {
                if (eventSource.readyState === EventSource.CLOSED) {
                    this.disconnect(url);
                    this.sse(url, options);
                }
            }, delay);
        } else {
            console.error('❌ SSE max reconnect attempts reached');
            this.disconnect(url);
        }
    }
    
    /**
     * Connect to WebSocket
     */
    ws(url, options = {}) {
        if (this.connections.has(url)) {
            console.warn('WebSocket already connected:', url);
            return this.connections.get(url).connection;
        }
        
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected:', url);
            this.reconnectAttempts.delete(url);
            
            document.dispatchEvent(new CustomEvent('bunz:ws-open', {
                detail: { url }
            }));
            
            if (options.onOpen) options.onOpen();
        };
        
        ws.onmessage = (event) => {
            let data = event.data;
            
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Not JSON
            }
            
            document.dispatchEvent(new CustomEvent('bunz:ws-message', {
                detail: { data, raw: event.data }
            }));
            
            if (options.onMessage) options.onMessage(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', url, error);
            if (options.onError) options.onError(error);
        };
        
        ws.onclose = () => {
            console.log('WebSocket closed:', url);
            this.handleWSClose(url, options);
        };
        
        this.connections.set(url, { type: 'ws', connection: ws });
        return ws;
    }
    
    /**
     * Handle WebSocket close
     */
    handleWSClose(url, options) {
        this.connections.delete(url);
        
        const attempts = this.reconnectAttempts.get(url) || 0;
        
        if (attempts < this.maxReconnectAttempts && options.reconnect !== false) {
            this.reconnectAttempts.set(url, attempts + 1);
            
            const delay = 1000 * Math.pow(2, attempts);
            console.log(`🔄 WebSocket reconnecting in ${delay}ms...`);
            
            setTimeout(() => {
                this.ws(url, options);
            }, delay);
        }
    }
    
    /**
     * Send WebSocket message
     */
    send(url, data) {
        const conn = this.connections.get(url);
        if (conn && conn.type === 'ws' && conn.connection.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            conn.connection.send(message);
        } else {
            console.error('WebSocket not connected:', url);
        }
    }
    
    /**
     * Disconnect from endpoint
     */
    disconnect(url) {
        const conn = this.connections.get(url);
        if (conn) {
            if (conn.type === 'sse') {
                conn.connection.close();
            } else if (conn.type === 'ws') {
                conn.connection.close();
            }
            this.connections.delete(url);
            this.reconnectAttempts.delete(url);
        }
    }
    
    /**
     * Disconnect all
     */
    disconnectAll() {
        this.connections.forEach((conn, url) => {
            this.disconnect(url);
        });
    }
}

window.bunzRealtime = new BunzRealtime();
console.log('✅ BUNZ Realtime initialized');

