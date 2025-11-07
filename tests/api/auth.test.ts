/**
 * API Tests - Authentication Endpoints
 * Tests all auth-related API endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3000";
let testUserId: string;

describe("Authentication API", () => {
  
  test("POST /api/auth/sign-up - creates new user", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: "SecurePassword123!",
        name: "Test User"
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toContain("test-");
    testUserId = data.user.id;
  });
  
  test("POST /api/auth/sign-up - rejects duplicate email", async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    
    // First signup
    await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "SecurePassword123!",
        name: "Test User"
      })
    });
    
    // Duplicate signup
    const response = await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "SecurePassword123!",
        name: "Test User 2"
      })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
  
  test("POST /api/auth/sign-up - rejects weak password", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: "weak",
        name: "Test User"
      })
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("at least 8 characters");
  });
  
  test("POST /api/auth/sign-in - logs in existing user", async () => {
    const email = `login-test-${Date.now()}@example.com`;
    const password = "SecurePassword123!";
    
    // Create user
    await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Login Test" })
    });
    
    // Login
    const response = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.email).toBe(email);
    
    // Check session cookie
    const cookies = response.headers.get("Set-Cookie");
    expect(cookies).toContain("session=");
  });
  
  test("POST /api/auth/sign-in - rejects invalid credentials", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "WrongPassword123!"
      })
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
  
  test("GET /api/me - returns authenticated user", async () => {
    const email = `me-test-${Date.now()}@example.com`;
    const password = "SecurePassword123!";
    
    // Create and login
    await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Me Test" })
    });
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const cookies = loginResponse.headers.get("Set-Cookie");
    const sessionCookie = cookies?.split(';')[0];
    
    // Get current user
    const response = await fetch(`${BASE_URL}/api/me`, {
      headers: { Cookie: sessionCookie || "" }
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.email).toBe(email);
  });
  
  test("GET /api/me - returns 401 without session", async () => {
    const response = await fetch(`${BASE_URL}/api/me`);
    expect(response.status).toBe(401);
  });
  
  test("POST /api/logout - clears session", async () => {
    const email = `logout-test-${Date.now()}@example.com`;
    const password = "SecurePassword123!";
    
    // Create and login
    await fetch(`${BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Logout Test" })
    });
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    const cookies = loginResponse.headers.get("Set-Cookie");
    const sessionCookie = cookies?.split(';')[0];
    
    // Logout
    const logoutResponse = await fetch(`${BASE_URL}/api/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie || "" }
    });
    
    expect(logoutResponse.status).toBe(200);
    
    // Verify session is cleared
    const meResponse = await fetch(`${BASE_URL}/api/me`, {
      headers: { Cookie: sessionCookie || "" }
    });
    
    expect(meResponse.status).toBe(401);
  });
});

console.log("✅ API Tests configured for Bun test runner");

