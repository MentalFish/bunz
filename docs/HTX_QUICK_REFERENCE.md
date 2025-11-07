# HTX Quick Reference

## Component Loading

### HTML Attributes
```html
<!-- Basic loading -->
<div htx-src="component.htx"></div>

<!-- With options -->
<div htx-src="modal.htx" 
     htx-swap="innerHTML" 
     htx-cache="true"
     htx-trigger="load"></div>
```

### JavaScript API
```javascript
// Load component
await htx.load('component.htx', '#target');

// With options
await htx.load('component.htx', '#target', {
    swap: 'innerHTML',
    cache: false
});

// Helper function
await loadHTX('component.htx', '#target');
```

## Routing

### Define Routes
```javascript
router
    .route('/', 'index.htx')
    .route('/login', 'login.htx', { guards: [guestOnly] })
    .route('/dashboard', 'dash.htx', { guards: [requireAuth] })
    .route('/user/:id', 'user.htx');
```

### Navigate
```javascript
// Programmatic
router.navigate('/dashboard');

// Helper
navigateTo('/login');

// In HTML
<a href="/dashboard">Dashboard</a>
```

### Route Guards
```javascript
async function requireAuth(path, state, route) {
    const response = await fetch('/api/me');
    if (!response.ok) return '/login';
    return true;
}
```

## Lifecycle Hooks

```javascript
// Before loading
htx.on('beforeLoad', async ({ componentPath, target }) => {
    console.log(`Loading ${componentPath}`);
});

// After loading
htx.on('afterLoad', async ({ componentPath, target }) => {
    initializeScripts(target);
});

// On error
htx.on('onError', async ({ componentPath, error }) => {
    console.error(`Failed: ${error}`);
});
```

## Cache Management

```javascript
// Preload components
htx.preload(['index.htx', 'dashboard.htx']);

// Clear cache
htx.clearCache('component.htx'); // Specific
htx.clearCache(); // All
```

## Swap Modes

- `innerHTML` - Replace inner HTML (default)
- `outerHTML` - Replace entire element
- `beforebegin` - Before element
- `afterbegin` - First child
- `beforeend` - Last child
- `afterend` - After element
- `append` - Append to end
- `prepend` - Prepend to start

## Events

```javascript
// Listen for route changes
document.addEventListener('htx:route-change', (e) => {
    console.log('Route:', e.detail.path);
});

// Listen for component loaded
element.addEventListener('htx:loaded', (e) => {
    console.log('Loaded:', e.detail.componentPath);
});
```

## Integration with Fixi

```html
<!-- HTX component with Fixi controls -->
<div htx-src="user-list.htx"></div>

<!-- Inside user-list.htx -->
<button fx-action="/api/users" 
        fx-target="#users"
        fx-swap="innerHTML">
    Load Users
</button>
```

## File Structure

```
htx/
├── index.htx              # Home page
├── login-page.htx         # Auth page
├── dashboard-page.htx     # Dashboard
├── components/
│   ├── header.htx
│   ├── sidebar.htx
│   └── modal.htx
└── widgets/
    ├── stats.htx
    └── activity.htx
```

## Best Practices

1. **Keep components small** - Single responsibility
2. **Cache aggressively** - Better performance
3. **Use guards** - Protect routes
4. **Preload critical paths** - Faster navigation
5. **Lazy load** - Non-critical components
6. **Progressive enhancement** - Works without JS
7. **Semantic HTML** - Better accessibility

## Example Component

```html
<!-- htx/user-card.htx -->
<div class="card">
    <div class="card-header">
        <h3>{user.name}</h3>
    </div>
    <div class="card-body">
        <p>{user.email}</p>
        <button fx-action="/api/user/{user.id}" 
                fx-swap="outerHTML">
            View Profile
        </button>
    </div>
</div>
```

## Server Setup

```typescript
// Serve HTX files
if (url.pathname.startsWith("/htx/")) {
    const file = Bun.file(`./public/${url.pathname.substring(1)}`);
    return new Response(await file.text(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
}
```

