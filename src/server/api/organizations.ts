'use strict';
/**
 * BUNZ API - Organization endpoints
 * Handles organization CRUD operations
 */

import { queries, createOrganization } from "../config/db";
import type { Session, User } from "../middleware/auth";

/**
 * GET /api/organizations - Get user's organizations
 */
export async function handleGetOrganizations(session: Session & { user: User }): Promise<Response> {
  const orgs = queries.getOrganizationsByUserId().all(session.user.id);
  return Response.json(orgs);
}

/**
 * POST /api/organizations - Create new organization
 */
export async function handleCreateOrganization(req: Request, session: Session & { user: User }): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json();
  const orgId = createOrganization({
    name: body.name,
    slug: body.slug,
    description: body.description,
    ownerId: session.user.id,
  });
  
  return Response.json({ id: orgId, ...body });
}

