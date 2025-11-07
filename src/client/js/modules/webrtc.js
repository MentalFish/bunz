'use strict';

/**
 * BUNZ WebRTC - Audio/Video Communication
 * Handles peer connections, media streams, and screen sharing
 */
class BunzWebRTC {
    ws = null;
    localStream = null;
    screenStream = null;
    peers = new Map();
    roomId = null;
    userId = null;
    
    config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // Free public TURN servers for NAT traversal (ngrok, mobile networks, etc.)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ],
        iceCandidatePoolSize: 10
    };
    
    callbacks = {
        onLocalStream: null,
        onRemoteStream: null,
        onRemoteStreamRemoved: null,
        onScreenShare: null,
        onPeerJoined: null,
        onPeerLeft: null,
        onError: null
    };
    
    /**
     * Initialize WebRTC for a room
     */
    async init(roomId, callbacks = {}) {
        this.roomId = roomId;
        this.callbacks = { ...this.callbacks, ...callbacks };
        
        // Connect to signaling server
        this.connectSignaling();
        
        console.log(`🎥 WebRTC initialized for room: ${roomId}`);
    }
    
    /**
     * Connect to WebSocket signaling server
     */
    connectSignaling() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?room=${this.roomId}`;
        console.log('🔌 Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ WebRTC signaling connected');
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleSignalingMessage(message);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (this.callbacks.onError) this.callbacks.onError(error);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.cleanup();
        };
    }
    
    /**
     * Handle signaling messages
     */
    async handleSignalingMessage(message) {
        const { type, from, userId } = message;
        
        switch (type) {
            case 'room-members':
                // Initial member list
                message.members.forEach(memberId => {
                    this.createPeerConnection(memberId);
                });
                break;
                
            case 'user-joined':
                console.log(`👋 User joined: ${userId}`);
                this.createPeerConnection(userId);
                if (this.callbacks.onPeerJoined) {
                    this.callbacks.onPeerJoined(userId);
                }
                break;
                
            case 'user-left':
                console.log(`👋 User left: ${userId}`);
                this.removePeer(userId);
                if (this.callbacks.onPeerLeft) {
                    this.callbacks.onPeerLeft(userId);
                }
                break;
                
            case 'offer':
                await this.handleOffer(from, message.offer);
                break;
                
            case 'answer':
                await this.handleAnswer(from, message.answer);
                break;
                
            case 'ice-candidate':
                await this.handleIceCandidate(from, message.candidate);
                break;
        }
    }
    
    /**
     * Start local camera/microphone
     */
    async startLocalMedia(options = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(options);
            
            if (this.callbacks.onLocalStream) {
                this.callbacks.onLocalStream(this.localStream);
            }
            
            // Add local stream to all existing peers
            this.peers.forEach((peer, peerId) => {
                this.localStream.getTracks().forEach(track => {
                    peer.connection.addTrack(track, this.localStream);
                });
            });
            
            console.log('✅ Local media started');
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            if (this.callbacks.onError) this.callbacks.onError(error);
            throw error;
        }
    }
    
    /**
     * Start screen sharing
     */
    async startScreenShare() {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });
            
            if (this.callbacks.onScreenShare) {
                this.callbacks.onScreenShare(this.screenStream);
            }
            
            // Replace video track in all peer connections
            const videoTrack = this.screenStream.getVideoTracks()[0];
            this.peers.forEach((peer, peerId) => {
                const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
            
            // Stop screen share when user clicks "Stop sharing"
            videoTrack.onended = () => {
                this.stopScreenShare();
            };
            
            console.log('✅ Screen sharing started');
            return this.screenStream;
        } catch (error) {
            console.error('Error sharing screen:', error);
            if (this.callbacks.onError) this.callbacks.onError(error);
            throw error;
        }
    }
    
    /**
     * Stop screen sharing and return to camera
     */
    stopScreenShare() {
        if (!this.screenStream) return;
        
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
        
        // Restore camera track
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            this.peers.forEach((peer, peerId) => {
                const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            });
        }
        
        console.log('Screen sharing stopped');
    }
    
    /**
     * Create peer connection
     */
    createPeerConnection(peerId) {
        if (this.peers.has(peerId)) return;
        
        const pc = new RTCPeerConnection(this.config);
        
        // Add local tracks if available
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }
        
        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log(`📹 Received remote track from ${peerId}`);
            if (this.callbacks.onRemoteStream) {
                this.callbacks.onRemoteStream(peerId, event.streams[0]);
            }
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignaling({
                    type: 'ice-candidate',
                    target: peerId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.removePeer(peerId);
            }
        };
        
        this.peers.set(peerId, { connection: pc, peerId });
        
        // Create offer if we have local stream
        if (this.localStream) {
            this.createOffer(peerId);
        }
    }
    
    /**
     * Create and send offer
     */
    async createOffer(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        try {
            const offer = await peer.connection.createOffer();
            await peer.connection.setLocalDescription(offer);
            
            this.sendSignaling({
                type: 'offer',
                target: peerId,
                offer: offer
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }
    
    /**
     * Handle incoming offer
     */
    async handleOffer(peerId, offer) {
        let peer = this.peers.get(peerId);
        if (!peer) {
            this.createPeerConnection(peerId);
            peer = this.peers.get(peerId);
        }
        
        try {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.connection.createAnswer();
            await peer.connection.setLocalDescription(answer);
            
            this.sendSignaling({
                type: 'answer',
                target: peerId,
                answer: answer
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }
    
    /**
     * Handle incoming answer
     */
    async handleAnswer(peerId, answer) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        try {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }
    
    /**
     * Handle ICE candidate
     */
    async handleIceCandidate(peerId, candidate) {
        const peer = this.peers.get(peerId);
        if (!peer) return;
        
        try {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }
    
    /**
     * Send signaling message
     */
    sendSignaling(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * Remove peer
     */
    removePeer(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.connection.close();
            this.peers.delete(peerId);
            
            if (this.callbacks.onRemoteStreamRemoved) {
                this.callbacks.onRemoteStreamRemoved(peerId);
            }
        }
    }
    
    /**
     * Toggle audio
     */
    toggleAudio(enabled) {
        if (!this.localStream) return false;
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = enabled ?? !audioTrack.enabled;
            return audioTrack.enabled;
        }
        return false;
    }
    
    /**
     * Toggle video
     */
    toggleVideo(enabled) {
        if (!this.localStream) return false;
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = enabled ?? !videoTrack.enabled;
            return videoTrack.enabled;
        }
        return false;
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        
        // Close all peer connections
        this.peers.forEach((peer, peerId) => {
            peer.connection.close();
        });
        this.peers.clear();
        
        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        console.log('WebRTC cleaned up');
    }
}

window.bunzWebRTC = new BunzWebRTC();
console.log('✅ BUNZ WebRTC initialized');

