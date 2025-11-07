# HTX - Dynamic HTML Component System

## Overview

HTX (HTML Extension) is the **inverse of JSX** - instead of writing JavaScript that generates HTML, you write vanilla HTML components that are loaded dynamically when and where needed.

## Concept

- **JSX**: JavaScript → HTML (compile time)
- **HTX**: HTML → JavaScript (runtime)

HTX files are pure HTML fragments that can be:
- Loaded on demand
- Composed together to build SPAs
- Cached for performance
- Routed dynamically
- Integrated with existing JavaScript

## Architecture

```
┌─────────────────────────────────────┐
│         HTX SPA System              │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐    ┌──────────────┐  │
│  │ HTX Core │───►│ HTX Router   │  │
│  └──────────┘    └──────────────┘  │
│       │                   │         │
│       ▼                   ▼         │
│  ┌──────────────────────────────┐  │
│  │     .htx Components          │  │
│  │  (HTML fragments on demand)  │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

## Components

### 1. HTX Core (`htx.js`)

The component loader system with:
- **Caching**: Components are cached after first load
- **Lifecycle Hooks**: beforeLoad, afterLoad, beforeMount, afterMount, onError
- **Dynamic Loading**: Load components programmatically or via attributes
- **Auto-Processing**: Automatically processes `htx-src` attributes

#### Usage

**HTML Attributes:**
```html
<!-- Load component on page load -->
<div htx-src="modal.htx" htx-swap="innerHTML"></div>

<!-- Load with options -->
<div htx-src="auth/login.htx" 
     htx-swap="innerHTML" 
     htx-cache="true"
     htx-trigger="load"></div>
```

**Programmatic:**
```javascript
// Load a component
await htx.load('dashboard-page.htx', '#app');

// With options
await htx.load('modal.htx', '#modal-container', {
    swap: 'innerHTML',
    cache: false
});

// Using helper function
await loadHTX('authenticate.htx', '#auth-panel');
```

### 2. HTX Router (`htx-router.js`)

Client-side routing for SPAs with:
- **Route Matching**: Exact and pattern-based routes
- **Guards**: Authentication and authorization checks
- **Middleware**: Global route processing
- **History API**: Browser back/forward support
- **Link Interception**: Automatic SPA navigation

#### Usage

```javascript
// Define routes
router
    .route('/', 'index.htx')
    .route('/login', 'login-page.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dashboard-page.htx', { guards: [requireAuth] })
    .route('/room/:roomId', 'room.htx')
    .route('/org/:orgId', 'organization.htx');

// Navigate programmatically
router.navigate('/dashboard');

// Or use helper
navigateTo('/login');
```

### 3. Application Config (`app.js`)

Central configuration for:
- Route definitions
- Route guards
- Middleware
- HTX lifecycle hooks
- Script initialization

## File Structure

```
public/
├── htx/                    # HTX components
│   ├── index.htx          # Home page
│   ├── login-page.htx     # Login/signup
│   ├── dashboard-page.htx # Dashboard
│   ├── room.htx           # Video conference room
│   ├── modal.htx          # Reusable modal
│   └── authenticate.htx   # Auth forms
├── js/
│   ├── htx.js             # HTX core loader
│   ├── htx-router.js      # Router system
│   ├── app.js             # App configuration
│   └── [page-specific].js # Feature scripts
├── css/
│   └── [page-specific].css
└── app.html               # SPA entry point
```

## Creating HTX Components

### Simple Component

```html
<!-- htx/greeting.htx -->
<div class="greeting">
    <h2>Hello, World!</h2>
    <p>This is a simple HTX component</p>
</div>
```

### Component with Fixi Integration

```html
<!-- htx/user-profile.htx -->
<div class="profile">
    <div htx-src="profile/avatar.htx"></div>
    
    <button fx-action="/api/user/update" 
            fx-method="POST"
            fx-target="#profile-data"
            fx-swap="innerHTML">
        Update Profile
    </button>
    
    <div id="profile-data"></div>
</div>
```

### Composable Components

```html
<!-- htx/dashboard-page.htx -->
<div class="dashboard">
    <div htx-src="components/header.htx"></div>
    <div htx-src="components/sidebar.htx"></div>
    <main id="dashboard-content">
        <div htx-src="widgets/stats.htx"></div>
        <div htx-src="widgets/activity.htx"></div>
    </main>
</div>
```

## Features

### 1. Caching

Components are automatically cached after first load:

```javascript
// First load - fetches from server
await htx.load('modal.htx', '#container');

// Second load - uses cache
await htx.load('modal.htx', '#container');

// Disable cache for specific load
await htx.load('modal.htx', '#container', { cache: false });

// Clear cache
htx.clearCache('modal.htx'); // Clear specific
htx.clearCache(); // Clear all
```

### 2. Lifecycle Hooks

```javascript
// Before component fetches
htx.on('beforeLoad', async ({ componentPath, target }) => {
    console.log(`Loading ${componentPath}`);
    target.innerHTML = '<div class="spinner">Loading...</div>';
});

// After component loaded
htx.on('afterLoad', async ({ componentPath, target }) => {
    console.log(`Loaded ${componentPath}`);
    // Initialize component-specific JS
});

// On error
htx.on('onError', async ({ componentPath, error }) => {
    console.error(`Failed to load ${componentPath}:`, error);
    // Show user-friendly error
});
```

### 3. Route Guards

```javascript
// Authentication guard
async function requireAuth(path, state, route) {
    const response = await fetch('/api/me');
    if (!response.ok) {
        return '/login'; // Redirect to login
    }
    return true; // Allow navigation
}

// Apply to routes
router.route('/dashboard', 'dashboard-page.htx', {
    guards: [requireAuth]
});
```

### 4. Preloading

```javascript
// Preload critical components
htx.preload([
    'index.htx',
    'login-page.htx',
    'dashboard-page.htx'
]);
```

### 5. Dynamic Script Loading

```javascript
// Load scripts only when needed
function initializeComponentScripts(container) {
    if (container.querySelector('#local-video')) {
        loadScript('/js/video-conference.js');
    }
}
```

## Integration with Fixi

HTX works seamlessly with Fixi.js:

```html
<!-- HTX component with Fixi controls -->
<div class="user-list">
    <button fx-action="/htx/user-item.htx" 
            fx-target="#user-container"
            fx-swap="append">
        Load More Users
    </button>
    
    <div id="user-container"></div>
</div>
```

## Advantages Over Traditional SPAs

1. **No Build Step**: Pure HTML, no compilation
2. **Progressive Enhancement**: Works without JS (with server-side rendering)
3. **Instant Hot Reload**: Just refresh to see changes
4. **Debuggable**: View source shows actual HTML
5. **Simple**: No complex framework concepts
6. **Fast**: Minimal runtime, aggressive caching
7. **Composable**: Mix and match components easily

## Server Setup

```typescript
// Serve HTX files
if (url.pathname.startsWith("/htx/")) {
  const file = Bun.file(`./public/${url.pathname.substring(1)}`);
  if (await file.exists()) {
    return new Response(await file.text(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}
```

## Usage Example

1. **Visit `/app`** - Loads SPA shell
2. **Router initializes** - Matches current route
3. **HTX loads component** - Fetches and caches `.htx` file
4. **Component renders** - HTML inserted into DOM
5. **Scripts initialize** - Page-specific JS loads
6. **User navigates** - Router handles, loads new HTX
7. **Process repeats** - Fast, cached component loading

## Comparison

| Feature | Traditional SPA | HTX SPA |
|---------|----------------|---------|
| Components | JSX/Vue/etc | Pure HTML |
| Build | Required | None |
| Hot Reload | Complex | Simple refresh |
| Debugging | Source maps | Direct HTML |
| Learning Curve | High | Minimal |
| Runtime Size | Large (React/Vue) | Tiny (~10KB) |
| Server-Side | Complex hydration | Simple includes |

## Future Enhancements

- [ ] HTX preprocessor for variables
- [ ] Server-side HTX rendering
- [ ] HTX component library
- [ ] Dev tools browser extension
- [ ] TypeScript declarations
- [ ] Component slots/props system
- [ ] Scoped CSS per component

---

**HTX: HTML that loads when you need it, where you need it.** 🚀

