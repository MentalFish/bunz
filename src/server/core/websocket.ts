'use strict';
/**
 * BUNZ WebSocket - WebRTC signaling for video conferencing
 * Manages client connections, rooms, and message routing
 */

import { ServerWebSocket } from "bun";
import { queries, addMeetingParticipant, db } from "../config/db";
import { telemetry } from "../utils/telemetry";

export interface WebSocketData {
  id: string;
  roomId: string;
  userId?: string;
  sessionId?: string;
}

interface Client {
  id: string;
  ws: ServerWebSocket<WebSocketData>;
  roomId: string;
  userId?: string;
}

// Client and room management
const clients = new Map<string, Client>();
const rooms = new Map<string, Set<string>>();

/**
 * Broadcast message to all clients in a room (except excludeId)
 */
function broadcastToRoom(roomId: string, message: any, excludeId?: string): void {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;

  const messageStr = JSON.stringify(message);
  roomClients.forEach(clientId => {
    if (clientId !== excludeId) {
      const client = clients.get(clientId);
      if (client) {
        client.ws.send(messageStr);
      }
    }
  });
}

/**
 * WebSocket handlers for Bun.serve
 */
export const websocketHandlers = {
  /**
   * Handle new WebSocket connection
   */
  open(ws: ServerWebSocket<WebSocketData>) {
    const { id, roomId, userId } = ws.data;
    
    // Add client to maps
    clients.set(id, { id, ws, roomId, userId });
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId)!.add(id);

    // Track telemetry
    telemetry.trackWebSocketConnection(roomId, true);
    telemetry.trackEvent('websocket_connect');

    console.log(`Client ${id} ${userId ? `(User: ${userId})` : ""} joined room ${roomId}`);

    // Track meeting participation if user is authenticated
    if (userId) {
      const meeting = queries.getMeetingByRoomId().get(roomId) as any;
      if (meeting) {
        addMeetingParticipant(meeting.id, userId);
      }
    }

    // Notify others in the room
    broadcastToRoom(roomId, {
      type: "user-joined",
      userId: id,
      authenticatedUserId: userId
    }, id);

    // Send current room members to the new user
    const roomMembers = Array.from(rooms.get(roomId)!).filter(memberId => memberId !== id);
    ws.send(JSON.stringify({
      type: "room-members",
      members: roomMembers
    }));
  },

  /**
   * Handle incoming WebSocket message
   */
  message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    const { id, roomId } = ws.data;
    
    try {
      const data = JSON.parse(message as string);
      
      // Track telemetry
      const messageSize = typeof message === 'string' ? message.length : message.byteLength;
      telemetry.trackWebSocketMessage(data.type || 'unknown', messageSize);
      
      // Handle different message types
      switch (data.type) {
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // WebRTC signaling - send to specific peer
          if (data.target) {
            const targetClient = clients.get(data.target);
            if (targetClient) {
              targetClient.ws.send(JSON.stringify({
                ...data,
                from: id
              }));
            }
          }
          break;
          
        case 'avatar-position':
          // Broadcast avatar position to all in room
          broadcastToRoom(roomId, {
            type: 'avatar-position',
            userId: id,
            lng: data.lng,
            lat: data.lat,
            timestamp: data.timestamp
          }, id);
          break;
          
        case 'canvas-draw':
          // Broadcast drawing action to all in room
          broadcastToRoom(roomId, {
            type: 'canvas-draw',
            userId: id,
            drawType: data.drawType,
            from: data.from,
            to: data.to,
            color: data.color,
            width: data.width,
            timestamp: data.timestamp
          }, id);
          break;
          
        case 'canvas-clear':
          // Broadcast canvas clear to all in room
          broadcastToRoom(roomId, {
            type: 'canvas-clear',
            userId: id,
            timestamp: data.timestamp
          }, id);
          break;
          
        case 'set-presenter':
          // Broadcast presenter assignment to all in room (including sender)
          broadcastToRoom(roomId, {
            type: 'set-presenter',
            presenterId: data.presenterId,
            timestamp: Date.now()
          });
          break;
          
        default:
          // Generic broadcast for unknown types
          broadcastToRoom(roomId, {
            ...data,
            from: id
          }, id);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  },

  /**
   * Handle WebSocket close
   */
  close(ws: ServerWebSocket<WebSocketData>) {
    const { id, roomId, userId } = ws.data;
    
    // Track telemetry
    telemetry.trackWebSocketConnection(roomId, false);
    telemetry.trackEvent('websocket_disconnect');
    
    // Update meeting participation if user is authenticated
    if (userId) {
      const meeting = queries.getMeetingByRoomId().get(roomId) as any;
      if (meeting) {
        db.run(
          "UPDATE meeting_participant SET leftAt = ? WHERE meetingId = ? AND userId = ? AND leftAt IS NULL",
          [Date.now(), meeting.id, userId]
        );
      }
    }

    // Remove client
    clients.delete(id);
    rooms.get(roomId)?.delete(id);
    
    if (rooms.get(roomId)?.size === 0) {
      rooms.delete(roomId);
    }

    console.log(`Client ${id} left room ${roomId}`);

    // Notify others
    broadcastToRoom(roomId, {
      type: "user-left",
      userId: id
    });
  }
};

/**
 * Get room information
 */
export function getRoomInfo(roomId: string) {
  const roomClients = rooms.get(roomId);
  const count = roomClients ? roomClients.size : 0;
  const meeting = queries.getMeetingByRoomId().get(roomId) as any;
  
  return {
    roomId,
    count,
    meeting
  };
}

