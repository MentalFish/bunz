# BUNZ Single-File Components

## 🎯 Overview

BUNZ has evolved into a **true single-file component framework**, inspired by Vue and Svelte but staying HTML-first. Each `.htx` file is a complete, self-contained component with its own HTML, CSS, and JavaScript.

---

## 📐 Architecture

### **Three-Tier Hierarchy**

```
htx/
├─ atoms/           ← Micro-templates (pure HTML, no logic)
│  ├─ video-item.htx
│  ├─ toggle-button.htx
│  └─ status-message.htx
│
├─ components/      ← Self-contained UI components
│  ├─ modal.htx
│  ├─ toast.htx
│  ├─ navbar.htx
│  └─ cookie-settings.htx
│
└─ pages/           ← Self-contained page components
   ├─ index.htx
   ├─ dashboard.htx
   ├─ room.htx
   ├─ meeting.htx
   ├─ profile.htx
   └─ telemetry.htx
```

---

## 📝 HTX File Structure

Every HTX page/component follows this pattern:

```html
<!--
@route: /page-name
@title: Page Title
@guards: requireAuth (optional)
-->

<!-- HTML Structure -->
<div class="page-container">
    <h1>Page Content</h1>
    <!-- ... -->
</div>

<!-- Page-Specific CSS -->
<style>
.page-container {
    max-width: 1200px;
    margin: 0 auto;
}

/* All page-specific styles here */
</style>

<!-- Page-Specific JavaScript -->
<script>
/**
 * Page initialization and event handlers
 */

document.addEventListener('bunz:loaded', () => {
    if (!document.querySelector('.page-container')) return;
    
    initializePage();
});

async function initializePage() {
    // Page-specific logic
}

// Event handlers
document.querySelector('#button')?.addEventListener('click', handleClick);

function handleClick() {
    // Handler logic
}
</script>
```

---

## 🎨 What Goes Where

### **✅ HTX Files (Self-Contained)**

#### **Pages** (`htx/pages/*.htx`)
- Full-page templates
- All HTML structure for the page
- Page-specific CSS (scoped styles)
- Page-specific JavaScript (initialization, event handlers)
- **No separate files needed!**

#### **Components** (`htx/components/*.htx`)
- Reusable UI elements
- Component HTML structure
- Component-specific CSS
- Component-specific JavaScript logic
- Examples: modal, toast, navbar, cookie-settings

#### **Atoms** (`htx/atoms/*.htx`)
- Micro-templates for dynamic UI
- Pure HTML with `{key}` placeholders
- **No CSS or JavaScript** (templates only)
- Used via `bunzTemplates.createElement()`
- Examples: video-item, toggle-button, status-message

### **✅ Shared JavaScript (`js/`)**

Only **shared, reusable code** stays in separate JS files:

```
js/
├─ core/        ← Framework core (used by all pages)
│  ├─ loader.js
│  ├─ lifecycle.js
│  ├─ state.js
│  └─ ...
├─ ui/          ← Shared UI utilities
│  ├─ modal.js
│  ├─ toast.js
│  └─ a11y.js
├─ modules/     ← Feature modules
│  ├─ webrtc.js
│  ├─ templates.js
│  ├─ i18n.js
│  └─ ...
├─ utils/       ← Shared utilities
│  ├─ forms.js
│  └─ errors.js
└─ init.js      ← App initialization
```

**Rule:** If it's used by 2+ pages → `js/`. If it's page-specific → embedded in HTX!

### **✅ Global CSS (`main.css`)**

Only **global, reusable styles**:
- Design tokens (CSS variables)
- Reset/normalize styles
- Global layout utilities
- Reusable utility classes
- Video components (used across pages)

**Rule:** If it's specific to one component → embedded in HTX! If it's reusable → `main.css`!

---

## 🚀 Benefits

### **1. True Encapsulation**
One file contains everything for a component:
- HTML structure
- CSS styling
- JavaScript logic

### **2. Easier Maintenance**
- Edit one file, not 3 different files
- No hunting for related files
- Clear separation of pages vs shared code

### **3. Better Developer Experience**
- Component = single file
- Delete component = delete one file
- Duplicate component = copy one file

### **4. Industry Standard**
Follows proven patterns from:
- **Vue.js** - Single File Components (.vue)
- **Svelte** - Component files (.svelte)
- **Astro** - Component files (.astro)

### **5. HTML-First**
Unlike Vue/Svelte, BUNZ keeps HTML as the source of truth:
- No compilation needed
- No special syntax (pure HTML, CSS, JS)
- No build step required
- Server-side rendering friendly

---

## 📚 Examples

### **Simple Page**

`htx/pages/about.htx`:
```html
<!--
@route: /about
@title: About Us
-->

<div class="about-page">
    <h1>About BUNZ</h1>
    <p>An HTML-first framework...</p>
</div>

<style>
.about-page {
    max-width: 800px;
    margin: 0 auto;
}
</style>

<script>
console.log('About page loaded');
</script>
```

### **Complex Page with Atoms**

`htx/pages/users.htx`:
```html
<!--
@route: /users
@title: User Directory
@guards: requireAuth
-->

<div class="users-page">
    <h1>Users</h1>
    <div id="user-list"></div>
</div>

<style>
.users-page {
    padding: 2rem;
}
</style>

<script>
document.addEventListener('bunz:loaded', async () => {
    if (!document.querySelector('.users-page')) return;
    
    // Fetch users
    const response = await fetch('/api/users');
    const users = await response.json();
    
    // Render using atom template (HTML-first!)
    const userElements = await bunzTemplates.createElements('user-card', 
        users.map(u => ({ name: u.name, email: u.email }))
    );
    
    const container = document.getElementById('user-list');
    userElements.forEach(el => container.appendChild(el));
});
</script>
```

---

## 🔄 Lifecycle Events

HTX components have access to BUNZ lifecycle events:

```javascript
// When component loads
document.addEventListener('bunz:loaded', (e) => {
    // Initialize component
});

// Before content swap (cleanup)
document.addEventListener('bunz:beforeSwap', () => {
    // Stop timers, remove event listeners, etc.
});

// After content swap
document.addEventListener('bunz:afterSwap', () => {
    // Re-initialize if needed
});
```

---

## ⚡ Performance

### **HTX Loading**
1. Browser requests HTX file
2. Server responds with HTML + CSS + JS
3. Browser parses and executes embedded scripts
4. No additional script requests needed!

### **Shared Code**
- Framework core loaded once (`main.js`, `core/*.js`, etc.)
- Cached by browser
- Only page-specific code loads per page
- All in one HTTP request (the HTX file itself)

### **Atoms (Dynamic UI)**
- Templates cached after first load
- Reusable across pages
- No HTML string concatenation
- DOM-based rendering

---

## 📊 Comparison with Other Frameworks

| Feature | BUNZ | Vue SFC | Svelte | React |
|---------|------|---------|--------|-------|
| Single file components | ✅ | ✅ | ✅ | ❌ |
| No build step | ✅ | ❌ | ❌ | ❌ |
| HTML-first | ✅ | ❌ | ❌ | ❌ |
| SSR support | ✅ | ✅ | ✅ | ✅ |
| Pure HTML/CSS/JS | ✅ | ❌ | ❌ | ❌ |
| Standard syntax | ✅ | ❌ | ❌ | ❌ |
| Atomic templates | ✅ | ❌ | ❌ | ❌ |

**BUNZ Advantage:** All the benefits of modern frameworks, none of the build complexity!

---

## 🎓 Best Practices

### **DO:**
✅ Keep all page logic in the page's HTX file  
✅ Use atoms for dynamic UI generation  
✅ Scope CSS to the component  
✅ Listen for lifecycle events  
✅ Clean up in `bunz:beforeSwap`  
✅ Use shared modules for cross-page logic  

### **DON'T:**
❌ Create separate `.js` files for page logic  
❌ Generate HTML with template literals  
❌ Put page-specific code in shared modules  
❌ Pollute global scope (use closures or unique names)  
❌ Forget to check if elements exist before using them  

---

## 🔮 Future Possibilities

### **TypeScript Support**
HTX could support inline TypeScript:
```html
<script lang="ts">
const users: User[] = await fetchUsers();
</script>
```

### **Scoped Styles**
Auto-scope CSS to component (like Vue):
```html
<style scoped>
/* Only applies to this component */
.title { color: red; }
</style>
```

### **Module Imports**
ES6 imports in embedded scripts:
```html
<script type="module">
import { helper } from '/js/utils/helper.js';
</script>
```

---

## 🎉 Result

**BUNZ HTX files are now:**
- ✅ Self-contained single-file components
- ✅ No build step required
- ✅ Pure HTML, CSS, and JavaScript
- ✅ Industry-standard architecture
- ✅ HTML-first philosophy

**Like Vue and Svelte, but simpler and more honest to the web platform.** 🚀

