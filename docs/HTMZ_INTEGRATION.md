# htmz Integration

## What is htmz?

**htmz** is a minimalist HTML microframework that enables loading HTML resources within any element on the page. It's a generalization of HTML frames - instead of loading content into frames, you can load it into any element.

### Key Benefits
- ✅ **Zero dependencies** - Just a single line of HTML
- ✅ **No JavaScript bundles** - Inline HTML snippet
- ✅ **No backend required** - Works with static HTML
- ✅ **Tiny footprint** - One `<iframe>` element
- ✅ **Standards-based** - Uses native HTML features

## Implementation

### The htmz Snippet

Added to `app.html`:
```html
<iframe hidden name="htmz" onload="setTimeout(()=>document.querySelector(contentWindow.location.hash||null)?.replaceWith(...contentDocument.body.childNodes))"></iframe>
```

This single line enables:
- Loading HTML content into any element
- Using standard `<a>` tags with `target="htmz"` and `href="/path#selector"`
- Progressive enhancement (works without JavaScript)
- Minimal overhead (hidden iframe)

## Replaced System

### Before: Fixi.js
- Custom JavaScript library (~500+ lines)
- Custom attributes (`fx-action`, `fx-target`, `fx-swap`)
- Client-side AJAX handling
- Additional bundle to load

### After: htmz
- Single inline HTML snippet (1 line)
- Standard HTML attributes (`href`, `target`)
- Browser-native navigation
- No additional files to load

## Usage Examples

### Basic Link That Updates Content

```html
<!-- Load content from /api/users into #user-list -->
<a href="/api/users#user-list" target="htmz">Load Users</a>

<div id="user-list">
    <!-- Content will be replaced here -->
</div>
```

### Form Submission

```html
<!-- Submit form and update #result -->
<form action="/api/submit#result" method="POST" target="htmz">
    <input type="text" name="data">
    <button type="submit">Submit</button>
</form>

<div id="result">
    <!-- Response will appear here -->
</div>
```

### Button Click

```html
<!-- Load room info on button click -->
<button onclick="this.nextElementSibling.click()">Refresh</button>
<a href="/api/room-info?room=default#room-info" target="htmz" hidden></a>

<div id="room-info">
    <!-- Room info loads here -->
</div>
```

## Integration with HTX Components

### HTX Component with htmz

```html
<!-- htx/dashboard.htx -->
<nav class="htx-navbar">...</nav>

<div class="htx-content">
    <!-- Use htmz for dynamic content loading -->
    <a href="/htx/widget.htx#widget-container" target="htmz" class="btn-primary">
        Load Widget
    </a>
    
    <div id="widget-container">
        <!-- Widget loads here via htmz -->
    </div>
</div>
```

### Room Info with htmz

The existing room info functionality now uses htmz:

```html
<!-- Old Fixi approach -->
<div fx-action="/api/room-info?room=default" fx-trigger="load" fx-swap="innerHTML">
    Loading...
</div>

<!-- New htmz approach -->
<div id="room-info">
    <a href="/api/room-info?room=default#room-info" target="htmz" hidden></a>
    <script>document.currentScript.previousElementSibling.click()</script>
</div>
```

## How htmz Works

1. **User clicks link** with `target="htmz"`
2. **Browser loads URL** into the htmz iframe
3. **iframe onload fires** after content loads
4. **JavaScript extracts hash** from URL (e.g., `#room-info`)
5. **Finds target element** using `querySelector`
6. **Replaces element content** with iframe body content
7. **Result**: Element updated without page reload

### Flow Diagram

```
User Action (click link target="htmz")
    ↓
Load URL into hidden iframe
    ↓
Extract hash selector (#target)
    ↓
Find element with matching ID
    ↓
Replace element content
    ↓
Content updated!
```

## Server Response Format

For htmz to work, server responses should be:

### Simple HTML Fragment

```html
<!-- Response from /api/room-info -->
<div class="room-info">
    <h3>Room: default</h3>
    <p>Connected users: 3</p>
</div>
```

### Or Full HTML Document

```html
<!-- Response can also be a full HTML doc -->
<!DOCTYPE html>
<html>
<body>
    <div class="room-info">
        <h3>Room: default</h3>
        <p>Connected users: 3</p>
    </div>
</body>
</html>
```

htmz extracts the body content automatically.

## Advantages Over Fixi

| Feature | Fixi.js | htmz |
|---------|---------|------|
| **File Size** | ~500 lines JS | 1 line HTML |
| **Dependencies** | Custom lib | Zero |
| **Bundle Size** | ~15KB | ~0.3KB |
| **Attributes** | Custom (`fx-*`) | Standard HTML |
| **Learning Curve** | New API | Familiar HTML |
| **Browser Cache** | Separate file | Inline |
| **Maintenance** | Update library | Nothing to update |

## Migration from Fixi to htmz

### Pattern 1: Simple Action

```html
<!-- Before (Fixi) -->
<button fx-action="/api/data" fx-target="#result" fx-swap="innerHTML">
    Load Data
</button>

<!-- After (htmz) -->
<button onclick="this.nextElementSibling.click()">Load Data</button>
<a href="/api/data#result" target="htmz" hidden></a>

<div id="result"></div>
```

### Pattern 2: Trigger on Load

```html
<!-- Before (Fixi) -->
<div fx-action="/api/data" fx-trigger="load" fx-swap="innerHTML">
    Loading...
</div>

<!-- After (htmz) -->
<div id="data">
    <a href="/api/data#data" target="htmz" hidden></a>
    <script>document.currentScript.previousElementSibling.click()</script>
</div>
```

### Pattern 3: Form Submission

```html
<!-- Before (Fixi) -->
<form fx-action="/api/submit" fx-method="POST" fx-target="#result">
    <input type="text" name="field">
    <button type="submit">Submit</button>
</form>

<!-- After (htmz) -->
<form action="/api/submit#result" method="POST" target="htmz">
    <input type="text" name="field">
    <button type="submit">Submit</button>
</form>

<div id="result"></div>
```

## Updated HTX Components

All HTX components have been updated to use htmz instead of Fixi:
- ✅ `room.htx` - Uses htmz for room info
- ✅ `meeting.htx` - Uses htmz for meeting details
- ✅ Server responses formatted for htmz

## Benefits Realized

1. **Simpler Codebase** - Removed 500+ lines of Fixi code
2. **Faster Loading** - No additional JS file to load
3. **Standards-Based** - Uses native HTML features
4. **Better Caching** - Inline code cached with HTML
5. **Less Maintenance** - No library to update
6. **More Accessible** - Works with standard HTML
7. **Progressive Enhancement** - Degrades gracefully

## Browser Compatibility

htmz works in all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

Uses standard features:
- `<iframe>` elements
- `onload` events
- `querySelector`
- Spread operator

---

**htmz: A low power tool for HTML** - Perfect for HTX! 🚀

