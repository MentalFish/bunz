# HTX Components

Reusable UI components following the HTML-first BUNZ philosophy.

## 🎯 **NEW: Atomic Design System**

BUNZ now implements a three-tier hierarchy based on **Atomic Design**:

1. **Atoms** (`/htx/atoms/`) - Micro-templates (smallest units)
   - Loaded via `bunzTemplates.createElement()`
   - Examples: `video-item.htx`, `toggle-button.htx`
   - **See:** [HTX Atomic Design Documentation](./HTX-ATOMIC-DESIGN.md)

2. **Components** (`/htx/components/`) - Medium UI elements
   - Composed of atoms, include embedded CSS
   - Examples: `modal.htx`, `toast.htx`, `navbar.htx`

3. **Pages** (`/htx/pages/`) - Full page templates
   - Compose components and atoms
   - Examples: `index.htx`, `dashboard.htx`, `room.htx`

**Rule:** All HTML must exist in `.htx` files. Zero HTML generation in JavaScript!

---

## Component Types

### **Layout Components** (Self-Contained with CSS)

#### `navbar.htx`
Global navigation bar with auth state, language switcher, and links.
- **Auto-loaded** by `bunz-navbar.js` on page init
- **Includes CSS**: All navbar, language dropdown, and auth styles
- **Dynamic**: Updates auth state automatically

#### `modal.htx`
Reusable modal frame with close button and body slot.
- **Auto-loaded** by `bunz-modal.js` when first modal opens
- **Includes CSS**: Modal overlay, content frame, close button
```javascript
await bunzComponents.insert('modal', '#bunz-modal');
```

### **UI Components** (Use Global Styles)

#### `panel.htx`
Standard panel/section container (uses `.panel` from `app.css`).
```javascript
await bunzComponents.insert('panel', '#target', {
    content: '<h2>Panel Title</h2><p>Content here</p>'
});
```

#### `card.htx`
Clickable card component with hover effects (uses `.card` from `app.css`).
```javascript
const card = await bunzComponents.create('card', {
    content: '<h3>Card Title</h3>'
});
```

#### `alert.htx`
Alert/message component (uses `.alert` from `app.css`).
```javascript
await bunzComponents.insert('alert', '#messages', {
    content: 'Operation successful!'
});
```

#### `loading.htx`
Loading state indicator (uses `.loading-screen` and `.loading` from `app.css`).
```javascript
await bunzComponents.insert('loading', '#content', {
    content: 'Loading data...'
});
```

#### `empty-state.htx`
Empty state placeholder (uses `.empty-state` from `app.css`).
```javascript
await bunzComponents.insert('empty-state', '#list', {
    content: 'No items found'
});
```

## Usage

### Load Component HTML
```javascript
const html = await bunzComponents.load('panel');
```

### Insert into DOM
```javascript
await bunzComponents.insert('modal', '#target', {
    content: '<p>Content</p>',
    append: true  // Append instead of replace
});
```

### Create as Element
```javascript
const element = await bunzComponents.create('card', {
    content: 'Card content'
});
document.body.appendChild(element);
```

### Preload Components
```javascript
await bunzComponents.preload(['modal', 'panel', 'card']);
```

## Architecture Principles

### HTML-First Philosophy

HTX components follow the **HTML-first** principle:
- ✅ **UI is HTML**, not JavaScript strings
- ✅ **Reusable** across pages
- ✅ **Cacheable** for performance
- ✅ **Self-contained** - HTML structure stays in `.htx` files
- ✅ **Server-ready** - Can be used for SSR in the future

### CSS Organization Rules

**When to embed CSS in HTX components:**
1. **Component-specific styles** - Unique to that component
2. **Large style blocks** - Navbar, complex layouts
3. **Self-contained components** - Modal, navbar, etc.
4. **Reduces global CSS** - Keeps `app.css` lean

**When to use global CSS (`app.css`):**
1. **Reusable utilities** - `.panel`, `.card`, `.btn-primary`
2. **Design system** - Colors, spacing, typography
3. **Shared patterns** - `.video-grid`, `.control-group`
4. **Cross-page consistency** - Buttons, forms, alerts

**Example Decision Tree:**
```
Is this style used on 2+ pages?
├─ Yes → app.css (global)
└─ No → HTX component (embedded)
    ├─ Does it override a global style?
    │  └─ Yes → Use scoped selector (.page-container .element)
    └─ Is it >50 lines of CSS?
       └─ Yes → Embed in HTX for better organization
```

## Creating New Components

1. Create `/htx/components/my-component.htx`
2. Add HTML structure with `<slot></slot>` placeholders
3. Use via `bunzComponents.load('my-component')`

That's it! No build step, no compilation. Pure HTML components.

