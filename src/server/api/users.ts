'use strict';
/**
 * BUNZ API - User endpoints
 * Handles current user information
 */

import type { Session, User } from "../middleware/auth";

/**
 * GET /api/me - Get current authenticated user
 */
export async function handleGetMe(session: Session & { user: User }): Promise<Response> {
  return Response.json(session.user);
}

