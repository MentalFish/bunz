# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Auto-Discovery System ✨

#### **Fully Automatic HTX Route Registration**
- **Zero Configuration**: HTX files are automatically discovered from `/htx/` directory via server API
- **No Manual File Lists**: Removed hardcoded file arrays - system scans directory dynamically
- **Declarative Metadata**: Routes, guards, and titles defined in HTX files using HTML comments
- **Auto-loading Scripts**: Component scripts automatically loaded based on filename convention

#### **HTX Metadata System**
```html
<!--
@route: /dashboard
@guards: requireAuth
@title: Dashboard - Video Conferencing
-->
```

**Supported Fields:**
- `@route`: URL path (supports dynamic segments like `:roomId`)
- `@guards`: Comma-separated list of guard functions
- `@title`: Browser tab title (SEO, bookmarks, history)

#### **Server API Endpoint**
- `GET /api/htx-files`: Returns list of all `.htx` files in `/htx/` directory
- Public endpoint (no auth required) for app initialization

#### **Enhanced HTX Core**
- Metadata parsing and stripping before DOM rendering
- Automatic document title updates based on `@title` metadata
- Metadata never exposed to end users

#### **Benefits**
1. **Add a new route**: Just create a `.htx` file with metadata - done!
2. **Delete a route**: Remove the `.htx` file - automatically unregistered
3. **Update guards**: Edit metadata in `.htx` file - no code changes
4. **Single source of truth**: Route config lives with the component

#### **Files Modified**
- `public/js/app.js`: Auto-discovery and metadata parsing
- `public/js/htx.js`: Metadata handling in fetch/render pipeline
- `server.ts`: Added `/api/htx-files` endpoint
- All `.htx` files: Added metadata headers

#### **Documentation**
- Created `docs/HTX_Auto_Routing.md`: Complete guide to auto-routing system

### Changed

#### **Route Definition System**
**Before:**
```javascript
router
    .route('/', 'index.htx')
    .route('/login', 'login.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dashboard.htx', { guards: [requireAuth] });
```

**After:**
```javascript
await autoRegisterRoutes();  // All routes auto-discovered!
```

#### **Preload System**
**Before:**
```javascript
htx.preload(['index.htx', 'login-modal.htx', 'dashboard.htx']);
```

**After:**
```javascript
const htxFiles = await discoverHTXFiles();
htx.preload(['login-modal.htx', ...htxFiles.slice(0, 3)]);
```

### Technical Details

#### **Auto-Discovery Flow**
1. App starts → Fetches `/api/htx-files`
2. Server scans `/htx/` directory → Returns file list
3. Client filters out modals → Fetches each HTX file
4. Parse metadata → Extract `@route`, `@guards`, `@title`
5. Register routes → Map guards from registry
6. Ready to navigate!

#### **Console Output**
```
🔍 Discovered 5 HTX files: ["index.htx", "login.htx", "dashboard.htx", "room.htx", "meeting.htx"]
✅ Auto-registered: / -> index.htx
✅ Auto-registered: /login -> login.htx [guestOnly]
✅ Auto-registered: /dashboard -> dashboard.htx [requireAuth]
✅ Auto-registered: /room/:roomId -> room.htx
✅ Auto-registered: /meeting/:meetingId -> meeting.htx [requireAuth]
ℹ️  Skipped login-modal.htx: No @route metadata
🚀 Preloading components: ["login-modal.htx", "index.htx", "login.htx", "dashboard.htx"]
```

#### **Fallback Mechanism**
If `/api/htx-files` fails (server down, network error), system falls back to common patterns:
```javascript
return ['index.htx', 'login.htx', 'dashboard.htx', 'room.htx', 'meeting.htx'];
```

### Migration Guide

#### **Step 1: Add Metadata to HTX Files**
```html
<!--
@route: /your-route
@guards: requireAuth
@title: Your Page Title
-->
<div class="container">
  <!-- Your content -->
</div>
```

#### **Step 2: Remove Manual Routes**
Delete manual `.route()` calls and hardcoded file lists from `app.js`.

#### **Step 3: Test**
Start server, check console for auto-registration logs, navigate to routes.

### Future Enhancements

Potential improvements:
- ✅ ~~Auto-discovery~~: **IMPLEMENTED**
- Watch mode: Hot reload routes when HTX files are added/removed
- Nested routes: `@parent: /app` for route composition
- Preloading: `@preload: true` in metadata
- Lazy loading: `@lazy: true` in metadata
- Middleware: `@middleware: logPageView, trackAnalytics`
- Meta tags: `@description`, `@keywords` for SEO

---

## Previous Changes

### SPA Refactoring
- Moved navbar to persistent shell (`app.html`)
- Converted HTX files to content-only fragments
- Server-side routing fallback for direct URL access
- Fixed scrollbar jump and content overlap issues

### CSS Refactoring
- DRY and KISS principles applied
- Reduced from 1089 lines to 584 lines
- Reusable component classes (`.panel`, `.window`, `.card`)
- Utility classes for flexbox, grid, spacing
- Universal messaging system (`.info`, `.warn`, `.error`, `.success`)

### Authentication System
- Universal `authGuard` function with options
- Route guards: `requireAuth`, `requireAuthModal`, `guestOnly`
- Fixed race conditions with cookie processing
- Session management and navbar state sync

### Script Loading
- Convention-based automatic script loading
- `/dashboard` → `/js/dashboard.js`
- No manual script mappings required

---

**Last Updated**: Auto-Discovery System Implementation

