'use strict';
/**
 * Security Middleware
 * Rate limiting, security headers, and request validation
 */

// Rate limiting storage
const rateLimits = new Map<string, { count: number, resetAt: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(
  ip: string, 
  maxRequests = 10, 
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimits.get(ip);
  
  // Clean up expired records periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimits.entries()) {
      if (now > value.resetAt) {
        rateLimits.delete(key);
      }
    }
  }
  
  if (!record || now > record.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * Security headers helper
 */
export function getSecurityHeaders(isProduction = false): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=(self)',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' ws: wss: https:; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  };
  
  // Only add HSTS in production
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  
  return headers;
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response, isProduction = false): Response {
  const securityHeaders = getSecurityHeaders(isProduction);
  
  // Merge existing response headers with security headers
  // Existing headers take precedence (don't overwrite compression, cache, etc.)
  const mergedHeaders = new Headers(response.headers);
  
  for (const [key, value] of Object.entries(securityHeaders)) {
    // Only set if not already present (preserve compression/cache headers)
    if (!mergedHeaders.has(key)) {
      mergedHeaders.set(key, value);
    }
  }
  
  // Create new Response with merged headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: mergedHeaders
  });
}

/**
 * CORS configuration
 */
export function setCorsHeaders(response: Response, req: Request): void {
  const origin = req.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPrelight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 });
    setCorsHeaders(response, req);
    return response;
  }
  return null;
}

/**
 * Create rate limit exceeded response
 */
export function rateLimitResponse(resetAt: number): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }), 
    { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString()
      }
    }
  );
}

