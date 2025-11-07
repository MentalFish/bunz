# HTXZ - HTML Extension with Authentication

**HTXZ** is a minimalist HTML microframework that combines the simplicity of HTMZ with built-in authentication guards. It maintains the declarative, HTML-first approach while adding security awareness.

## Philosophy

HTMZ principle: **HTML over the wire, minimal JavaScript, maximum simplicity**

HTXZ adds: **Authentication guards without sacrificing simplicity**

## Installation

```html
<!-- Add the HTXZ iframe -->
<iframe hidden name="htxz" onload="setTimeout(()=>document.querySelector(contentWindow.location.hash||null)?.replaceWith(...contentDocument.body.childNodes))"></iframe>

<!-- Load the HTXZ script -->
<script src="/js/htxz.js"></script>
```

## Basic Usage

### Simple Link (No Auth)

```html
<a href="/htx/about.htx#content" target="htxz">About</a>
```

### Protected Link (With Guard)

```html
<a href="/htx/dashboard.htx#app" target="htxz" data-guard="requireAuth">Dashboard</a>
```

### Programmatic Loading

```javascript
// Load without guard
await htxz.load('/htx/home.htx#app');

// Load with guard
await htxz.load('/htx/dashboard.htx#app', 'requireAuth');
```

## Built-in Guards

### `requireAuth`
**Behavior:** User must be authenticated to access the resource.
- ✅ **Authenticated:** Loads content
- ❌ **Not authenticated:** Redirects to `/login`

**Usage:**
```html
<a href="/htx/dashboard.htx#app" target="htxz" data-guard="requireAuth">Dashboard</a>
```

### `requireAuthModal`
**Behavior:** User must be authenticated to access the resource.
- ✅ **Authenticated:** Loads content
- ❌ **Not authenticated:** Shows login modal

**Usage:**
```html
<a href="/htx/settings.htx#app" target="htxz" data-guard="requireAuthModal">Settings</a>
```

### `guestOnly`
**Behavior:** Only non-authenticated users can access.
- ✅ **Not authenticated:** Loads content
- ❌ **Authenticated:** Redirects to `/dashboard`

**Usage:**
```html
<a href="/htx/login.htx#app" target="htxz" data-guard="guestOnly">Login</a>
```

## Custom Guards

Register custom guards for your application:

```javascript
// Register a custom guard
htxz.guard('adminOnly', async () => {
    const response = await fetch('/api/me', { credentials: 'include' });
    const user = await response.json();
    
    if (user.role === 'admin') {
        return true; // Allow access
    }
    
    // Deny access
    window.navigateTo('/unauthorized');
    return false;
});

// Use it in HTML
<a href="/htx/admin-panel.htx#app" target="htxz" data-guard="adminOnly">Admin</a>
```

### Complex Guard Example

```javascript
htxz.guard('planActive', async () => {
    const response = await fetch('/api/subscription', { credentials: 'include' });
    const subscription = await response.json();
    
    if (subscription.status === 'active') {
        return true;
    }
    
    // Show upgrade modal
    if (window.openModal) {
        await window.openModal('upgrade-modal.htx');
    }
    return false;
});
```

## Form Submissions

### Protected Form

```html
<form action="/api/create-org" method="POST" target="htxz" data-guard="requireAuth">
    <input type="text" name="name" placeholder="Organization Name">
    <button type="submit">Create</button>
</form>
```

### Response Handling

Server returns HTML that replaces the target:

```html
<!-- Server response -->
<div id="org-list">
    <h3>Your Organizations</h3>
    <ul>
        <li>Acme Corp</li>
        <li>New Org</li>
    </ul>
</div>
```

Client-side targeting:
```html
<form action="/api/create-org" method="POST" target="htxz" data-guard="requireAuth">
    <input type="text" name="name">
    <button type="submit">Create</button>
</form>

<!-- This element gets replaced with server response -->
<div id="org-list">
    <h3>Your Organizations</h3>
    <ul>
        <li>Acme Corp</li>
    </ul>
</div>
```

## URL Format

HTXZ uses the same URL format as HTMZ:

```
/htx/component.htx#targetElementId
```

- **Path:** `/htx/component.htx` - The HTX component to load
- **Hash:** `#targetElementId` - The element to replace with the loaded content

### Examples

```html
<!-- Replace entire app container -->
<a href="/htx/dashboard.htx#app" target="htxz">Dashboard</a>

<!-- Update just a section -->
<a href="/htx/profile-card.htx#profile-section" target="htxz">Refresh Profile</a>

<!-- Replace content div -->
<a href="/htx/about.htx#content" target="htxz">About</a>
```

## Progressive Enhancement

HTXZ follows progressive enhancement principles:

### Without JavaScript
```html
<!-- Falls back to regular link -->
<a href="/dashboard" target="_self">Dashboard</a>
```

### With JavaScript
```html
<!-- Enhanced with HTXZ -->
<a href="/htx/dashboard.htx#app" target="htxz" data-guard="requireAuth">Dashboard</a>
```

## Comparison: HTXZ vs HTX Router

### Use HTXZ When:
- ✅ Simple content updates
- ✅ Partial page refreshes
- ✅ Form submissions with HTML responses
- ✅ Declarative, HTML-first approach preferred
- ✅ Progressive enhancement needed

### Use HTX Router When:
- ✅ Full page routing with URL changes
- ✅ Complex route parameters (`:userId`, `:roomId`)
- ✅ Lifecycle hooks (beforeLoad, afterMount)
- ✅ Browser history management
- ✅ Cache control and preloading

## Real-World Examples

### Dashboard Quick Actions

```html
<div class="dashboard">
    <h1>Dashboard</h1>
    
    <!-- Quick action buttons with guards -->
    <div class="actions">
        <a href="/htx/create-org.htx#modal-container" 
           target="htxz" 
           data-guard="requireAuth" 
           class="btn-primary">
            + New Organization
        </a>
        
        <a href="/htx/create-project.htx#modal-container" 
           target="htxz" 
           data-guard="requireAuth" 
           class="btn-secondary">
            + New Project
        </a>
    </div>
    
    <!-- Content area that gets updated -->
    <div id="modal-container"></div>
</div>
```

### Settings Panel

```html
<div class="settings">
    <nav class="settings-nav">
        <!-- Settings sections load into main area -->
        <a href="/htx/settings/profile.htx#settings-content" 
           target="htxz" 
           data-guard="requireAuth">
            Profile
        </a>
        <a href="/htx/settings/security.htx#settings-content" 
           target="htxz" 
           data-guard="requireAuth">
            Security
        </a>
        <a href="/htx/settings/billing.htx#settings-content" 
           target="htxz" 
           data-guard="requireAuth">
            Billing
        </a>
    </nav>
    
    <main id="settings-content">
        <!-- Content swaps here -->
    </main>
</div>
```

### Refresh Button

```html
<section class="panel">
    <div id="stats">
        <h3>Analytics</h3>
        <p>Loading...</p>
    </div>
    
    <button onclick="htxz.load('/api/stats#stats', 'requireAuth')" 
            class="btn-secondary">
        🔄 Refresh Stats
    </button>
</section>
```

## Error Handling

HTXZ guards handle errors gracefully:

```javascript
// If API call fails, guard denies access
htxz.guard('requireAuth', async () => {
    try {
        const response = await fetch('/api/me', { credentials: 'include' });
        return response.ok;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.navigateTo('/login');
        return false;
    }
});
```

## Debugging

Enable console logging to see guard execution:

```javascript
// Guards log their decisions
htxz.load('/htx/dashboard.htx#app', 'requireAuth');
// Console: "HTXZ: Guard 'requireAuth' blocked load of /htx/dashboard.htx#app"

// Or allow access
// Console: (no log, content loads)
```

## Architecture

### The iframe Technique

HTXZ uses a hidden iframe to load content:

```html
<iframe hidden name="htxz" onload="..."></iframe>
```

**How it works:**
1. Link targets the `htxz` iframe
2. Iframe loads the URL
3. On load, content is extracted via hash selector
4. Content replaces the target element in the main document
5. Iframe remains hidden

**Benefits:**
- ✅ No fetch() API needed
- ✅ Works without JavaScript (degrades gracefully)
- ✅ Browser handles caching automatically
- ✅ Minimal code (entire implementation ~140 lines)

### Guard Execution Flow

```
User clicks link with data-guard="requireAuth"
        ↓
HTXZ intercepts click
        ↓
Execute guard function
        ↓
    ┌───┴───┐
    ↓       ↓
  Pass    Fail
    ↓       ↓
  Load   Block + Redirect/Modal
```

## Best Practices

### 1. Use Semantic HTML

```html
<!-- Good: Semantic anchor -->
<a href="/htx/about.htx#app" target="htxz">About</a>

<!-- Bad: Button pretending to be a link -->
<button onclick="htxz.load('/htx/about.htx#app')">About</button>
```

### 2. Progressive Enhancement

```html
<!-- Fallback for no-JS -->
<a href="/dashboard" 
   data-htxz="/htx/dashboard.htx#app" 
   data-guard="requireAuth">
    Dashboard
</a>
```

### 3. Target Specific Elements

```html
<!-- Update just the section that changed -->
<a href="/htx/user-card.htx#user-info" target="htxz">Refresh Profile</a>

<!-- Don't reload entire page unnecessarily -->
<a href="/htx/entire-page.htx#app" target="htxz">Update One Thing</a> <!-- ❌ -->
```

### 4. Combine with HTX Router

```html
<!-- Use HTX Router for main navigation (URL changes) -->
<a href="/dashboard">Dashboard</a>

<!-- Use HTXZ for partial updates (no URL change) -->
<a href="/htx/dashboard-stats.htx#stats" target="htxz">Refresh Stats</a>
```

## API Reference

### `htxz.load(url, guardName)`

Load an HTX resource with optional guard.

**Parameters:**
- `url` (string): URL in format `/htx/file.htx#targetId`
- `guardName` (string, optional): Name of guard to execute

**Returns:** `Promise<boolean>` - `true` if loaded, `false` if blocked

**Example:**
```javascript
await htxz.load('/htx/dashboard.htx#app', 'requireAuth');
```

### `htxz.guard(name, guardFn)`

Register a custom guard function.

**Parameters:**
- `name` (string): Guard name
- `guardFn` (Function): Async function returning `true` (allow) or `false` (block)

**Example:**
```javascript
htxz.guard('adminOnly', async () => {
    const user = await fetch('/api/me').then(r => r.json());
    return user.role === 'admin' || (window.navigateTo('/'), false);
});
```

## Troubleshooting

### Guard Not Working

**Check:**
1. Is `htxz.js` loaded before your code?
2. Is the guard registered in `window.htxzGuards`?
3. Is the guard name spelled correctly in `data-guard`?

```javascript
// Debug: Check available guards
console.log('Available guards:', Object.keys(window.htxzGuards));
```

### Content Not Loading

**Check:**
1. Is the iframe present? `document.querySelector('iframe[name="htxz"]')`
2. Is the URL correct? Check network tab
3. Does the target element exist? `document.querySelector('#targetId')`
4. Is the server returning HTML (not JSON)?

### Guard Always Blocks

**Check:**
1. Is the auth endpoint returning 200 for authenticated users?
2. Are cookies being sent? Check `credentials: 'include'`
3. Is the session valid? Test `/api/me` in browser

---

**HTXZ** - Declarative, secure, minimal HTML loading with authentication guards. 🚀

