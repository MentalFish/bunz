# BUNZ Quick Reference

## 🎯 Core Attributes

### Navigation
```html
<a href="/htx/dashboard.htx#app">Dashboard</a>
<a bz-get="/htx/profile.htx" bz-target="#app">Profile</a>
```

### Forms
```html
<form bz-post="/api/save" bz-target="#result">
  <input name="user[email]" />
  <input name="tags[]" />
</form>
```

### Guards
```html
<a href="/htx/admin.htx#app" bz-guard="auth">Admin</a>
```

### State Preservation
```html
<div bz-preserve="search-results">...</div>
<form bz-preserve>...</form>
```

---

## 🔧 JavaScript API

### Router
```javascript
// Load page
await bunz.load('/htx/dashboard.htx', '#app');

// Check guard
const passed = await bunz.guards.auth();
```

### Lifecycle
```javascript
// Register cleanup
bunzLifecycle.onCleanup('#app', () => {
  clearInterval(timer);
});

// Manual cleanup
await bunzLifecycle.cleanup('#app');
```

### State
```javascript
// Preserve before swap
bunzState.preserveElements('#app');

// Restore after swap
bunzState.restoreElements('#app');
```

### Scripts
```javascript
// Execute scripts in HTML
await bunzScripts.execute(html, '#app');
```

### Errors
```javascript
// Handle error
await bunzErrors.handle(error, url, '#app', {
  retry: true,
  fallback: '<div>Custom error</div>'
});
```

### Cache
```javascript
// Fetch with cache
const html = await bunzCache.fetch('/htx/page.htx');

// Clear cache
bunzCache.clear('/htx/page.htx');

// Invalidate pattern
bunzCache.invalidate('/htx/.*');
```

### Forms
```javascript
// Serialize form
const data = bunzForms.serialize(form);
// { user: { email: "...", name: "..." }, tags: [...] }

// Validate
const { valid, errors } = bunzForms.validate(form);

// Populate
bunzForms.populate(form, { email: '...', name: '...' });
```

### Accessibility
```javascript
// Announce to screen readers
bunzA11y.announce('Page loaded', 'polite');

// Manage focus
bunzA11y.manageFocus('#app', { focus: 'h1' });

// Restore focus
bunzA11y.restoreFocus();
```

### Real-time
```javascript
// SSE
bunzRealtime.sse('/api/updates', {
  target: '#notifications',
  reconnect: true,
  onMessage: (data) => console.log(data)
});

// WebSocket
const ws = bunzRealtime.ws('ws://localhost:3000', {
  reconnect: true,
  onMessage: (data) => console.log(data)
});

// Send
bunzRealtime.send('ws://localhost:3000', { action: 'ping' });

// Disconnect
bunzRealtime.disconnect('/api/updates');
```

### i18n
```javascript
// Translate
const text = bunzI18n.translate('nav.home');
// or
const text = window.t('nav.home');

// Change language
await bunzI18n.setLanguage('no');

// Translate page
bunzI18n.translatePage();
```

### Modal
```javascript
// Open
await bunzModal.open('login.htx');

// Close
bunzModal.close();
```

### Navbar
```javascript
// Update auth state
await bunzNavbar.updateAuthState();

// Logout
await bunzNavbar.handleLogout();
```

---

## 🎪 Events

### Lifecycle
```javascript
document.addEventListener('bunz:beforeSwap', (e) => {
  console.log('Before swap:', e.detail);
  // e.preventDefault() to cancel
});

document.addEventListener('bunz:afterSwap', (e) => {
  console.log('After swap:', e.detail);
});

document.addEventListener('bunz:cleanup', (e) => {
  console.log('Cleanup:', e.detail);
});
```

### Loading
```javascript
document.addEventListener('bz:loaded', (e) => {
  console.log('Content loaded:', e.detail);
});

document.addEventListener('bz:submitted', (e) => {
  console.log('Form submitted:', e.detail);
});
```

### Errors
```javascript
document.addEventListener('bunz:error', (e) => {
  console.log('Error:', e.detail);
  // e.preventDefault() for custom handling
});
```

### Real-time
```javascript
document.addEventListener('bunz:sse-open', (e) => {
  console.log('SSE connected:', e.detail.url);
});

document.addEventListener('bunz:sse-message', (e) => {
  console.log('SSE message:', e.detail.data);
});

document.addEventListener('bunz:ws-open', (e) => {
  console.log('WebSocket connected:', e.detail.url);
});

document.addEventListener('bunz:ws-message', (e) => {
  console.log('WebSocket message:', e.detail.data);
});
```

### i18n
```javascript
document.addEventListener('bunz:lang-changed', (e) => {
  console.log('Language changed:', e.detail.lang);
});

document.addEventListener('bunz:i18n-ready', (e) => {
  console.log('i18n ready:', e.detail.lang);
});
```

### Modal
```javascript
document.addEventListener('bunz:modal-opened', (e) => {
  console.log('Modal opened:', e.detail.componentPath);
});

document.addEventListener('bunz:modal-closed', (e) => {
  console.log('Modal closed:', e.detail.componentPath);
});
```

### Auth
```javascript
document.addEventListener('bunz:auth-success', (e) => {
  console.log('Auth success:', e.detail);
});

document.addEventListener('bunz:auth-logout', () => {
  console.log('Logged out');
});
```

---

## 📦 Module Loading

### Minimal (Core Only - 11.6 KB)
```html
<script src="/bunz/bunz-lifecycle.js"></script>
<script src="/bunz/bunz-scripts.js"></script>
<script src="/bunz/bunz-errors.js"></script>
<script src="/bunz/bunz-state.js"></script>
<script src="/bunz/bunz-cache.js"></script>
<script src="/bunz/bunz-forms.js"></script>
<script src="/bunz/bunz-a11y.js"></script>
<script src="/bunz/bunz-realtime.js"></script>
<script src="/bunz/bunz.js"></script>
```

### Full (Core + Optional - 14.5 KB)
```html
<!-- Core -->
<script src="/bunz/bunz-lifecycle.js"></script>
<script src="/bunz/bunz-scripts.js"></script>
<script src="/bunz/bunz-errors.js"></script>
<script src="/bunz/bunz-state.js"></script>
<script src="/bunz/bunz-cache.js"></script>
<script src="/bunz/bunz-forms.js"></script>
<script src="/bunz/bunz-a11y.js"></script>
<script src="/bunz/bunz-realtime.js"></script>
<script src="/bunz/bunz.js"></script>

<!-- Optional -->
<script src="/bunz/bunz-i18n.js"></script>
<script src="/bunz/bunz-modal.js"></script>
<script src="/bunz/bunz-navbar.js"></script>
```

---

## 🎨 HTX File Format

```html
<!--
@route: /dashboard
@guards: requireAuth
@title: Dashboard - My App
-->

<div class="panel">
  <h1>Dashboard</h1>
  
  <!-- Form with nested data -->
  <form bz-post="/api/save" bz-target="#result">
    <input name="user[email]" placeholder="Email" />
    <input name="user[profile][name]" placeholder="Name" />
    <input name="tags[]" value="tag1" />
    <button>Save</button>
  </form>
  
  <!-- Preserved across navigation -->
  <div bz-preserve="sidebar">
    <p>This persists!</p>
  </div>
  
  <!-- Real-time updates -->
  <div id="notifications"></div>
  
  <script>
    // Component-specific script
    bunzRealtime.sse('/api/notifications', {
      target: '#notifications'
    });
    
    // Cleanup on navigate away
    bunzLifecycle.onCleanup('#app', () => {
      bunzRealtime.disconnect('/api/notifications');
    });
  </script>
</div>
```

---

## 🚀 Quick Start

1. **Include BUNZ in your HTML:**
```html
<script src="/bunz/bunz.js"></script>
<!-- Add other modules as needed -->
```

2. **Create HTX components:**
```
/public/htx/
  index.htx
  dashboard.htx
  profile.htx
```

3. **Link between pages:**
```html
<a href="/htx/dashboard.htx#app">Dashboard</a>
```

4. **Add guards:**
```html
<a href="/htx/admin.htx#app" bz-guard="auth">Admin</a>
```

5. **That's it!** ✨

---

## 💡 Pro Tips

1. **Always clean up**: Use `bunzLifecycle.onCleanup()` for timers, listeners, connections
2. **Preserve state**: Add `bz-preserve` to forms and important elements
3. **Use guards**: Protect routes with `bz-guard="auth"`
4. **Announce changes**: Use `bunzA11y.announce()` for screen readers
5. **Cache wisely**: Clear cache after updates with `bunzCache.clear()`
6. **Validate forms**: Use `bunzForms.validate()` before submission
7. **Handle errors**: Listen to `bunz:error` for custom error handling
8. **Real-time**: Always set `reconnect: true` for SSE/WS

---

## 📚 Learn More

- [BUNZ-VS-HTMX.md](./BUNZ-VS-HTMX.md) - Feature comparison
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance tips
- [I18N.md](./I18N.md) - Internationalization guide

**BUNZ**: Build Unbloated Navigable Zones 🚀

