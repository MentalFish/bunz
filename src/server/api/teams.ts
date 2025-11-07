'use strict';
/**
 * BUNZ API - Team endpoints
 * Handles team CRUD operations within organizations
 */

import { queries, createTeam, db } from "../config/db";
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
 * GET /api/organizations/:orgId/teams - Get teams for organization
 */
export async function handleGetTeams(orgId: string, session: Session & { user: User }): Promise<Response> {
  // Check authorization
  if (!isOrganizationMember(orgId, session.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const teams = queries.getTeamsByOrganizationId().all(orgId);
  return Response.json(teams);
}

/**
 * POST /api/organizations/:orgId/teams - Create new team
 */
export async function handleCreateTeam(req: Request, orgId: string, session: Session & { user: User }): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Check authorization
  if (!isOrganizationMember(orgId, session.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as any;
  const teamId = createTeam({
    name: body.name,
    description: body.description,
    organizationId: orgId,
    createdById: session.user.id,
  });
  
  return Response.json({ id: teamId, name: body.name, description: body.description });
}

