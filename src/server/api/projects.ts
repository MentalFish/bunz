'use strict';
/**
 * BUNZ API - Project endpoints
 * Handles project CRUD operations within organizations
 */

import { queries, createProject, db } from "../config/db";
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
 * GET /api/organizations/:orgId/projects - Get projects for organization
 */
export async function handleGetProjects(orgId: string, session: Session & { user: User }): Promise<Response> {
  // Check authorization
  if (!isOrganizationMember(orgId, session.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const projects = queries.getProjectsByOrganizationId().all(orgId);
  return Response.json(projects);
}

/**
 * POST /api/organizations/:orgId/projects - Create new project
 */
export async function handleCreateProject(req: Request, orgId: string, session: Session & { user: User }): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Check authorization
  if (!isOrganizationMember(orgId, session.user.id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as any;
  const projectId = createProject({
    name: body.name,
    description: body.description,
    organizationId: orgId,
    teamId: body.teamId,
    createdById: session.user.id,
  });
  
  return Response.json({ id: projectId, name: body.name, description: body.description, teamId: body.teamId });
}

