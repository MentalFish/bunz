'use strict';
/**
 * BUNZ API - Meeting endpoints
 * Handles meeting CRUD operations and room information
 */

import { db, createMeeting } from "../config/db";
import { getRoomInfo } from "../core/websocket";
import { escapeHtml } from "../utils/security";
import type { Session, User } from "../middleware/auth";

/**
 * Check if user is member of organization
 */
function isOrganizationMember(orgId: string, userId: string): boolean {
  const membership = db.query(
    "SELECT id FROM organization_member WHERE organizationId = ? AND userId = ?"
  ).get(orgId, userId);
  return !!membership;
}

/**
 * GET /api/organizations/:orgId/meetings - Get meetings for organization
 */
export async function handleGetMeetings(orgId: string, session: Session & { user: User }): Promise<Response> {
  // Check authorization
  if (!isOrganizationMember(orgId, session.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const meetings = db.query("SELECT * FROM meeting WHERE organizationId = ?").all(orgId);
  return Response.json(meetings);
}

/**
 * POST /api/organizations/:orgId/meetings - Create new meeting
 */
export async function handleCreateMeeting(req: Request, orgId: string, session: Session & { user: User }): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Check authorization
  if (!isOrganizationMember(orgId, session.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as any;
  const meetingId = createMeeting({
    title: body.title,
    description: body.description,
    roomId: body.roomId || crypto.randomUUID(),
    projectId: body.projectId,
    organizationId: orgId,
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd,
    createdById: session.user.id,
  });
  
  return Response.json({ 
    id: meetingId, 
    title: body.title,
    description: body.description,
    roomId: body.roomId,
    projectId: body.projectId,
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd
  });
}

/**
 * GET /api/room-info?room=:roomId - Get room information
 */
export async function handleRoomInfo(url: URL): Promise<Response> {
  const roomId = url.searchParams.get("room") || "default";
  const { count, meeting } = getRoomInfo(roomId);
  
  return new Response(
    `<div class="room-info">
      <h3>Room: ${escapeHtml(roomId)}</h3>
      ${meeting ? `<p><strong>${escapeHtml(meeting.title)}</strong></p>` : ""}
      <p>Connected users: ${count}</p>
    </div>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

