'use strict';
/**
 * BUNZ Static - Static file serving with caching and compression
 * Handles CSS, JS, HTX, and language files
 * Serves from src/client/ directory
 */

import { compressResponse, addCacheHeaders } from "../middleware/compression";

const CLIENT_ROOT = "./src/client";

/**
 * Serve static CSS files with compression and caching
 */
export async function serveCSS(pathname: string, req: Request): Promise<Response | null> {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (pathname === "/main.css") {
    const content = await Bun.file("./src/client/main.css").text();
    const acceptEncoding = req.headers.get('accept-encoding');
    const { body, headers: compressionHeaders } = compressResponse(content, acceptEncoding, 'text/css');
    
    const headers = isDev 
      ? { "Content-Type": "text/css", ...compressionHeaders }
      : addCacheHeaders({ "Content-Type": "text/css", ...compressionHeaders }, 86400); // 1 day
    
    return new Response(body, { headers });
  }

  if (pathname.startsWith("/css/")) {
    const cssFile = pathname.substring(1);
    const file = Bun.file(`${CLIENT_ROOT}/${cssFile}`);
    if (await file.exists()) {
      const content = await file.text();
      const acceptEncoding = req.headers.get('accept-encoding');
      const { body, headers: compressionHeaders } = compressResponse(content, acceptEncoding, 'text/css');
      
      const headers = addCacheHeaders({ 
        "Content-Type": "text/css",
        ...compressionHeaders
      }, 31536000); // 1 year
      
      return new Response(body, { headers });
    }
  }

  return null;
}

/**
 * Serve language JSON files with compression and caching
 */
export async function serveLanguageFiles(pathname: string, req: Request): Promise<Response | null> {
  if (pathname.startsWith("/lang/")) {
    const langFile = pathname.substring(1);
    const file = Bun.file(`${CLIENT_ROOT}/${langFile}`);
    if (await file.exists()) {
      const content = await file.text();
      const acceptEncoding = req.headers.get('accept-encoding');
      const { body, headers: compressionHeaders } = compressResponse(content, acceptEncoding, 'application/json');
      
      const headers = addCacheHeaders({
        "Content-Type": "application/json",
        ...compressionHeaders
      }, 3600); // 1 hour
      
      return new Response(body, { headers });
    }
  }
  return null;
}

/**
 * Serve JavaScript files with compression and caching
 */
export async function serveJavaScript(pathname: string, req: Request): Promise<Response | null> {
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Serve main.js from client root
  if (pathname === "/main.js") {
    const content = await Bun.file("./src/client/main.js").text();
    const acceptEncoding = req.headers.get('accept-encoding');
    const { body, headers: compressionHeaders } = compressResponse(content, acceptEncoding, 'application/javascript');
    
    const headers = isDev 
      ? { "Content-Type": "application/javascript", "Cache-Control": "no-cache", ...compressionHeaders }
      : addCacheHeaders({ "Content-Type": "application/javascript", ...compressionHeaders }, 31536000);
    
    return new Response(body, { headers });
  }
  
  // Serve all other JS from client/
  if (pathname.startsWith("/js/")) {
    const jsFile = pathname.substring(1);
    const file = Bun.file(`${CLIENT_ROOT}/${jsFile}`);
    if (await file.exists()) {
      const content = await file.text();
      const acceptEncoding = req.headers.get('accept-encoding');
      const { body, headers: compressionHeaders } = compressResponse(content, acceptEncoding, 'application/javascript');
      
      const headers = isDev
        ? { "Content-Type": "application/javascript", "Cache-Control": "no-cache", ...compressionHeaders }
        : addCacheHeaders({ "Content-Type": "application/javascript", ...compressionHeaders }, 31536000);
      
      return new Response(body, { headers });
    }
  }
  return null;
}

/**
 * Serve HTX component files with compression
 */
export async function serveHTX(pathname: string, req: Request): Promise<Response | null> {
  if (pathname.startsWith("/htx/")) {
    const htxFile = pathname.substring(1);
    const file = Bun.file(`${CLIENT_ROOT}/${htxFile}`);
    if (await file.exists()) {
      const content = await file.text();
      const acceptEncoding = req.headers.get('accept-encoding');
      const { body, headers: compressionHeaders } = compressResponse(content, acceptEncoding, 'text/html');
      
      const headers = {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache", // HTX components should not be cached
        ...compressionHeaders
      };
      
      return new Response(body, { headers });
    }
  }
  return null;
}

/**
 * Serve main.html for SPA mode with compression
 */
export async function serveApp(req: Request): Promise<Response> {
  const html = await Bun.file("./src/client/main.html").text();
  const acceptEncoding = req.headers.get('accept-encoding');
  const { body, headers: compressionHeaders } = compressResponse(html, acceptEncoding, 'text/html');
  
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache, must-revalidate",
    ...compressionHeaders
  };
  
  return new Response(body, { headers });
}

/**
 * Handle all static file requests with compression
 */
export async function handleStaticFile(pathname: string, req: Request): Promise<Response | null> {
  // Try each static file handler in order
  let response: Response | null;
  
  response = await serveCSS(pathname, req);
  if (response) return response;
  
  response = await serveLanguageFiles(pathname, req);
  if (response) return response;
  
  response = await serveJavaScript(pathname, req);
  if (response) return response;
  
  response = await serveHTX(pathname, req);
  if (response) return response;
  
  if (pathname === "/app") {
    return serveApp(req);
  }
  
  return null;
}

