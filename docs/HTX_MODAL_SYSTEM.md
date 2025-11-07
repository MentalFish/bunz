# HTX Modal System Documentation

## Overview

The HTX Modal System provides a beautiful overlay-based modal dialog system for displaying content (like login/signup forms) on top of any page with a darkened, blurred background.

## Features

- 🎨 **Beautiful Design**: Darkened background with blur effect
- ⚡ **Smooth Animations**: Fade in/scale animations
- 🔒 **Focus Lock**: Prevents background interaction when modal is open
- ⌨️ **Keyboard Support**: Close with Escape key
- 📱 **Responsive**: Works on all screen sizes
- 🎯 **Easy to Use**: Simple API for opening/closing modals

## Usage

### Opening a Modal

```javascript
// Open modal with HTX component
await openModal('login-modal.htx');

// Or use the modal instance
await window.htxModal.open('login-modal.htx');
```

### Closing a Modal

```javascript
// Close the current modal
closeModal();

// Or use the modal instance
window.htxModal.close();
```

### Check if Modal is Open

```javascript
if (window.htxModal.isOpen()) {
    console.log('Modal is currently open');
}
```

## HTML Structure

The modal system creates this structure:

```html
<div id="htx-modal-container" class="htx-modal-overlay">
    <div class="htx-modal-content">
        <button class="htx-modal-close" aria-label="Close modal">&times;</button>
        <div class="htx-modal-body" id="htx-modal-body">
            <!-- HTX component content loads here -->
        </div>
    </div>
</div>
```

## Events

### Modal Opened Event

```javascript
document.addEventListener('htx:modal-opened', (e) => {
    console.log('Modal opened:', e.detail.componentPath);
});
```

### Modal Closed Event

```javascript
document.addEventListener('htx:modal-closed', (e) => {
    console.log('Modal closed:', e.detail.componentPath);
});
```

## Login/Signup Modal

The login modal is specifically designed for authentication:

### Features

- Tab switcher between Login and Signup
- Form validation
- Error/success messages
- Auto-redirect on success

### Opening the Login Modal

```javascript
// From any page
openModal('login-modal.htx');
```

### In HTML

```html
<button onclick="openModal('login-modal.htx')">Login</button>
```

### Authentication Flow

1. User clicks "Login" button
2. Modal opens with login-modal.htx component
3. Background darkens and blurs
4. User fills in form
5. On success, `htx:auth-success` event fires
6. Modal automatically closes
7. User redirects to dashboard

## Integration with Route Guards

You can use modals in route guards to show login when needed:

```javascript
async function requireAuthModal(path, state, route) {
    try {
        const response = await fetch('/api/me', { credentials: 'include' });
        if (!response.ok) {
            // Not authenticated, open login modal
            await openModal('login-modal.htx');
            return false; // Prevent navigation
        }
        return true;
    } catch (error) {
        await openModal('login-modal.htx');
        return false;
    }
}

// Apply to route
router.route('/protected', 'protected.htx', {
    guards: [requireAuthModal]
});
```

## Styling

### Modal Overlay

```css
.htx-modal-overlay {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    z-index: 9999;
}
```

### Modal Content

```css
.htx-modal-content {
    background: var(--surface);
    border-radius: 16px;
    max-width: 600px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
```

### Close Button

```css
.htx-modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    border-radius: 50%;
    /* Rotates 90deg on hover */
}
```

## Closing Methods

The modal can be closed in multiple ways:

1. **Click Close Button (×)** - Top right corner
2. **Click Outside** - Click on darkened background
3. **Escape Key** - Press Esc on keyboard
4. **Programmatically** - Call `closeModal()`
5. **On Success** - Auto-closes after successful auth

## Creating Custom Modal Components

Any HTX component can be displayed in a modal:

```html
<!-- htx/my-modal.htx -->
<div style="padding: 2rem;">
    <h2>Custom Modal</h2>
    <p>This is a custom modal component!</p>
    <button onclick="closeModal()" class="btn-primary">
        Close
    </button>
</div>
```

Open it:
```javascript
openModal('my-modal.htx');
```

## Best Practices

### 1. Keep Modals Focused

- Single purpose per modal
- Clear call-to-action
- Easy to close

### 2. Handle Success/Failure

```javascript
// In your modal component's script
document.dispatchEvent(new CustomEvent('htx:modal-action', {
    detail: { action: 'submit', success: true }
}));

closeModal();
```

### 3. Prevent Background Scroll

The modal system automatically prevents background scroll when open by setting `overflow: hidden` on body.

### 4. Responsive Design

The modal automatically adjusts for mobile:
- 95% width on mobile
- 90% on desktop
- Max height 95vh with scroll

## Examples

### Example 1: Simple Alert Modal

```html
<!-- htx/alert-modal.htx -->
<div style="text-align: center; padding: 2rem;">
    <h2>⚠️ Warning</h2>
    <p>Are you sure you want to continue?</p>
    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
        <button onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button onclick="handleConfirm()" class="btn-danger">Confirm</button>
    </div>
</div>
```

### Example 2: Form Modal

```html
<!-- htx/form-modal.htx -->
<div>
    <h2>Create New Item</h2>
    <form id="item-form">
        <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" required>
        </div>
        <button type="submit" class="btn-primary">Create</button>
    </form>
</div>

<script>
document.getElementById('item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Handle form submission
    closeModal();
});
</script>
```

## Technical Details

### Initialization

The modal system initializes automatically when `htx-modal.js` loads:

```javascript
window.htxModal = new HTXModal();
```

### Animation Timeline

1. Modal appears (display: flex)
2. Opacity fades from 0 to 1 (300ms)
3. Content scales from 0.9 to 1 (300ms)
4. Close reverses the animation

### Z-Index Management

- Modal overlay: `z-index: 9999`
- Close button: `z-index: 10` (relative to content)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (backdrop-filter may vary)
- Mobile browsers: ✅ Full support

## Performance

- Modal container created once, reused
- HTX caching reduces load times
- Smooth 60fps animations
- No layout thrashing

---

**The HTX Modal System makes beautiful, functional modals effortless!** 🚀

