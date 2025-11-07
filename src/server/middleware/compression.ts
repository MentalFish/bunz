/**
 * BUNZ Compression Middleware
 * Adds gzip/brotli compression to responses
 */

import { gzipSync, brotliCompressSync, deflateSync } from 'node:zlib';

/**
 * Compress response body if client supports it
 */
export function compressResponse(
  body: string | Uint8Array,
  acceptEncoding: string | null,
  contentType: string
): { body: string | Uint8Array; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  
  // Don't compress if no accept-encoding or already compressed
  if (!acceptEncoding) {
    return { body, headers };
  }
  
  // Don't compress tiny responses (< 256 bytes)
  const bodyStr = typeof body === 'string' ? body : new TextDecoder().decode(body);
  if (bodyStr.length < 256) {
    return { body, headers };
  }
  
  // Only compress text-based content
  const compressible = [
    'text/',
    'application/javascript',
    'application/json',
    'application/xml',
    'image/svg+xml'
  ].some(type => contentType.startsWith(type));
  
  if (!compressible) {
    return { body, headers };
  }
  
  const bodyBuffer = typeof body === 'string' ? Buffer.from(body) : body;
  
  // Support multiple encodings: brotli > gzip > deflate
  if (acceptEncoding.includes('br')) {
    const compressed = brotliCompressSync(bodyBuffer, {
      params: {
        [require('node:zlib').constants.BROTLI_PARAM_QUALITY]: 6
      }
    });
    headers['Content-Encoding'] = 'br';
    headers['Vary'] = 'Accept-Encoding';
    return { body: compressed, headers };
  } else if (acceptEncoding.includes('gzip')) {
    const compressed = gzipSync(bodyBuffer, { level: 6 });
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
    return { body: compressed, headers };
  } else if (acceptEncoding.includes('deflate')) {
    const compressed = deflateSync(bodyBuffer, { level: 6 });
    headers['Content-Encoding'] = 'deflate';
    headers['Vary'] = 'Accept-Encoding';
    return { body: compressed, headers };
  }
  
  return { body, headers };
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(
  headers: Record<string, string>,
  maxAge: number = 31536000 // 1 year default
): Record<string, string> {
  const now = new Date();
  const expiresDate = new Date(now.getTime() + maxAge * 1000);
  
  return {
    ...headers,
    'Cache-Control': `public, max-age=${maxAge}, immutable`,
    'Expires': expiresDate.toUTCString(),
    'Last-Modified': now.toUTCString(),
    'Pragma': 'public', // HTTP/1.0 compatibility
    'Age': '0' // Explicit age for proxies
  };
}

