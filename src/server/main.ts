'use strict';
/**
 * BUNZ Server - Main entry point
 * Modular, clean architecture following BUNZ philosophy
 */

import { getSessionFromCookie } from "./middleware/auth";
import { initializeDatabase } from "./config/db";
import { handleStaticFile } from "./core/static";
import { websocketHandlers, type WebSocketData } from "./core/websocket";
import { prerenderHTX, getHTXPath } from "./core/ssr";
import {
  applySecurityHeaders,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  handleCorsPrelight,
  setCorsHeaders
} from "./middleware/security";
import { compressResponse } from "./middleware/compression";
import { telemetry, handleTelemetryMetrics, startTelemetryLogging } from "./utils/telemetry";

// API handlers
import { handleSignUp, handleSignIn, handleSignOut, handleChangePassword, handleDeleteAccount } from "./api/auth";
import { handleGetMe } from "./api/users";
import { handleGetOrganizations, handleCreateOrganization } from "./api/organizations";
import { handleGetTeams, handleCreateTeam } from "./api/teams";
import { handleGetProjects, handleCreateProject } from "./api/projects";
import { handleGetMeetings, handleCreateMeeting, handleRoomInfo } from "./api/meetings";
import { handleGetHTXFiles } from "./api/htx";

// Initialize database
initializeDatabase();

// Start telemetry logging (every 30 minutes)
startTelemetryLogging(30);

/**
 * Helper to get session from request
 */
async function getSession(req: Request) {
  const cookies = req.headers.get("cookie");
  return getSessionFromCookie(cookies);
}

/**
 * Helper to track response and apply security headers
 */
function trackAndRespond(
  response: Response,
  req: Request,
  startTime: number,
  isProduction: boolean
): Response {
  const duration = performance.now() - startTime;
  const url = new URL(req.url);
  telemetry.trackRequest(req.method, url.pathname, response.status, duration);
  return applySecurityHeaders(response, isProduction);
}

/**
 * Helper to create compressed HTML response
 */
function createHTMLResponse(html: string, req: Request, options: { cache?: boolean } = {}): Response {
  const acceptEncoding = req.headers.get('accept-encoding');
  const { body, headers: compressionHeaders } = compressResponse(html, acceptEncoding, 'text/html');
  
  const headers: Record<string, string> = {
    "Content-Type": "text/html; charset=utf-8",
    ...compressionHeaders
  };
  
  // Add cache headers if requested (for static HTML)
  if (options.cache) {
    headers["Cache-Control"] = "public, max-age=3600"; // 1 hour
    const expires = new Date(Date.now() + 3600 * 1000);
    headers["Expires"] = expires.toUTCString();
  } else {
    headers["Cache-Control"] = "no-cache, must-revalidate";
  }
  
  return new Response(body, { headers });
}

/**
 * Main server
 */
const server = Bun.serve<WebSocketData>({
  port: parseInt(process.env.PORT || '3000'),
  
  async fetch(req, server) {
    const startTime = performance.now();
    const url = new URL(req.url);
    const clientIp = getClientIp(req);
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Request logging
    console.log(`${new Date().toISOString()} ${clientIp} ${req.method} ${url.pathname}`);
    
    // Handle CORS preflight
    const corsPreflight = handleCorsPrelight(req);
    if (corsPreflight) {
      return applySecurityHeaders(corsPreflight, isProduction);
    }

    // ========================================
    // PUBLIC API ENDPOINTS (No auth required)
    // ========================================

    // Authentication (with rate limiting)
    if (url.pathname === "/api/auth/sign-up") {
      const limit = rateLimit(clientIp, 5, 300000); // 5 requests per 5 minutes
      if (!limit.allowed) {
        return applySecurityHeaders(rateLimitResponse(limit.resetAt), isProduction);
      }
      const response = await handleSignUp(req);
      setCorsHeaders(response, req);
      return trackAndRespond(response, req, startTime, isProduction);
    }

    if (url.pathname === "/api/auth/sign-in") {
      const limit = rateLimit(clientIp, 5, 300000); // 5 requests per 5 minutes
      if (!limit.allowed) {
        return applySecurityHeaders(rateLimitResponse(limit.resetAt), isProduction);
      }
      const response = await handleSignIn(req);
      setCorsHeaders(response, req);
      return trackAndRespond(response, req, startTime, isProduction);
    }

    if (url.pathname === "/api/auth/sign-out" || url.pathname === "/api/logout") {
      const session = await getSession(req);
      const response = await handleSignOut(session);
      setCorsHeaders(response, req);
      return trackAndRespond(response, req, startTime, isProduction);
    }

    // Telemetry endpoint (protected - requires authentication)
    if (url.pathname === "/api/telemetry") {
      const session = await getSession(req);
      if (!session) {
        const response = new Response("Unauthorized", { status: 401 });
        return trackAndRespond(response, req, startTime, isProduction);
      }
      
      const format = url.searchParams.get("format") as 'json' | 'prometheus' | 'summary' || 'json';
      const response = handleTelemetryMetrics(format);
      return trackAndRespond(response, req, startTime, isProduction);
    }

    // HTX discovery
    if (url.pathname === "/api/htx-files") {
      const response = await handleGetHTXFiles();
      return trackAndRespond(response, req, startTime, isProduction);
    }

    // WebSocket upgrade for signaling (with verified auth)
    if (url.pathname === "/ws") {
      const session = await getSession(req);
      const roomId = url.searchParams.get("room") || "default";
      const clientId = crypto.randomUUID();
      
      // Only allow authenticated WebSocket connections with verified session
      const upgraded = server.upgrade(req, {
        data: { 
          id: clientId, 
          roomId,
          userId: session?.user?.id,  // Verified from session cookie
          sessionId: session?.id
        }
      });
      
      if (!upgraded) {
        const response = new Response("WebSocket upgrade failed", { status: 400 });
        return trackAndRespond(response, req, startTime, isProduction);
      }
      return undefined;
    }

    // ========================================
    // PROTECTED API ENDPOINTS (Auth required)
    // ========================================

    if (url.pathname.startsWith("/api/")) {
      const session = await getSession(req);
      
      // Auth-required endpoints
      if (url.pathname === "/api/auth/change-password") {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const response = await handleChangePassword(req, session);
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      if (url.pathname === "/api/auth/delete-account" && req.method === "DELETE") {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const response = await handleDeleteAccount(session);
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      if (url.pathname === "/api/me") {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const response = await handleGetMe(session);
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      if (url.pathname === "/api/organizations") {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        let response;
        if (req.method === "POST") {
          response = await handleCreateOrganization(req, session);
        } else {
          response = await handleGetOrganizations(session);
        }
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      // Organization sub-resources (teams, projects, meetings)
      const orgTeamsMatch = url.pathname.match(/^\/api\/organizations\/([^\/]+)\/teams$/);
      if (orgTeamsMatch) {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const orgId = orgTeamsMatch[1];
        let response;
        if (req.method === "POST") {
          response = await handleCreateTeam(req, orgId, session);
        } else {
          response = await handleGetTeams(orgId, session);
        }
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      const orgProjectsMatch = url.pathname.match(/^\/api\/organizations\/([^\/]+)\/projects$/);
      if (orgProjectsMatch) {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const orgId = orgProjectsMatch[1];
        let response;
        if (req.method === "POST") {
          response = await handleCreateProject(req, orgId, session);
        } else {
          response = await handleGetProjects(orgId, session);
        }
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      const orgMeetingsMatch = url.pathname.match(/^\/api\/organizations\/([^\/]+)\/meetings$/);
      if (orgMeetingsMatch) {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const orgId = orgMeetingsMatch[1];
        let response;
        if (req.method === "POST") {
          response = await handleCreateMeeting(req, orgId, session);
        } else {
          response = await handleGetMeetings(orgId, session);
        }
        setCorsHeaders(response, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }

      // Room info (authenticated)
      if (url.pathname === "/api/room-info") {
        if (!session) {
          const response = new Response("Unauthorized", { status: 401 });
          return trackAndRespond(response, req, startTime, isProduction);
        }
        const response = await handleRoomInfo(url);
        return trackAndRespond(response, req, startTime, isProduction);
      }
    }

    // ========================================
    // STATIC FILE SERVING
    // ========================================

    const staticResponse = await handleStaticFile(url.pathname, req);
    if (staticResponse) {
      return trackAndRespond(staticResponse, req, startTime, isProduction);
    }

    // ========================================
    // SPA FALLBACK WITH HYBRID SSR
    // ========================================

    if (!url.pathname.startsWith("/api/") && 
        !url.pathname.startsWith("/htx/") && 
        !url.pathname.startsWith("/js/") && 
        !url.pathname.startsWith("/bunz/") && 
        !url.pathname.startsWith("/css/") && 
        !url.pathname.startsWith("/lang/") && 
        !url.pathname.startsWith("/ws")) {
      
      const htxPath = getHTXPath(url.pathname);
      const htxFilePath = `./src/client${htxPath}`;
      
      console.log(`📥 Request for: ${url.pathname}, HTX path: ${htxPath}, File path: ${htxFilePath}`);
      
      try {
        const htxFile = Bun.file(htxFilePath);
        const exists = await htxFile.exists();
        
        if (!exists) {
          // HTX file not found, serve plain app.html
          const appHtml = await Bun.file("./src/client/main.html").text();
          const response = createHTMLResponse(appHtml, req);
          return trackAndRespond(response, req, startTime, isProduction);
        }
        
        // Get session for SSR data injection
        const session = await getSession(req);
        
        // Load both files
        const htxContent = await htxFile.text();
        const appHtml = await Bun.file("./src/client/main.html").text();
        
        // Pre-render with session data
        const rendered = await prerenderHTX(url, htxContent, appHtml, session);
        
        const response = createHTMLResponse(rendered, req);
        return trackAndRespond(response, req, startTime, isProduction);
        
      } catch (error) {
        console.error('❌ Error during SSR:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : error);
        // Fallback to plain app.html
        const appHtml = await Bun.file("./src/client/main.html").text();
        const response = createHTMLResponse(appHtml, req);
        return trackAndRespond(response, req, startTime, isProduction);
      }
    }

    const response = new Response("Not Found", { status: 404 });
    return applySecurityHeaders(response, isProduction);
  },

  websocket: websocketHandlers
});

console.log(`🚀 BUNZ Server running at http://localhost:${server.port}`);
console.log(`🔐 Custom authentication ready`);
console.log(`🎥 WebRTC video conferencing ready`);
console.log(`💾 SQLite database initialized`);
console.log(`✨ Modular BUNZ architecture loaded`);

