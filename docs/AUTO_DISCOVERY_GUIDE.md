# HTX Auto-Discovery: Before & After

## The Problem
Manually maintaining route definitions and file lists was tedious and error-prone:

```javascript
// ❌ BEFORE: Manual everything
const htxFiles = [
    'index.htx',
    'login.htx', 
    'dashboard.htx',
    'room.htx',
    'meeting.htx'
];

router
    .route('/', 'index.htx')
    .route('/app', 'index.htx')
    .route('/login', 'login.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dashboard.htx', { guards: [requireAuth] })
    .route('/room/:roomId', 'room.htx')
    .route('/meeting/:meetingId', 'meeting.htx', { guards: [requireAuth] })
    .route('/org/:orgId', 'organization.htx', { guards: [requireAuth] });

htx.preload([
    'index.htx',
    'login-modal.htx',
    'dashboard.htx'
]);
```

**Problems:**
- ❌ Duplicate route paths (in `.htx` files and `app.js`)
- ❌ Manual file list maintenance
- ❌ Easy to forget updating both places
- ❌ Route config separated from component
- ❌ Boilerplate for every new route

---

## The Solution
**Auto-Magic Discovery** with declarative metadata:

### 1️⃣ **Add Metadata to HTX Files**

```html
<!-- public/htx/dashboard.htx -->
<!--
@route: /dashboard
@guards: requireAuth
@title: Dashboard - Video Conferencing
-->
<div class="container">
    <h1>Dashboard</h1>
    <p>Your content here</p>
</div>
```

### 2️⃣ **Auto-Registration (Zero Config)**

```javascript
// ✅ AFTER: Automatic everything
await autoRegisterRoutes();  // That's it!

// Auto-discovered and preloaded
const htxFiles = await discoverHTXFiles();
htx.preload(['login-modal.htx', ...htxFiles.slice(0, 3)]);
```

**Console Output:**
```
🔍 Discovered 5 HTX files: ["index.htx", "login.htx", "dashboard.htx", ...]
✅ Auto-registered: / -> index.htx
✅ Auto-registered: /login -> login.htx [guestOnly]
✅ Auto-registered: /dashboard -> dashboard.htx [requireAuth]
✅ Auto-registered: /room/:roomId -> room.htx
✅ Auto-registered: /meeting/:meetingId -> meeting.htx [requireAuth]
ℹ️  Skipped login-modal.htx: No @route metadata
🚀 Preloading components: ["login-modal.htx", "index.htx", "login.htx"]
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     APP STARTS                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   1. Client: fetch('/api/htx-files')                        │
│   2. Server: Scans /htx/ directory                          │
│   3. Server: Returns ["index.htx", "login.htx", ...]        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   For each .htx file:                                       │
│   1. Fetch file from server                                 │
│   2. Parse metadata from <!-- @route: ... --> comments      │
│   3. Map guards from registry                               │
│   4. Register route with HTX router                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               ROUTES READY TO USE                           │
│   User navigates to /dashboard → HTX renders content        │
│   - Metadata stripped before rendering to DOM               │
│   - Document title updated from @title                      │
│   - Guards executed automatically                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow Comparison

### ❌ **Before: Manual (5 Steps)**
1. Create `dashboard.htx` file
2. Open `app.js`
3. Add `'dashboard.htx'` to `htxFiles` array
4. Add `.route('/dashboard', 'dashboard.htx', { guards: [...] })`
5. Test and hope you didn't typo anything

### ✅ **After: Auto-Magic (1 Step)**
1. Create `dashboard.htx` with metadata → **DONE!**

---

## Real-World Example

### Adding a New "Settings" Page

**Old Way:**
```javascript
// 1. Create public/htx/settings.htx
<div class="container">
    <h1>Settings</h1>
</div>

// 2. Edit app.js - Add to file list
const htxFiles = [
    'index.htx',
    'login.htx', 
    'dashboard.htx',
    'room.htx',
    'meeting.htx',
    'settings.htx'  // ← Add here
];

// 3. Edit app.js - Add route
router
    .route('/', 'index.htx')
    .route('/login', 'login.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dashboard.htx', { guards: [requireAuth] })
    .route('/room/:roomId', 'room.htx')
    .route('/meeting/:meetingId', 'meeting.htx', { guards: [requireAuth] })
    .route('/settings', 'settings.htx', { guards: [requireAuth] });  // ← Add here
```

**New Way:**
```html
<!-- public/htx/settings.htx -->
<!--
@route: /settings
@guards: requireAuth
@title: Settings - Video Conferencing
-->
<div class="container">
    <h1>Settings</h1>
</div>
```

**That's it!** The route is automatically discovered and registered. 🎉

---

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **File list** | Manual array | Auto-discovered |
| **Route definition** | Manual `.route()` calls | Metadata in `.htx` |
| **Guards** | Separate config | Inline metadata |
| **Title** | Manual or hardcoded | Auto-set from `@title` |
| **Adding new route** | 3+ code changes | 1 file creation |
| **Deleting route** | 3+ code changes | 1 file deletion |
| **Source of truth** | Split across files | Single `.htx` file |
| **Typo risk** | High (multiple places) | Low (one place) |
| **Maintenance** | 😫 Tedious | 😊 Effortless |

---

## Technical Architecture

### **Server Side (`server.ts`)**
```typescript
// Public API endpoint for HTX file discovery
if (url.pathname === "/api/htx-files") {
    const fs = await import("fs/promises");
    const files = await fs.readdir("./public/htx");
    return Response.json(files.filter(f => f.endsWith('.htx')));
}
```

### **Client Side (`app.js`)**
```javascript
// Auto-discover HTX files
async function discoverHTXFiles() {
    const response = await fetch('/api/htx-files');
    const files = await response.json();
    return files.filter(file => !file.includes('modal'));
}

// Auto-register routes with metadata
async function autoRegisterRoutes() {
    const htxFiles = await discoverHTXFiles();
    for (const file of htxFiles) {
        const html = await fetch(`/htx/${file}`).then(r => r.text());
        const metadata = parseHTXMetadata(html);
        if (metadata.route) {
            router.route(metadata.route, file, { 
                guards: mapGuards(metadata.guards) 
            });
        }
    }
}
```

### **HTX Core (`htx.js`)**
```javascript
async fetch(componentPath, options) {
    let html = await fetch(`/htx/${componentPath}`).then(r => r.text());
    
    // Parse and handle metadata
    const metadata = this.parseMetadata(html);
    if (metadata.title) document.title = metadata.title;
    
    // Strip metadata before rendering
    html = this.stripMetadata(html);
    
    return html;
}
```

---

## Metadata Reference

### **All Supported Fields**

| Field | Required | Type | Example |
|-------|----------|------|---------|
| `@route` | ✅ Yes | String | `@route: /dashboard` |
| `@guards` | ❌ No | Comma-separated | `@guards: requireAuth, adminOnly` |
| `@title` | ❌ No | String | `@title: Dashboard - App Name` |

### **Dynamic Routes**
```html
<!-- Single parameter -->
@route: /user/:userId

<!-- Multiple parameters -->
@route: /org/:orgId/team/:teamId

<!-- Optional parameters (not yet supported) -->
@route: /blog/:slug?
```

### **Multiple Guards**
```html
<!-- All guards must pass -->
@guards: requireAuth, emailVerified, planActive
```

### **Guard Registry**
```javascript
const guardRegistry = {
    'requireAuth': requireAuth,
    'requireAuthModal': requireAuthModal,
    'guestOnly': guestOnly
};
```

Add custom guards:
```javascript
guardRegistry['adminOnly'] = async () => {
    const user = await fetch('/api/me').then(r => r.json());
    return user.role === 'admin' || '/unauthorized';
};
```

---

## FAQ

### **Q: Do users see the metadata?**
**A:** No! Metadata is stripped before rendering to the DOM. Users only see clean HTML.

### **Q: What about modal components?**
**A:** Modals don't have `@route` metadata, so they're skipped during auto-registration. They're loaded on-demand via `openModal()`.

### **Q: Can I still manually register routes?**
**A:** Yes! Auto-registration runs first, then you can add manual routes:
```javascript
await autoRegisterRoutes();
router.route('/custom', 'custom.htx', { guards: [myGuard] });
```

### **Q: What if the server is down during init?**
**A:** The system falls back to common file patterns:
```javascript
['index.htx', 'login.htx', 'dashboard.htx', 'room.htx', 'meeting.htx']
```

### **Q: How do I debug routing issues?**
**A:** Check browser console for auto-registration logs:
```
🔍 Discovered X HTX files
✅ Auto-registered: /path -> file.htx [guards]
ℹ️  Skipped file.htx: No @route metadata
⚠️  Could not auto-register file.htx: Error
```

---

## Migration Checklist

- [ ] Add metadata to all `.htx` files
- [ ] Remove manual `htxFiles` array from `app.js`
- [ ] Remove manual `.route()` calls from `app.js`
- [ ] Test all routes (direct URL, navigation, refresh)
- [ ] Verify guards work correctly
- [ ] Check browser console for auto-registration logs
- [ ] Update any documentation referencing old routing system

---

**Result:** A truly automatic, declarative, maintainable routing system! 🚀

