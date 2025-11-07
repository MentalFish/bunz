# HTX System - Quick Test Guide

## Testing the HTX SPA

### 1. Start the Server

```bash
cd /Users/petter/Projects/GitHub/template-modules/bun+hx
bun run dev
```

Server runs at: `http://localhost:3000`

### 2. Test Routes

Open your browser and try these URLs:

#### ✅ Home Page
- **URL**: `http://localhost:3000/app`
- **Expected**: Landing page with hero section and features
- **Component**: `index.htx`

#### ✅ Login Page
- **URL**: `http://localhost:3000/app` → Click "Login" button
- **Expected**: Login/signup forms with tab switcher
- **Component**: `login-page.htx`
- **Features**: 
  - Tab switching between login/signup
  - Form validation
  - Auth API integration

#### ✅ Dashboard (Requires Auth)
- **URL**: Navigate to `/dashboard` after login
- **Expected**: Redirects to `/login` if not authenticated
- **After Login**: Shows user dashboard with organizations
- **Component**: `dashboard-page.htx`
- **Features**:
  - User info display
  - Organization cards
  - Create organization modal
  - Logout button

#### ✅ 404 Page
- **URL**: `http://localhost:3000/app/nonexistent`
- **Expected**: 404 error page
- **Component**: `404.htx`

### 3. Test HTX Component Loading

Open browser console and check for:

```
✅ HTX initialized
✅ HTX Router initialized
✅ 🚀 HTX SPA initialized
✅ Navigating to: /app
✅ Loading component: index.htx
✅ Loaded component: index.htx
✅ HTX: Preloaded 3 components
```

### 4. Test Caching

1. Navigate to `/app`
2. Click "Login" (component loads)
3. Go back to home
4. Click "Login" again (should load from cache - instant)

Check console:
```
First load:  HTX: Fetching: /htx/login-page.htx
Second load: HTX: Loading from cache: /htx/login-page.htx
```

### 5. Test Authentication Flow

#### Sign Up
1. Navigate to `/login`
2. Click "Sign Up" tab
3. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Submit
5. Should redirect to `/dashboard`

#### Sign In
1. Navigate to `/login`
2. Fill login form:
   - Email: test@example.com
   - Password: password123
3. Submit
4. Should redirect to `/dashboard`

#### Protected Route
1. While logged out, try: `http://localhost:3000/app/dashboard`
2. Should redirect to `/login`
3. After login, should show dashboard

### 6. Test Component Composition

Dashboard page demonstrates nested HTX loading:
- Main dashboard component
- User info section
- Organization cards (dynamic)
- Modal overlay (on demand)

### 7. Test Route Guards

```javascript
// In browser console:
fetch('/api/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
// Shows current user or 401

// Navigate programmatically:
navigateTo('/dashboard')
// If not logged in → redirects to /login
```

### 8. Test Dynamic Script Loading

1. Navigate to home page
2. Open Network tab in DevTools
3. Click "Dashboard"
4. Watch for `dashboard.js` loading dynamically

### 9. Console Tests

```javascript
// Load a component manually
await htx.load('modal.htx', '#app')

// Clear cache
htx.clearCache()

// Navigate
router.navigate('/login')

// Get current route
router.getCurrentRoute()

// Preload components
htx.preload(['room.htx', 'meeting.htx'])
```

### 10. Performance Check

Open DevTools → Network tab:

**First Load** (no cache):
- `index.htx`: ~1-2ms server time
- `login-page.htx`: ~1-2ms
- `dashboard-page.htx`: ~1-2ms
- Total HTX runtime: ~10KB

**Cached Load**:
- Components: 0ms (cache hit)
- Mount time: <5ms

### Expected Console Output (Clean Load)

```
HTX initialized
HTX Router initialized
HTX: Fetching: /htx/index.htx
HTX: Fetching: /htx/login-page.htx
HTX: Fetching: /htx/dashboard-page.htx
🚀 HTX SPA initialized
HTX Router: Navigating to /app
Navigating to: /app
Loading component: index.htx
Loaded component: index.htx
HTX: Preloaded 3 components
```

## Common Issues & Solutions

### Issue: "No route found, loading 404"
**Solution**: Route not defined. Check `app.js` route definitions.

### Issue: Component not loading
**Solution**: 
1. Check file exists in `/public/htx/`
2. Check server is serving HTX files
3. Check console for fetch errors

### Issue: Redirect loop
**Solution**: Auth guard issue. Check `/api/me` endpoint.

### Issue: Scripts not initializing
**Solution**: Check `initializeComponentScripts()` in `app.js`

## Debugging Tips

### Enable Debug Mode
```javascript
// In htx.js
const htx = new HTX({
    basePath: '/htx',
    debug: true  // Already enabled
});

// In htx-router.js
const router = new HTXRouter({
    appContainer: '#app',
    debug: true  // Already enabled
});
```

### Watch Component Lifecycle
```javascript
htx.on('beforeLoad', (data) => console.log('Before:', data));
htx.on('afterLoad', (data) => console.log('After:', data));
htx.on('onError', (data) => console.error('Error:', data));
```

### Watch Route Changes
```javascript
document.addEventListener('htx:route-change', (e) => {
    console.log('Route changed:', e.detail);
});

document.addEventListener('htx:route-loaded', (e) => {
    console.log('Route loaded:', e.detail);
});
```

## API Testing

### Auth Endpoints
```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Get current user
curl http://localhost:3000/api/me -b cookies.txt

# Sign out
curl -X POST http://localhost:3000/api/auth/sign-out -b cookies.txt
```

### Organization Endpoints
```bash
# List organizations (requires auth)
curl http://localhost:3000/api/organizations -b cookies.txt

# Create organization
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Org","slug":"test-org","description":"Test"}'
```

## Success Criteria

✅ Server starts without errors
✅ `/app` loads home page
✅ Route navigation works
✅ Components load and cache
✅ Authentication flow works
✅ Protected routes redirect
✅ 404 page shows for invalid routes
✅ No console errors
✅ Fast component loading (<50ms)

---

**Your HTX SPA system is fully functional!** 🚀

