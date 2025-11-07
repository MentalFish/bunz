# What is BUNZ?

**BUNZ** is an HTML-first web framework that inverts the traditional JavaScript framework paradigm. Instead of JavaScript generating HTML (like React/Vue), BUNZ loads HTML components dynamically and executes embedded scripts as needed.

## The Core Concept

### Traditional Frameworks (JavaScript → HTML)
```
Write JSX/Templates → Compile → JavaScript → Generates HTML → DOM
```

**Problems:**
- Complex build tooling required
- Large runtime overhead (40-100KB+)
- JavaScript required for basic functionality
- SEO challenges without SSR
- Difficult to debug (view source shows empty div)

### BUNZ Approach (HTML → JavaScript)
```
Write HTML Components (.htx files) → Load on Demand → Execute Scripts → DOM
```

**Benefits:**
- ✅ No build step (optional bundling for production)
- ✅ Minimal runtime (~25KB bundled)
- ✅ Progressive enhancement (works without JS)
- ✅ SEO-friendly with SSR
- ✅ View source shows actual HTML
- ✅ Fast development (just refresh browser)

## How BUNZ Works

### 1. HTX Components (.htx files)

HTX files are self-contained HTML fragments with optional embedded styles and scripts:

```html
<!-- dashboard.htx -->
<div class="dashboard">
    <h1>Dashboard</h1>
    <p>Welcome back!</p>
</div>

<style>
.dashboard {
    padding: 2rem;
    background: var(--surface);
}
</style>

<script>
console.log('Dashboard loaded!');
// Component-specific JavaScript here
</script>
```

### 2. Dynamic Loading System

**BunzCore** loads HTX components on demand:

```javascript
// Load a component
await bunzCore.load('/htx/pages/dashboard.htx', '#app');

// Component is fetched, cached, and inserted into DOM
// Scripts are automatically executed
```

### 3. Server-Side Rendering (SSR)

The server pre-renders HTX content into HTML for:
- Instant page loads (no loading flash)
- SEO optimization
- Better perceived performance

```html
<!-- Server sends this: -->
<div id="app" data-prerendered="true">
    <!-- Pre-rendered dashboard content here -->
</div>

<!-- Client detects SSR and skips loading/animation -->
```

### 4. Client-Side Routing

**BunzRouter** handles navigation without page reloads:

```html
<!-- Links automatically handled -->
<a href="/htx/pages/dashboard.htx#app">Dashboard</a>

<!-- With route guards -->
<a href="/htx/pages/dashboard.htx#app" bz-guard="auth">Dashboard</a>
```

Features:
- History API integration (back/forward buttons work)
- Smooth crossfade animations
- Route guards (authentication, etc.)
- URL updates without reload

### 5. Script Execution

**BunzScripts** extracts and executes `<script>` tags from loaded HTML:

```javascript
// When HTX loads, scripts are extracted and executed
bunzScripts.execute(html, container);

// Inline scripts wrapped in IIFE to prevent variable conflicts
(function() {
    let currentUser = null; // Scoped to IIFE
    // ... component logic
})();
```

### 6. Lazy Loading

**BunzLoader** loads modules on demand to keep initial bundle small:

```javascript
// Only load when needed
await bunzLoader.load('modal');    // When first modal opens
await bunzLoader.load('i18n');     // When language changes
await bunzLoader.load('webrtc');   // When joining video call
await bunzLoader.load('map');      // When viewing map
```

## Architecture

### Critical Path Bundle (25KB)
Bundled into `main.js` for fast initial load:
- **Loader** - Lazy module loading system
- **Lifecycle** - Component lifecycle hooks
- **Scripts** - Script execution engine
- **Core** - HTX component loader
- **Routing** - Client-side navigation

### Lazy-Loaded Modules
Loaded on demand:
- **UI Modules**: modal, toast, cookies, a11y, navbar
- **Features**: i18n, webrtc, map, canvas, templates, components
- **Utilities**: errors, forms, state, cache, realtime

### File Structure
```
src/client/
├── htx/
│   ├── pages/           # Full pages
│   │   ├── index.htx
│   │   ├── dashboard.htx
│   │   ├── login.htx
│   │   └── room.htx
│   ├── components/      # Reusable components
│   │   ├── navbar.htx
│   │   ├── modal.htx
│   │   └── toast.htx
│   └── atoms/           # Small UI elements
├── js/
│   ├── core/           # Framework core
│   ├── modules/        # Feature modules
│   ├── ui/             # UI components
│   └── utils/          # Utilities
├── lang/               # i18n translations
├── main.html           # SPA shell
├── main.js             # Bundled framework
└── main.css            # Global styles
```

## Why Use BUNZ?

### 1. **Simplicity**
- No complex build configuration
- No transpilation needed
- No JSX/template syntax to learn
- Just HTML, CSS, and JavaScript

### 2. **Performance**
- Small runtime (~25KB)
- Efficient caching
- Lazy loading of features
- Server-side rendering
- Minimal JavaScript execution

### 3. **Developer Experience**
- Instant feedback (just refresh)
- Easy debugging (view source works)
- Self-contained components
- Familiar web standards

### 4. **Production Ready**
- SSR for SEO and performance
- Compression (gzip/brotli)
- Efficient caching strategies
- Security headers (CSP, HSTS)
- Progressive enhancement

### 5. **Modern Features**
- Client-side routing with animations
- Internationalization (i18n)
- Authentication guards
- WebRTC integration
- Real-time with WebSockets
- Interactive maps (MapLibre)

## Key Features

### Server-Side Rendering (SSR)
```typescript
// Server pre-renders HTX into HTML
GET /dashboard
  → Server reads dashboard.htx
  → Injects into main.html
  → Sends complete HTML with data-prerendered="true"
  → Client detects SSR, skips loading
  → Instant page display (no flash)
```

### Progressive Enhancement
```html
<!-- Works without JavaScript -->
<a href="/dashboard">Dashboard</a>

<!-- Enhanced with JavaScript -->
<!-- Same link, but BUNZ intercepts and loads via AJAX -->
```

### Component Lifecycle
```javascript
// Before content swaps
document.addEventListener('bunz:beforeSwap', cleanup);

// After content loads
document.addEventListener('bunz:loaded', initialize);

// On navigation
document.addEventListener('bunz:afterSwap', refresh);
```

### Form Handling
```html
<!-- Traditional form -->
<form id="login-form" method="POST" action="#">
    <input name="email" required>
    <button type="submit">Login</button>
</form>

<script>
// JavaScript intercepts and handles via fetch
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    await fetch('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(data)) });
});
</script>
```

## Technical Implementation

### 1. Component Loading Flow
```
User clicks link
  ↓
Router intercepts
  ↓
Check route guards (auth, etc.)
  ↓
Trigger lifecycle: beforeSwap
  ↓
Fade out current content
  ↓
Fetch HTX component (with caching)
  ↓
Swap innerHTML
  ↓
Execute embedded <script> tags
  ↓
Execute embedded <style> tags (scoped)
  ↓
Fade in new content
  ↓
Trigger lifecycle: afterSwap
  ↓
Update browser URL
  ↓
Page ready!
```

### 2. Script Execution
Since `innerHTML` doesn't execute scripts, BUNZ extracts and re-executes them:

```javascript
class BunzScripts {
    async execute(html, container) {
        // Parse HTML to find <script> tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const scripts = tempDiv.querySelectorAll('script');
        
        // Execute each script
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            
            if (oldScript.src) {
                // External script
                newScript.src = oldScript.src;
                document.head.appendChild(newScript);
            } else {
                // Inline script - wrap in IIFE to prevent variable conflicts
                newScript.textContent = `(function() {\n${oldScript.textContent}\n})();`;
                container.appendChild(newScript);
            }
        }
    }
}
```

### 3. Caching Strategy

**Multi-layer caching:**
- Browser HTTP cache (static assets, 1 year)
- Framework cache (HTX components in memory)
- Service worker potential (future)

```javascript
class BunzCore {
    cache = new Map();
    
    async fetch(path) {
        // Check memory cache first
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        
        // Fetch from server (browser HTTP cache)
        const res = await fetch(path);
        const html = await res.text();
        
        // Store in memory cache
        this.cache.set(path, html);
        return html;
    }
}
```

### 4. Security

**Content Security Policy (CSP):**
```
script-src 'self' 'unsafe-inline' https://unpkg.com
style-src 'self' 'unsafe-inline' https://unpkg.com
img-src 'self' data: https:
connect-src 'self' ws: wss: https:
worker-src 'self' blob:
form-action 'self'
```

**Other Headers:**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (production)
- Referrer-Policy: strict-origin-when-cross-origin

## Comparison to Other Frameworks

| Feature | BUNZ | React | HTMX | Traditional MPA |
|---------|------|-------|------|-----------------|
| **Build Step** | Optional | Required | No | No |
| **Runtime Size** | 25KB | 42KB+ | 14KB | 0KB |
| **SSR** | Built-in | Complex | N/A | Native |
| **Client Routing** | Yes | Yes | Limited | No |
| **Components** | HTML files | JSX | HTML attrs | Templates |
| **State Management** | Optional | Complex | Server | Server |
| **Learning Curve** | Low | High | Low | Low |
| **SEO** | Excellent | Requires SSR | Excellent | Excellent |
| **Progressive Enhancement** | Yes | No | Yes | Yes |

## Use Cases

### Perfect For:
- ✅ Content-heavy websites
- ✅ Dashboard applications
- ✅ Multi-page applications
- ✅ SEO-critical sites
- ✅ Progressive web apps
- ✅ Real-time applications
- ✅ Video conferencing platforms

### Not Ideal For:
- ❌ Highly interactive SPAs with complex state (use React)
- ❌ Mobile apps (use React Native)
- ❌ Desktop apps (use Electron with React/Vue)

## Example: Building a Page

### 1. Create HTX Component
```html
<!-- /htx/pages/profile.htx -->
<div class="profile-page">
    <h1>User Profile</h1>
    <div id="profile-data"></div>
</div>

<script>
// Load profile data
fetch('/api/me', { credentials: 'include' })
    .then(r => r.json())
    .then(user => {
        document.getElementById('profile-data').innerHTML = `
            <p>Name: ${user.name}</p>
            <p>Email: ${user.email}</p>
        `;
    });
</script>
```

### 2. Add Route
```html
<!-- In navbar or any component -->
<a href="/htx/pages/profile.htx#app">Profile</a>
```

### 3. Add Route Guard (Optional)
```html
<a href="/htx/pages/profile.htx#app" bz-guard="auth">Profile</a>
```

That's it! No routing config, no build step, no complex setup.

## Advanced Features

### Internationalization (i18n)
```html
<h1 data-i18n="profile.title">User Profile</h1>
<p data-i18n="profile.welcome">Welcome back!</p>
```

```json
// lang/en.json
{
  "profile": {
    "title": "User Profile",
    "welcome": "Welcome back!"
  }
}
```

### Route Guards
```javascript
const guards = {
    auth: async () => {
        const res = await fetch('/api/me');
        if (!res.ok) {
            await openModal('/htx/pages/login.htx');
            return false;
        }
        return true;
    }
};
```

### Lifecycle Hooks
```javascript
// Cleanup before navigation
bunzLifecycle.onCleanup('#app', () => {
    console.log('Cleaning up...');
    // Clear intervals, remove listeners, etc.
});

// Before content swap
document.addEventListener('bunz:beforeSwap', (e) => {
    console.log('About to swap:', e.detail);
});

// After content loads
document.addEventListener('bunz:loaded', (e) => {
    console.log('Content loaded:', e.detail);
});
```

### Modal System
```javascript
// Open modal with HTX component
await openModal('/htx/pages/login.htx');

// Close modal
closeModal();

// Modal automatically lazy-loads on first use
```

### State Preservation
```html
<!-- Preserve form state during navigation -->
<div bz-preserve="search-form">
    <input id="search" type="text">
</div>

<!-- State is preserved when navigating away and restored when coming back -->
```

## Performance Optimizations

### 1. **Critical Path Bundling**
Only essential code in main bundle:
- Framework core: 25KB
- Everything else: lazy-loaded on demand

### 2. **Aggressive Caching**
- HTTP caching with Expires headers
- In-memory component cache
- Browser cache for static assets

### 3. **Compression**
- Brotli (best compression)
- Gzip (broad compatibility)
- Deflate (fallback)
- Automatic based on Accept-Encoding

### 4. **SSR (Server-Side Rendering)**
- Pre-renders HTX into HTML on server
- Client detects `data-prerendered="true"` attribute
- Skips loading animation for instant display
- Scripts still execute for interactivity

### 5. **Code Splitting**
```javascript
// Features load only when needed
- WebRTC: loads on /room pages
- Map: loads on /map pages  
- Canvas: loads when drawing enabled
- i18n: loads when changing language
```

## Real-World Example: Video Conferencing App

### Features Implemented:
1. **Authentication** - Custom auth with bcrypt
2. **Organizations** - Multi-tenant support
3. **Teams & Projects** - Organizational structure
4. **Video Conferencing** - WebRTC peer-to-peer
5. **Interactive Maps** - MapLibre integration
6. **Real-time Chat** - WebSocket messaging
7. **Internationalization** - 5 languages (EN, NO, ES, DE, FR)
8. **Cookie Consent** - GDPR-compliant

### Bundle Size Analysis:
```
Critical Path (main.js): 25.1 KB
├── Loader: 4.6 KB
├── Lifecycle: 2.7 KB
├── Scripts: 3.2 KB
├── Core: 2.1 KB
└── Routing: 11.9 KB

Lazy Modules (loaded on demand):
├── Modal: 4.3 KB
├── Toast: 7.9 KB
├── Cookies: 12.5 KB
├── i18n: 3.1 KB
├── WebRTC: 12.6 KB
├── Map: 7.0 KB
├── Canvas: 13.0 KB
└── Others: ~15 KB

Total if all loaded: ~110 KB
Typical page load: ~40-50 KB
```

## Best Practices

### 1. **Keep HTX Files Self-Contained**
```html
<!-- Good: Everything in one file -->
<div class="my-component">...</div>
<style>.my-component {...}</style>
<script>// Component logic</script>

<!-- Avoid: Spreading across multiple files -->
```

### 2. **Use IIFE for Scripts**
Scripts are auto-wrapped in IIFE to prevent variable conflicts:
```javascript
// Automatically becomes:
(function() {
    let myVar = 'safe'; // Won't conflict with other pages
})();
```

### 3. **Leverage SSR**
All routes are automatically SSR'd:
- Instant page loads
- SEO-friendly
- No loading flashes

### 4. **Use Route Guards**
```html
<a href="/dashboard.htx#app" bz-guard="auth">Dashboard</a>
```

### 5. **Follow Progressive Enhancement**
```html
<!-- Works without JavaScript -->
<form action="/api/login" method="POST">
    <button type="submit">Login</button>
</form>

<!-- Enhanced with JavaScript -->
<script>
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // AJAX submission with better UX
});
</script>
```

## Developer Workflow

### Development:
```bash
bun run dev
# Server starts with auto-reload
# Edit .htx files → refresh browser → see changes
# No build step, no waiting
```

### Production:
```bash
bun run bundle    # Bundle critical path
bun run minify    # Minify all JS
bun run start     # Production server
```

## Technical Stack

**Server:**
- Bun.js (runtime)
- Native TypeScript support
- WebSocket for real-time
- SQLite database

**Client:**
- BUNZ framework (25KB)
- MapLibre GL (maps)
- WebRTC (video)
- Vanilla JavaScript (no dependencies)

**Development:**
- No build tools required
- Optional bundling for production
- Playwright for testing
- Lighthouse for performance

## Philosophy

### HTML-First Architecture
HTML is the source of truth, not JavaScript. Components are HTML files that load when needed, not JavaScript functions that generate HTML.

### Progressive Enhancement
Start with working HTML, enhance with JavaScript. The site works without JS, but better with it.

### Minimal Abstractions
Use web standards directly:
- fetch() for AJAX
- History API for routing
- Custom Events for communication
- Web Components compatible

### Developer Happiness
Fast refresh cycles, easy debugging, familiar syntax, no magic.

## Conclusion

**BUNZ is HTML-first, JavaScript-enhanced, and server-rendered by default.**

It combines the best of:
- **Traditional MPAs** - SEO, progressive enhancement, simplicity
- **Modern SPAs** - Client-side routing, smooth transitions, dynamic loading
- **Component frameworks** - Modularity, reusability, organization

Without the complexity of:
- Build tooling
- Complex state management
- JSX/template syntax
- Large runtime bundles

**Perfect for developers who want modern features without modern complexity.**

---

**BUNZ: HTML that loads when you need it, where you need it.** 🚀

