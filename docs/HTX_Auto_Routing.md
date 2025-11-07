# HTX Auto-Routing System

## Overview

HTX now supports **declarative routing** through metadata embedded in `.htx` files. Routes, guards, and page titles are defined directly in the component files using HTML comments.

## Metadata Format

Add metadata at the **top** of any `.htx` file using this format:

```html
<!--
@route: /path/to/route
@guards: guardName1, guardName2
@title: Page Title for Browser Tab
-->
<!-- Component content starts here -->
<div class="container">
  ...
</div>
```

### Supported Metadata Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `@route` | ✅ Yes | URL path for this component | `@route: /dashboard` |
| `@guards` | ❌ No | Comma-separated list of guard functions | `@guards: requireAuth` |
| `@title` | ❌ No | Browser tab title (SEO, bookmarks, history) | `@title: Dashboard - App Name` |

### Dynamic Route Parameters

Use `:paramName` syntax for dynamic segments:

```html
<!--
@route: /room/:roomId
@title: Video Room - App Name
-->
```

```html
<!--
@route: /user/:userId/profile
@guards: requireAuth
@title: User Profile - App Name
-->
```

## Available Guards

### Built-in Guards

| Guard | Description | On Auth Fail | On Auth Success |
|-------|-------------|--------------|-----------------|
| `requireAuth` | Must be authenticated | Redirect to `/login` | Allow access |
| `requireAuthModal` | Must be authenticated | Show login modal | Allow access |
| `guestOnly` | Must NOT be authenticated | Allow access | Redirect to `/dashboard` |

### Custom Guards

Add custom guards to the `guardRegistry` in `app.js`:

```javascript
// Define custom guard
const adminOnly = async () => {
    const user = await fetch('/api/me').then(r => r.json());
    return user.role === 'admin' || '/unauthorized';
};

// Register in guardRegistry
const guardRegistry = {
    'requireAuth': requireAuth,
    'requireAuthModal': requireAuthModal,
    'guestOnly': guestOnly,
    'adminOnly': adminOnly  // Add custom guard
};
```

Then use in HTX files:

```html
<!--
@route: /admin
@guards: adminOnly
@title: Admin Panel
-->
```

## How It Works

### 1. **Auto-Discovery**

The system automatically scans the `/htx/` directory via a server API:

```javascript
// app.js automatically discovers all HTX files
async function discoverHTXFiles() {
    const response = await fetch('/api/htx-files');
    const files = await response.json();
    // Returns: ["index.htx", "login.htx", "dashboard.htx", ...]
    return files.filter(file => file.endsWith('.htx') && !file.includes('modal'));
}
```

**No manual file lists needed!** Just add a `.htx` file to `/htx/` and it's automatically discovered.

### 2. **Metadata Parsing**

On app initialization, each discovered HTX file is fetched and parsed:

```javascript
async function autoRegisterRoutes() {
    for (const file of htxFiles) {
        const response = await fetch(`/htx/${file}`);
        const html = await response.text();
        
        // Extract metadata from <!-- @key: value --> comments
        const metadata = parseHTXMetadata(html);
        
        // Register route with guards
        router.route(metadata.route, file, { guards: [...] });
    }
}
```

### 3. **Metadata Stripping**

Before rendering to the DOM, metadata comments are removed:

```javascript
// htx.js - fetch() method
let html = await response.text();

// Parse metadata
const metadata = this.parseMetadata(html);

// Update document title
if (metadata.title) {
    document.title = metadata.title;
}

// Strip metadata from HTML
html = this.stripMetadata(html);  // Removes <!-- @... --> comments
```

### 4. **Route Registration**

Routes are automatically registered with the HTX router:

```
✅ Auto-registered: / -> index.htx
✅ Auto-registered: /login -> login.htx [guestOnly]
✅ Auto-registered: /dashboard -> dashboard.htx [requireAuth]
✅ Auto-registered: /room/:roomId -> room.htx
✅ Auto-registered: /meeting/:meetingId -> meeting.htx [requireAuth]
```

## Examples

### Public Home Page

```html
<!--
@route: /
@title: Home - Video Conferencing
-->
<div class="container">
    <h1>Welcome!</h1>
</div>
```

### Protected Dashboard

```html
<!--
@route: /dashboard
@guards: requireAuth
@title: Dashboard - Video Conferencing
-->
<div class="container">
    <h1>Dashboard</h1>
</div>
```

### Guest-Only Login

```html
<!--
@route: /login
@guards: guestOnly
@title: Login - Video Conferencing
-->
<div class="auth-container">
    <form>...</form>
</div>
```

### Dynamic Route with Auth

```html
<!--
@route: /meeting/:meetingId
@guards: requireAuth
@title: Meeting Room - Video Conferencing
-->
<div class="container">
    <h1>Meeting Room</h1>
</div>
```

### Multiple Guards

```html
<!--
@route: /admin/users
@guards: requireAuth, adminOnly
@title: User Management - Admin Panel
-->
<div class="container">
    <h1>Manage Users</h1>
</div>
```

## Benefits

### ✅ **Zero Configuration**
Add a `.htx` file to `/htx/` with metadata, and it's **automatically discovered and routed**. No manual registration needed!

### ✅ **Single Source of Truth**
Route configuration lives **with** the component, not in a separate router file.

### ✅ **Less Boilerplate**
No need to maintain file lists or manually define routes:

**Before (Manual):**
```javascript
const htxFiles = ['index.htx', 'login.htx', 'dashboard.htx', ...];

router
    .route('/', 'index.htx')
    .route('/login', 'login.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dashboard.htx', { guards: [requireAuth] })
    ...
```

**After (Auto-Magic):**
```javascript
await autoRegisterRoutes();  // Done! All routes auto-discovered from .htx metadata
```

### ✅ **Better Organization**
Component metadata travels with the component. Add a `.htx` file, and it's auto-discovered. Delete a `.htx` file, and its route is automatically removed.

### ✅ **SEO & UX**
Document titles update automatically based on the `@title` metadata, improving browser history, bookmarks, and SEO.

## Migration from Manual Routes

1. **Add metadata** to your `.htx` files
2. **Remove manual** `.route()` calls and file lists

That's it! The auto-discovery system handles everything else.

## Debugging

Enable console logging to see auto-discovery and route registration:

```
🔍 Discovered 5 HTX files: ["index.htx", "login.htx", "dashboard.htx", "room.htx", "meeting.htx"]
✅ Auto-registered: / -> index.htx
✅ Auto-registered: /login -> login.htx [guestOnly]
✅ Auto-registered: /dashboard -> dashboard.htx [requireAuth]
✅ Auto-registered: /room/:roomId -> room.htx
✅ Auto-registered: /meeting/:meetingId -> meeting.htx [requireAuth]
ℹ️  Skipped login-modal.htx: No @route metadata
```

If a route fails to register:

```
⚠️  Could not auto-register dashboard.htx: HTTP 404: Not Found
```

Check:
- Is the file in `/htx/` directory?
- Does the metadata have `@route:` defined?
- Is the server running?

## Convention Over Configuration

The system follows naming conventions:

| Route | HTX File | JavaScript File |
|-------|----------|-----------------|
| `/` | `index.htx` | `index.js` |
| `/login` | `login.htx` | `login.js` |
| `/dashboard` | `dashboard.htx` | `dashboard.js` |
| `/room/:roomId` | `room.htx` | `room.js` |

Scripts are **automatically loaded** based on the HTX filename.

## Future Enhancements

Potential improvements:

- ✅ ~~Auto-discovery~~: **IMPLEMENTED** - Scans `/htx/` directory automatically
- **Nested routes**: Support `@parent: /app` for route composition
- **Preloading**: `@preload: true` to cache component on app load
- **Lazy loading**: `@lazy: true` to defer loading until route is accessed
- **Middleware**: `@middleware: logPageView, trackAnalytics`
- **Meta tags**: `@description`, `@keywords` for SEO
- **Watch mode**: Hot reload routes when HTX files are added/removed

---

**HTX Auto-Routing** - Declarative, intuitive, maintainable routing for HTX components.

