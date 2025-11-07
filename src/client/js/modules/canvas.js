'use strict';

/**
 * BUNZ Canvas - Collaborative drawing canvas
 * Can overlay map, video feeds, or screen shares
 */
class BunzCanvas {
    canvas = null;
    ctx = null;
    overlayTarget = null;
    isDrawing = false;
    lastPos = null;
    color = '#6366f1';
    lineWidth = 3;
    tool = 'pen';  // pen, eraser, line, arrow, rectangle, circle
    drawingHistory = [];
    
    /**
     * Create canvas overlay
     */
    createCanvas(targetSelector, options = {}) {
        const target = document.querySelector(targetSelector);
        if (!target) {
            console.error('Canvas target not found:', targetSelector);
            return;
        }
        
        // Remove any existing canvas on this target (prevent duplicates, especially in Safari)
        const existingCanvas = target.querySelector('.bunz-canvas-container');
        if (existingCanvas) {
            console.log('Removing existing canvas overlay');
            existingCanvas.remove();
        }
        
        // Create canvas container
        const container = document.createElement('div');
        container.className = 'bunz-canvas-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: ${options.enabled !== false ? 'auto' : 'none'};
            z-index: ${options.zIndex || 100};
            touch-action: none;
        `;
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'bunz-canvas';
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            cursor: crosshair;
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
        `;
        
        container.appendChild(this.canvas);
        
        // Ensure target has position context
        const targetPosition = getComputedStyle(target).position;
        if (targetPosition === 'static') {
            target.style.position = 'relative';
        }
        
        // Safari needs overflow hidden on the target for proper clipping
        if (!target.style.overflow) {
            target.style.overflow = 'hidden';
        }
        
        target.appendChild(container);
        this.overlayTarget = target;
        
        // Set canvas size to match container
        this.resizeCanvas();
        
        // Get context
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // Setup drawing
        this.setupDrawing();
        
        // Handle resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('✅ Canvas overlay created on:', targetSelector);
        return this.canvas;
    }
    
    /**
     * Resize canvas to match container
     */
    resizeCanvas() {
        if (!this.canvas || !this.overlayTarget) return;
        
        const rect = this.overlayTarget.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale context for high DPI
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);
        
        // Redraw history
        this.redraw();
    }
    
    /**
     * Setup drawing event handlers
     */
    setupDrawing() {
        // Pointer events (modern browsers)
        this.canvas.addEventListener('pointerdown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('pointermove', (e) => this.draw(e));
        this.canvas.addEventListener('pointerup', () => this.stopDrawing());
        this.canvas.addEventListener('pointerout', () => this.stopDrawing());
        this.canvas.addEventListener('pointercancel', () => this.stopDrawing());
        
        // Touch events (Safari iOS fallback)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDrawing(touch);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.draw(touch);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
    }
    
    /**
     * Start drawing
     */
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getCanvasPos(e);
        this.lastPos = pos;
        
        if (this.tool === 'pen' || this.tool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        }
    }
    
    /**
     * Draw on canvas
     */
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getCanvasPos(e);
        
        switch (this.tool) {
            case 'pen':
                this.drawLine(this.lastPos, pos, this.color, this.lineWidth);
                this.broadcastDrawing('line', this.lastPos, pos, this.color, this.lineWidth);
                break;
                
            case 'eraser':
                this.drawLine(this.lastPos, pos, '#FFFFFF', this.lineWidth * 2);
                this.broadcastDrawing('erase', this.lastPos, pos, '#FFFFFF', this.lineWidth * 2);
                break;
        }
        
        this.lastPos = pos;
    }
    
    /**
     * Stop drawing
     */
    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();
    }
    
    /**
     * Draw line
     */
    drawLine(from, to, color, width) {
        if (!this.ctx) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        // Save to history
        this.drawingHistory.push({
            type: 'line',
            from,
            to,
            color,
            width,
            timestamp: Date.now()
        });
    }
    
    /**
     * Draw shape
     */
    drawShape(type, from, to, color, width) {
        if (!this.ctx) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        
        switch (type) {
            case 'rectangle':
                this.ctx.strokeRect(from.x, from.y, to.x - from.x, to.y - from.y);
                break;
                
            case 'circle':
                const radius = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
                this.ctx.beginPath();
                this.ctx.arc(from.x, from.y, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
                
            case 'arrow':
                this.drawArrow(from, to, color, width);
                break;
        }
        
        // Save to history
        this.drawingHistory.push({
            type,
            from,
            to,
            color,
            width,
            timestamp: Date.now()
        });
    }
    
    /**
     * Draw arrow
     */
    drawArrow(from, to, color, width) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLength = 15;
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        // Draw arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - headLength * Math.cos(angle - Math.PI / 6),
            to.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - headLength * Math.cos(angle + Math.PI / 6),
            to.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }
    
    /**
     * Get canvas position from event
     */
    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    /**
     * Broadcast drawing to other users
     */
    broadcastDrawing(type, from, to, color, width) {
        // Try to get WebSocket from multiple sources
        let websocket = null;
        
        // First try room WebSocket (for /room page)
        if (window.getRoomWebSocket) {
            websocket = window.getRoomWebSocket();
        }
        // Fallback to bunzWebRTC WebSocket (for /meeting page)
        else if (window.bunzWebRTC && window.bunzWebRTC.ws) {
            websocket = window.bunzWebRTC.ws;
        }
        
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            // Normalize coordinates to percentages (0-1) for cross-device compatibility
            const canvasWidth = this.canvas.offsetWidth;
            const canvasHeight = this.canvas.offsetHeight;
            
            websocket.send(JSON.stringify({
                type: 'canvas-draw',
                drawType: type,
                from: {
                    x: from.x / canvasWidth,
                    y: from.y / canvasHeight
                },
                to: {
                    x: to.x / canvasWidth,
                    y: to.y / canvasHeight
                },
                color,
                width: width / canvasWidth, // Normalize line width too
                timestamp: Date.now()
            }));
        } else {
            console.warn('WebSocket not available for broadcasting drawing');
        }
    }
    
    /**
     * Handle remote drawing
     */
    handleRemoteDrawing(data) {
        const { drawType, from, to, color, width } = data;
        
        // Denormalize coordinates from percentages to pixels for this device
        const canvasWidth = this.canvas.offsetWidth;
        const canvasHeight = this.canvas.offsetHeight;
        
        const fromPixels = {
            x: from.x * canvasWidth,
            y: from.y * canvasHeight
        };
        
        const toPixels = {
            x: to.x * canvasWidth,
            y: to.y * canvasHeight
        };
        
        const widthPixels = width * canvasWidth;
        
        if (drawType === 'line' || drawType === 'erase') {
            this.drawLine(fromPixels, toPixels, color, widthPixels);
        } else {
            this.drawShape(drawType, fromPixels, toPixels, color, widthPixels);
        }
    }
    
    /**
     * Clear canvas
     */
    clear() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawingHistory = [];
        
        // Broadcast clear
        if (window.bunzWebRTC && window.bunzWebRTC.ws) {
            window.bunzWebRTC.ws.send(JSON.stringify({
                type: 'canvas-clear',
                timestamp: Date.now()
            }));
        }
    }
    
    /**
     * Redraw from history
     */
    redraw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawingHistory.forEach(item => {
            if (item.type === 'line') {
                this.drawLine(item.from, item.to, item.color, item.width);
            } else {
                this.drawShape(item.type, item.from, item.to, item.color, item.width);
            }
        });
    }
    
    /**
     * Set drawing color
     */
    setColor(color) {
        this.color = color;
    }
    
    /**
     * Set line width
     */
    setLineWidth(width) {
        this.lineWidth = width;
    }
    
    /**
     * Set tool
     */
    setTool(tool) {
        this.tool = tool;
        
        if (this.canvas) {
            this.canvas.style.cursor = tool === 'eraser' ? 'not-allowed' : 'crosshair';
        }
    }
    
    /**
     * Toggle canvas visibility
     */
    toggle(visible) {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (container) {
            container.style.pointerEvents = visible ? 'auto' : 'none';
            container.style.opacity = visible ? '1' : '0';
        }
    }
    
    /**
     * Show canvas
     */
    show() {
        this.toggle(true);
    }
    
    /**
     * Hide canvas
     */
    hide() {
        this.toggle(false);
    }
}

window.bunzCanvas = new BunzCanvas();
console.log('✅ BUNZ Canvas initialized');

