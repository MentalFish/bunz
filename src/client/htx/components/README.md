# HTX Components

Reusable UI components following the HTML-first BUNZ philosophy.

## Available Components

### `modal.htx`
Reusable modal frame with close button and body slot.
```javascript
await bunzComponents.insert('modal', '#bunz-modal');
```

### `panel.htx`
Standard panel/section container.
```javascript
await bunzComponents.insert('panel', '#target', {
    content: '<h2>Panel Title</h2><p>Content here</p>'
});
```

### `card.htx`
Clickable card component with hover effects.
```javascript
const card = await bunzComponents.create('card', {
    content: '<h3>Card Title</h3>'
});
```

### `alert.htx`
Alert/message component.
```javascript
await bunzComponents.insert('alert', '#messages', {
    content: 'Operation successful!'
});
```

### `loading.htx`
Loading state indicator.
```javascript
await bunzComponents.insert('loading', '#content', {
    content: 'Loading data...'
});
```

### `empty-state.htx`
Empty state placeholder.
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

## Philosophy

HTX components follow the **HTML-first** principle:
- ✅ **UI is HTML**, not JavaScript strings
- ✅ **Reusable** across pages
- ✅ **Cacheable** for performance
- ✅ **Self-contained** - HTML structure stays in `.htx` files
- ✅ **Server-ready** - Can be used for SSR in the future

## Creating New Components

1. Create `/htx/components/my-component.htx`
2. Add HTML structure with `<slot></slot>` placeholders
3. Use via `bunzComponents.load('my-component')`

That's it! No build step, no compilation. Pure HTML components.

