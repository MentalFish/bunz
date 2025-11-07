'use strict';
/**
 * BUNZ API - Authentication endpoints
 * Handles sign-up, sign-in, sign-out, password changes, and account deletion
 */

import { createUser, authenticateUser, createSession, deleteSession } from "../middleware/auth";
import { db } from "../config/db";
import { validateEmail, validatePassword, sanitizeInput } from "../utils/security";
import type { Session, User } from "../middleware/auth";

/**
 * Create secure session cookie string
 */
function createSessionCookie(sessionId: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? 'Secure; ' : '';
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  
  return `session=${sessionId}; Path=/; ${secure}HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * POST /api/auth/sign-up - Register new user
 */
export async function handleSignUp(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  try {
    const body = await req.json() as any;
    let { name, email, password } = body;
    
    // Validate input
    if (!name || !email || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Sanitize inputs
    name = sanitizeInput(name, 100);
    email = sanitizeInput(email, 254).toLowerCase();
    
    // Validate email format
    if (!validateEmail(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }
    
    // Validate password strength
    if (!validatePassword(password)) {
      return Response.json({ 
        error: "Password must be at least 12 characters and contain uppercase, lowercase, and numbers" 
      }, { status: 400 });
    }
    
    // Check if user exists
    const existing = db.query("SELECT id FROM user WHERE email = ?").get(email);
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }
    
    // Create user
    const user = await createUser(name, email, password);
    const session = createSession(user.id);
    
    // Set secure cookie
    const response = Response.json({ user });
    response.headers.set("Set-Cookie", createSessionCookie(session.id));
    
    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}

/**
 * POST /api/auth/sign-in - Authenticate user
 */
export async function handleSignIn(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  try {
    const body = await req.json() as any;
    let { email, password } = body;
    
    if (!email || !password) {
      return Response.json({ error: "Missing credentials" }, { status: 400 });
    }
    
    // Sanitize email
    email = sanitizeInput(email, 254).toLowerCase();
    
    const user = await authenticateUser(email, password);
    
    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const session = createSession(user.id);
    
    const response = Response.json({ user });
    response.headers.set("Set-Cookie", createSessionCookie(session.id));
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}

/**
 * POST /api/auth/sign-out (alias: /api/logout) - Sign out user
 */
export async function handleSignOut(session: (Session & { user: User }) | null): Promise<Response> {
  if (session) {
    deleteSession(session.id);
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? 'Secure; ' : '';
  
  const response = Response.json({ success: true });
  response.headers.set("Set-Cookie", `session=; Path=/; ${secure}HttpOnly; SameSite=Strict; Max-Age=0`);
  return response;
}

/**
 * POST /api/auth/change-password - Change user password
 */
export async function handleChangePassword(req: Request, session: Session & { user: User }): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json() as any;
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Missing passwords" }, { status: 400 });
    }
    
    // Validate new password strength
    if (!validatePassword(newPassword)) {
      return Response.json({ 
        error: "Password must be at least 12 characters and contain uppercase, lowercase, and numbers" 
      }, { status: 400 });
    }
    
    // Get user's password from password table
    const passwordRecord = db.query("SELECT hashedPassword FROM password WHERE userId = ?").get(session.user.id) as any;
    if (!passwordRecord) {
      return Response.json({ error: "Password not found" }, { status: 404 });
    }
    
    // Verify current password
    const validPassword = await Bun.password.verify(currentPassword, passwordRecord.hashedPassword);
    if (!validPassword) {
      return Response.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    
    // Hash new password
    const hashedPassword = await Bun.password.hash(newPassword);
    
    // Update password
    db.query("UPDATE password SET hashedPassword = ? WHERE userId = ?").run(hashedPassword, session.user.id);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json({ error: "Failed to change password" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/delete-account - Delete user account
 */
export async function handleDeleteAccount(session: Session & { user: User }): Promise<Response> {
  try {
    // Delete user and all related data (cascade should handle this)
    db.query("DELETE FROM user WHERE id = ?").run(session.user.id);
    
    // Delete session
    deleteSession(session.id);
    
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction ? 'Secure; ' : '';
    
    const response = Response.json({ success: true });
    response.headers.set("Set-Cookie", `session=; Path=/; ${secure}HttpOnly; SameSite=Strict; Max-Age=0`);
    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return Response.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

