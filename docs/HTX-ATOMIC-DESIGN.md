# HTX Atomic Design System

## 🎯 Philosophy

**HTML-First Architecture:** All HTML exists in `.htx` files or `main.css`. JavaScript should NEVER generate HTML through string concatenation or `innerHTML`. Instead, use **HTX atoms** - micro-templates that can be loaded and populated with data.

## 📐 HTX Hierarchy (Atomic Design)

```
htx/
├─ atoms/           ← Micro-templates (smallest reusable HTML units)
│  ├─ video-item.htx
│  ├─ toggle-button.htx
│  ├─ status-message.htx
│  └─ ...
│
├─ components/      ← Medium UI elements (composite components)
│  ├─ modal.htx
│  ├─ toast.htx
│  ├─ navbar.htx
│  └─ cookie-settings.htx
│
└─ pages/           ← Full page templates
   ├─ index.htx
   ├─ dashboard.htx
   ├─ room.htx
   └─ ...
```

### **Atoms**
- Smallest, indivisible UI components
- Single responsibility (one thing, one thing well)
- Reusable across multiple contexts
- Examples: button, list item, video container, badge

### **Components**
- Composed of multiple atoms
- Encapsulate specific UI functionality
- Include their own CSS (embedded `<style>` tags)
- Examples: modal, toast notification, navbar

### **Pages**
- Full-page templates
- Compose components and atoms into complete views
- Route-specific content
- Examples: homepage, dashboard, video room

## 🔧 Template System API

### JavaScript Module: `js/modules/templates.js`

```javascript
// Global instance
window.bunzTemplates
```

### **Methods**

#### `loadAtom(name)`
Load an atom template from `/htx/atoms/{name}.htx`

```javascript
const template = await bunzTemplates.loadAtom('video-item');
```

#### `render(template, data)`
Interpolate data into a template using `{key}` syntax

```javascript
const html = bunzTemplates.render(template, {
    peerId: 'abc123',
    userName: 'John Doe'
});
```

#### `renderAtom(atomName, data)`
Load and render an atom in one call

```javascript
const html = await bunzTemplates.renderAtom('video-item', {
    peerId: 'abc123',
    userName: 'John Doe'
});
```

#### `createElement(atomName, data)`
Create a DOM element from an atom template

```javascript
const videoEl = await bunzTemplates.createElement('video-item', {
    peerId: 'abc123',
    userName: 'John Doe'
});

document.querySelector('.video-grid').appendChild(videoEl);
```

#### `createElements(atomName, dataArray)`
Create multiple elements from an array of data

```javascript
const videos = await bunzTemplates.createElements('video-item', [
    { peerId: 'abc123', userName: 'John' },
    { peerId: 'def456', userName: 'Jane' }
]);

videos.forEach(video => grid.appendChild(video));
```

#### `preload(atomNames)`
Preload atoms for better performance

```javascript
await bunzTemplates.preload(['video-item', 'toggle-button', 'status-message']);
```

## 📝 Template Syntax

HTX atoms use simple `{key}` interpolation:

```html
<!-- htx/atoms/video-item.htx -->
<div class="video-container remote" id="video-{peerId}">
    <video autoplay playsinline></video>
    <div class="video-label">{userName}</div>
    <button class="presenter-btn" data-peer-id="{peerId}">
        📡 <span data-i18n="room.makePresenter">Make Presenter</span>
    </button>
</div>
```

### **Variable Interpolation**
- `{variableName}` - Simple string replacement
- Undefined keys are replaced with empty strings
- No complex logic (keep it simple!)

## ✅ Best Practices

### **DO:**
✅ Use atoms for any repeating UI element  
✅ Keep atoms focused (single responsibility)  
✅ Include all HTML/structure in `.htx` files  
✅ Use `textContent` or `createElement` with atoms  
✅ Embed CSS in atoms/components when specific to that element  

### **DON'T:**
❌ Generate HTML with `innerHTML = \`<div>...\``  
❌ Build HTML strings in JavaScript  
❌ Use template literals for markup  
❌ Mix concerns (keep HTML in HTX, logic in JS)  
❌ Create atoms for one-time use (use regular HTX instead)  

## 🎨 Example: Before & After

### ❌ **Before (HTML in JavaScript)**
```javascript
// BAD: HTML generation in JS
function addVideo(peerId, stream) {
    const container = document.createElement('div');
    container.className = 'video-container remote';
    container.id = `video-${peerId}`;
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsinline = true;
    video.srcObject = stream;
    
    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = `User ${peerId}`;
    
    const btn = document.createElement('button');
    btn.className = 'presenter-btn';
    btn.innerHTML = '📡 <span>Make Presenter</span>';
    btn.addEventListener('click', () => makePresenter(peerId));
    
    container.appendChild(video);
    container.appendChild(label);
    container.appendChild(btn);
    
    videoGrid.appendChild(container);
}
```

### ✅ **After (HTML-First with Atoms)**

**HTX Atom (`htx/atoms/video-item.htx`):**
```html
<div class="video-container remote" id="video-{peerId}">
    <video autoplay playsinline></video>
    <div class="video-label">{userName}</div>
    <button class="presenter-btn" data-peer-id="{peerId}">
        📡 <span data-i18n="room.makePresenter">Make Presenter</span>
    </button>
</div>
```

**JavaScript (logic only):**
```javascript
// GOOD: HTML from atom, JS for logic
async function addVideo(peerId, stream) {
    const container = await bunzTemplates.createElement('video-item', {
        peerId: peerId,
        userName: `User ${peerId.substring(0, 8)}`
    });
    
    // Set up stream and events (logic only!)
    const video = container.querySelector('video');
    video.srcObject = stream;
    
    const btn = container.querySelector('.presenter-btn');
    btn.addEventListener('click', () => makePresenter(peerId));
    
    videoGrid.appendChild(container);
}
```

## 📊 Benefits

1. **Separation of Concerns:** HTML in HTX, logic in JS, styles in CSS
2. **Maintainability:** HTML changes don't require JS updates
3. **Reusability:** Atoms can be used across multiple pages/contexts
4. **Testability:** Templates can be tested independently
5. **Performance:** Templates are cached after first load
6. **Developer Experience:** HTML in HTML files (not strings!)

## 🔄 Migration Guide

To convert existing `createElement` or `innerHTML` code to atoms:

1. **Identify** repeating HTML patterns in your JavaScript
2. **Extract** the HTML structure to a new atom file
3. **Replace** variables with `{key}` placeholders
4. **Refactor** JS to use `bunzTemplates.createElement()`
5. **Test** to ensure functionality remains the same

## 🎓 Philosophy Enforcement

**Rule:** All HTML, CSS, and page-specific JavaScript should exist in `.htx` files.

**HTX File Structure (Single File Components):**
```html
<!-- page.htx -->
<!-- @route: /page -->
<!-- @title: Page Title -->

<!-- HTML Structure -->
<div class="page-container">
  ...
</div>

<!-- Page-Specific CSS -->
<style>
.page-container {
  ...
}
</style>

<!-- Page-Specific JavaScript -->
<script>
// Page initialization and event handlers
document.addEventListener('bunz:loaded', () => {
  initializePage();
});
</script>
```

**What Goes Where:**
- ✅ **HTX pages**: HTML + page-specific CSS + page-specific JS
- ✅ **HTX components**: HTML + component CSS + component logic
- ✅ **HTX atoms**: Pure HTML templates (no logic)
- ✅ **main.css**: Global, reusable CSS only
- ✅ **js/core, js/ui, js/modules, js/utils**: Shared framework code

**Zero Tolerance:**
- No `innerHTML = \`<tag>...\``
- No multi-line template literals for HTML
- No complex HTML generation in JS loops
- No separate `.js` files for page-specific code

**This is the BUNZ way: Self-contained, HTML-first components.** 🎨

