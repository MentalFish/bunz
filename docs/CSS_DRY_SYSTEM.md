# CSS DRY System

## Overview

The application CSS has been refactored to follow DRY (Don't Repeat Yourself) principles with a universal button system and standardized messaging components.

## Button System

### Base Button Style

All buttons and elements with `.btn` class inherit a comprehensive base style:

- **Layout**: Flexbox with centered content and gap for icons
- **Spacing**: Consistent padding (0.75rem × 1.5rem)
- **Visual**: Rounded borders (8px), subtle drop shadow
- **Interaction**: Smooth transitions, hover lift effect, disabled state

```html
<button class="btn-primary">Primary Action</button>
```

### Button Variants (Color Only)

The DRY system means variants **only override colors**, inheriting all other styles:

#### Primary Colors
```html
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-tertiary">Tertiary (Purple)</button>
```

#### State Colors
```html
<button class="btn-danger">Delete</button>
<button class="btn-success">Confirm</button>
```

### Button Sizes

```html
<button class="btn-sm">Small Button</button>
<button>Default Button</button>
<button class="btn-lg">Large Button</button>
```

### Button Styles

```html
<button class="btn-outline">Outline Button</button>
<button class="btn-ghost">Ghost Button</button>
```

### Semantic HTML

#### Use `<button>` for Actions
When the element **performs an action** (submit, toggle, execute JS):

```html
<!-- ✅ Correct -->
<button onclick="openModal()" class="btn-primary">Open Modal</button>
<button type="submit" class="btn-primary">Submit Form</button>
<button onclick="toggleVideo()" class="btn-secondary">Toggle Video</button>
```

#### Use `<a href>` for Navigation
When the element **navigates to a URL** (even if it's SPA navigation):

```html
<!-- ✅ Correct -->
<a href="/" onclick="event.preventDefault(); navigateTo('/')" class="btn-primary">Home</a>
<a href="/dashboard" class="htx-navbar-link">Dashboard</a>
```

#### Exception: Cards as Links
For navigational cards, use `<a>` wrapping the entire card:

```html
<!-- ✅ Correct -->
<a href="/meeting" onclick="event.preventDefault(); navigateTo('/meeting')" class="card">
    <h3>Start Meeting</h3>
    <p>Begin a video conference</p>
</a>
```

## Universal Messaging System

### Four Message Types

All message types share base styling with color-specific overrides:

```html
<!-- Info - Blue -->
<div class="info">
    This is informational content
</div>

<!-- Warning - Yellow -->
<div class="warn">
    This is a warning message
</div>

<!-- Error - Red -->
<div class="error">
    This is an error message
</div>

<!-- Success - Green -->
<div class="success">
    Operation completed successfully
</div>
```

### Features

- **Auto-icons**: Each type includes an emoji icon (ℹ️, ⚠️, ❌, ✅)
- **Left border**: 4px colored border for visual hierarchy
- **Consistent spacing**: All messages have the same padding and margins
- **Flexbox layout**: Aligns icon and text properly

### Dynamic Messages

For dynamically shown/hidden messages:

```html
<div id="error-message" class="error-message"></div>
<div id="success-message" class="success-message"></div>
```

```javascript
// Show message
document.getElementById('error-message').textContent = 'Something went wrong';
document.getElementById('error-message').classList.add('show');

// Hide message  
document.getElementById('error-message').classList.remove('show');
```

### Message Variants

```html
<!-- Compact message -->
<div class="info message-compact">Smaller padding</div>

<!-- Inline message -->
<div class="success message-inline">Inline display</div>
```

## CSS Variables

### Colors

```css
/* Primary Colors */
--primary: #6366f1;
--primary-hover: #4f46e5;
--secondary: #64748b;
--secondary-hover: #475569;
--tertiary: #8b5cf6;
--tertiary-hover: #7c3aed;

/* State Colors */
--danger: #ef4444;
--danger-hover: #dc2626;
--success: #10b981;
--success-hover: #059669;
--warning: #f59e0b;
--warning-hover: #d97706;
--info: #3b82f6;
--info-hover: #2563eb;
```

### Shadows

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
```

## Benefits

### DRY Principles

1. **Single source of truth**: Base button style defined once
2. **Easy to maintain**: Change padding/radius in one place
3. **Consistent**: All buttons look and behave the same
4. **Flexible**: Easy to add new variants (just override colors)

### Improved Semantics

1. **Accessibility**: Proper HTML elements for screen readers
2. **SEO**: Search engines understand navigation structure
3. **Keyboard navigation**: Tab order works correctly
4. **Browser features**: Right-click context menu works for links

### Universal Messages

1. **Consistency**: All messages look uniform across the app
2. **Quick to use**: Just add a class, no custom styling
3. **Visual hierarchy**: Icons and colors create clear meaning
4. **Maintainable**: Change all messages by editing base style

## Examples

### Before (Not DRY)

```css
.btn-primary {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    background: var(--primary);
    /* ... 20 lines of repeated styles ... */
}

.btn-secondary {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    background: var(--secondary);
    /* ... 20 lines of repeated styles ... */
}
```

### After (DRY)

```css
/* Base (defined once) */
button, .btn {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 8px;
    /* ... all shared styles ... */
}

/* Variants (only colors) */
.btn-primary { background: var(--primary); }
.btn-secondary { background: var(--secondary); }
```

## Recommendations

### When to Use What

1. **Primary button**: Main call-to-action (1 per section)
2. **Secondary button**: Alternative actions
3. **Tertiary button**: Less important actions
4. **Danger button**: Destructive actions (delete, logout)
5. **Success button**: Confirmation actions
6. **Ghost button**: Minimal visual weight

### Accessibility Tips

1. Add `aria-label` for icon-only buttons
2. Use `disabled` attribute, not just styling
3. Ensure sufficient color contrast
4. Test keyboard navigation (Tab, Enter, Space)

### Future Additions

Consider adding:
- `.btn-outline-danger` for destructive outline buttons
- `.btn-sm-icon` for icon-only small buttons
- Loading states with spinner animations
- Button groups for related actions

---

**Result**: Cleaner CSS, better semantics, easier maintenance! 🎉

