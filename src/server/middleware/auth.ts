import { Database } from "bun:sqlite";
import { db } from "../config/db";

// Simple authentication functions using native Bun APIs

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

// Hash password using Bun's built-in password hashing
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

// Create user
export async function createUser(name: string, email: string, password: string): Promise<User> {
  const userId = crypto.randomUUID();
  const now = Date.now();
  const hashedPassword = await hashPassword(password);
  
  // Insert user
  db.run(
    "INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, email, 0, name, now, now]
  );
  
  // Insert password
  db.run(
    "INSERT INTO password (id, userId, hashedPassword) VALUES (?, ?, ?)",
    [crypto.randomUUID(), userId, hashedPassword]
  );
  
  return {
    id: userId,
    email,
    name,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  };
}

// Authenticate user
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const userResult = db.query("SELECT * FROM user WHERE email = ?").get(email) as any;
  
  if (!userResult) {
    return null;
  }
  
  const passwordResult = db.query("SELECT hashedPassword FROM password WHERE userId = ?").get(userResult.id) as any;
  
  if (!passwordResult) {
    return null;
  }
  
  const isValid = await verifyPassword(password, passwordResult.hashedPassword);
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: userResult.id,
    email: userResult.email,
    name: userResult.name,
    emailVerified: !!userResult.emailVerified,
    createdAt: userResult.createdAt,
    updatedAt: userResult.updatedAt,
  };
}

// Create session
export function createSession(userId: string): Session {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  
  db.run(
    "INSERT INTO session (id, userId, expiresAt) VALUES (?, ?, ?)",
    [sessionId, userId, expiresAt]
  );
  
  return {
    id: sessionId,
    userId,
    expiresAt,
  };
}

// Get session
export function getSession(sessionId: string): (Session & { user: User }) | null {
  const result = db.query(`
    SELECT s.id, s.userId, s.expiresAt,
           u.email, u.name, u.emailVerified, u.createdAt, u.updatedAt
    FROM session s
    JOIN user u ON s.userId = u.id
    WHERE s.id = ? AND s.expiresAt > ?
  `).get(sessionId, Date.now()) as any;
  
  if (!result) {
    return null;
  }
  
  return {
    id: result.id,
    userId: result.userId,
    expiresAt: result.expiresAt,
    user: {
      id: result.userId,
      email: result.email,
      name: result.name,
      emailVerified: !!result.emailVerified,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    },
  };
}

// Delete session
export function deleteSession(sessionId: string): void {
  db.run("DELETE FROM session WHERE id = ?", [sessionId]);
}

// Get session from cookie
export function getSessionFromCookie(cookies: string | null): (Session & { user: User }) | null {
  if (!cookies) return null;
  
  const sessionCookie = cookies
    .split(";")
    .find(c => c.trim().startsWith("session="))
    ?.split("=")[1];
  
  if (!sessionCookie) return null;
  
  return getSession(sessionCookie);
}
