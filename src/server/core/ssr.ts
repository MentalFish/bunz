'use strict';
/**
 * BUNZ SSR - Server-Side Rendering & HTX metadata parsing
 * Handles pre-rendering HTX content for SEO and initial page loads
 */

import { escapeHtml } from "../utils/security";
import { db, queries } from "../config/db";
import type { Session, User } from "../middleware/auth";

/**
 * Parse HTX metadata from HTML comments
 * @example <!-- @title: Home Page @guards: auth -->
 */
export function parseHTXMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  const commentMatch = /<!--([\s\S]*?)-->/.exec(html);
  if (!commentMatch) return metadata;
  
  const commentContent = commentMatch[1];
  const metadataRegex = /@(\w+):\s*([^\n]+)/g;
  let match;
  
  while ((match = metadataRegex.exec(commentContent)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    metadata[key] = value;
  }
  
  return metadata;
}

/**
 * Strip HTX metadata comments from content
 */
export function stripHTXMetadata(html: string): string {
  return html.replace(/<!--\s*@[\s\S]*?-->\n?/g, '');
}

/**
 * Inject navbar component with auth state (SSR)
 */
async function injectNavbarComponent(html: string, session: (Session & { user: User }) | null): Promise<string> {
  try {
    // Load navbar component
    const navbarPath = "./src/client/htx/components/navbar.htx";
    const navbarFile = Bun.file(navbarPath);
    let navbarHtml = await navbarFile.text();
    
    // If user is logged in, inject auth state
    if (session?.user) {
      const initial = session.user.name?.[0]?.toUpperCase() || 'U';
      const userName = escapeHtml(session.user.name || 'User');
      
      // Replace the login button with user info
      navbarHtml = navbarHtml.replace(
        /<div id="navbar-auth">[\s\S]*?<\/div>/,
        `<div id="navbar-auth">
                <div class="navbar-user">
                    <a href="/htx/profile.htx#app" class="navbar-user-info">
                        <div class="navbar-user-avatar">${initial}</div>
                        <span class="navbar-user-name">${userName}</span>
                    </a>
                    <button id="logout-btn" class="btn-danger btn-sm" data-i18n="nav.logout">Logout</button>
                </div>
            </div>`
      );
    }
    
    // Inject navbar into app.html
    html = html.replace(
      '<div id="bunz-navbar"></div>',
      navbarHtml
    );
    
    console.log(`✅ SSR: Navbar component injected ${session ? 'with auth state' : '(guest)'}`);
  } catch (error) {
    console.error('SSR: Error injecting navbar:', error);
    // Keep placeholder if error - client-side will handle it
  }
  
  return html;
}

/**
 * Inject dynamic data into HTX content for SSR
 */
async function injectDynamicData(
  pathname: string,
  htxContent: string,
  session: (Session & { user: User }) | null
): Promise<string> {
  let content = htxContent;
  
  // Dashboard: Pre-render organizations
  if (pathname === '/dashboard' && session) {
    try {
      const orgs = queries.getOrganizationsByUserId().all(session.user.id) as any[];
      
      if (orgs.length === 0) {
        const emptyState = `
                <div class="empty-state">
                    <h3>No organizations yet</h3>
                    <p>Create your first organization to get started</p>
                    <button onclick="showCreateOrgModal()" class="btn-primary">
                        + Create Organization
                    </button>
                </div>
            `;
        content = content.replace(
          /(<div id="organizations-list"[^>]*>)([\s\S]*?)(<\/div>)/,
          `$1${emptyState}$3`
        );
      } else {
        const orgsHtml = orgs.map(org => `
                <div class="card" onclick="navigateTo('/org/${escapeHtml(org.id)}')">
                    <h3>🏢 ${escapeHtml(org.name)}</h3>
                    <p style="color: var(--text-secondary);">/${escapeHtml(org.slug)}</p>
                    <p style="margin-top: 0.5rem;">
                        Created ${new Date(org.createdAt).toLocaleDateString()}
                    </p>
                </div>
            `).join('');
        
        content = content.replace(
          /(<div id="organizations-list"[^>]*>)([\s\S]*?)(<\/div>)/,
          `$1${orgsHtml}$3`
        );
      }
    } catch (error) {
      console.error('SSR: Error loading organizations:', error);
      // Keep content as-is if error
    }
  }
  
  return content;
}

/**
 * Pre-render HTX content into app.html for SSR
 */
export async function prerenderHTX(
  url: URL,
  htxContent: string,
  appHtml: string,
  session: (Session & { user: User }) | null = null
): Promise<string> {
  console.log(`🎨 Pre-rendering: ${url.pathname}`);
  
  // Parse metadata from HTX
  const metadata = parseHTXMetadata(htxContent);
  let cleanContent = stripHTXMetadata(htxContent);
  
  // Inject dynamic data for SSR
  cleanContent = await injectDynamicData(url.pathname, cleanContent, session);
  
  // Start with app.html
  let rendered = appHtml;
  
  // Inject navbar component (SSR)
  rendered = await injectNavbarComponent(rendered, session);
  
  // Update title (with HTML escaping for security)
  if (metadata.title) {
    const safeTitle = escapeHtml(metadata.title);
    rendered = rendered.replace(
      /<title>.*?<\/title>/,
      `<title>${safeTitle}</title>`
    );
    
    // Add Open Graph tags for social media
    rendered = rendered.replace(
      '</head>',
      `  <meta property="og:title" content="${safeTitle}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url.toString())}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
</head>`
    );
  }
  
  // Inject pre-rendered content
  const appDivRegex = /(<div id="app">)([\s\S]*?)(<\/div>\s*<\/main>)/;
  const match = rendered.match(appDivRegex);
  
  console.log(`🔍 SSR: Looking for #app div...`);
  console.log(`🔍 SSR: Match found: ${!!match}`);
  
  if (match) {
    rendered = rendered.replace(
      appDivRegex,
      `<div id="app" data-prerendered="true">\n            ${cleanContent}\n        </div>\n    </main>`
    );
    console.log(`✅ SSR: Content injected with data-prerendered="true"`);
    console.log(`📝 SSR: Injected ${cleanContent.length} bytes of content`);
  } else {
    console.log(`❌ SSR: Regex match failed - cannot inject content`);
    console.log(`📝 SSR: Sample of HTML: ${rendered.substring(0, 500)}`);
  }
  
  return rendered;
}

/**
 * Determine HTX file path from URL
 * Handles dynamic routes like /meeting/:id, /room/:id
 * Pages are now in /htx/pages/ subdirectory
 */
export function getHTXPath(pathname: string): string {
  if (pathname === '/') {
    return '/htx/pages/index.htx';
  }
  
  // Handle dynamic routes
  // /meeting/123 -> /htx/pages/meeting.htx
  // /room/lobby -> /htx/pages/room.htx
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    // Take first segment for dynamic routes
    return `/htx/pages/${segments[0]}.htx`;
  }
  
  return `/htx/pages${pathname}.htx`;
}

