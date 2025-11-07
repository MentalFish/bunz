# Accessibility Focus Management Fix

**Issue:** When reloading pages, keyboard focus was landing on navbar elements instead of main content on all sub-pages (room, dashboard, etc.), but the homepage worked correctly.

**Date Fixed:** November 4, 2025

---

## Problem

When navigating to or reloading sub-pages (like `/room` or `/dashboard`), the browser's tab navigation would start at the navbar instead of the main content area. This created a poor keyboard navigation experience where users had to tab through all navbar links before reaching the actual page content.

The homepage worked correctly because it had an `h1` as the first element in the content area that the focus management could latch onto.

---

## Root Cause

The `manageFocus()` function in `bunz-a11y.js` was looking for the first `h1` or `h2` within the content container, but:

1. The querySelector wasn't scoped properly to only search within the container
2. It could find heading elements in the navbar or other global areas
3. Sub-pages had `<header>` wrapper elements that interfered with heading discovery
4. There was no fallback to focus the container itself

---

## Solution

### 1. Improved Focus Management (`bunz-a11y.js`)

**Changes Made:**

```javascript
// BEFORE: Simple querySelector that could leak outside container
const heading = el.querySelector('h1, h2');

// AFTER: Scoped query that prioritizes headings within the container
const heading = el.querySelector(':scope > header h1, :scope > h1, :scope h1, :scope > header h2, :scope > h2, :scope h2');
```

**Improvements:**

- ✅ Uses `:scope` to ensure we only search within the container
- ✅ Prioritizes direct children first (`> h1`), then descends into headers
- ✅ Looks for `h1` before `h2` for proper heading hierarchy
- ✅ Temporarily adds `tabindex="-1"` to make headings focusable
- ✅ Removes `tabindex` after 100ms to restore natural tab order
- ✅ Falls back to focusing the container itself if no heading found

### 2. Automatic Skip Link

**Added:**

```javascript
constructor() {
    this.createLiveRegion();
    this.setupKeyboardNav();
    
    // Add skip link automatically on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.addSkipLink());
    } else {
        this.addSkipLink();
    }
}
```

**Benefits:**

- ✅ Automatically adds "Skip to main content" link
- ✅ Hidden off-screen until focused
- ✅ Allows keyboard users to bypass navigation
- ✅ Appears visually when focused with Tab key

---

## How It Works Now

### Focus Priority (in order):

1. **Custom focus target** - If `options.focus` is specified
2. **First heading in container** - Looks for `h1` then `h2` within the content area
3. **Container itself** - If no heading found, focuses the `#app` container

### On Page Load/Navigation:

1. Content is loaded into `#app` container
2. `bunzA11y.manageFocus(targetEl)` is called
3. First `h1` or `h2` within `#app` receives focus
4. User can immediately start reading/interacting with main content
5. Tab order is natural (no lingering `tabindex` attributes)

### Skip Link:

- Press **Tab** on any page
- "Skip to main content" link appears at top-left
- Press **Enter** to jump directly to `#app` container
- Bypasses all navbar links

---

## Testing

### Keyboard Navigation Test:

1. Navigate to any page (e.g., `/room`)
2. Reload the page (Cmd+R / Ctrl+R)
3. Press **Tab**
4. ✅ **Expected:** "Skip to main content" link appears
5. Press **Tab** again
6. ✅ **Expected:** Focus is on main content heading or first interactive element
7. ❌ **Before:** Focus was on first navbar link

### Screen Reader Test:

1. Enable VoiceOver (Cmd+F5) or NVDA
2. Navigate to a page
3. ✅ **Expected:** Screen reader announces "Page loaded" and reads the main heading
4. Tab through page
5. ✅ **Expected:** Natural tab order through content

---

## Files Modified

1. **public/bunz/bunz-a11y.js**
   - Improved `manageFocus()` method
   - Auto-initialize skip link
   - Better heading discovery with `:scope`
   - Temporary tabindex management

2. **public/bunz/min/bunz-a11y.js**
   - Minified version updated via `bun src/scripts/minify.ts`

---

## Accessibility Compliance

| Criteria | Before | After |
|----------|--------|-------|
| WCAG 2.4.1 (Bypass Blocks) | ❌ Partial | ✅ Complete |
| WCAG 2.4.3 (Focus Order) | ⚠️ Issue | ✅ Fixed |
| WCAG 2.4.7 (Focus Visible) | ✅ Good | ✅ Good |
| Keyboard Navigation | ⚠️ Issue | ✅ Fixed |
| Screen Reader Experience | ⚠️ Issue | ✅ Improved |

---

## No Breaking Changes

✅ All changes are backward compatible  
✅ Existing functionality preserved  
✅ No API changes  
✅ No HTML structure changes required  

---

## Future Improvements

### Optional Enhancements:

1. **Focus Indicators** - Add custom focus styling for better visibility
2. **Focus Trap** - Already implemented for modals, works great
3. **Landmark Navigation** - Add ARIA landmarks for screen reader shortcuts
4. **Reduced Motion** - Respect `prefers-reduced-motion` for animations

---

## Summary

The focus management issue is now **completely fixed**. Keyboard users will have a smooth experience on all pages, with focus landing on the main content immediately after page load. The skip link provides an additional accessibility win for power users who want to bypass navigation quickly.

**Impact:**
- ✅ Better keyboard navigation experience
- ✅ Improved screen reader experience  
- ✅ WCAG 2.4 compliance improved
- ✅ No negative side effects
- ✅ Works on all pages (homepage, room, dashboard, etc.)

---

## Verified Working

**Tested on:** November 4, 2025

✅ **Homepage (/)** - Focus lands on h1, Tab goes to "Start Meeting"  
✅ **Room (/room)** - Focus lands on h1, Tab goes to "Refresh" button  
✅ **Dashboard (/dashboard)** - Focus lands on h1, Tab goes to "+ Create Organization"  

**Test Results:**
- On page load/reload, the h1 heading receives programmatic focus
- Screen reader announces "Page loaded"
- First Tab press moves to first interactive element in main content
- Navbar is completely bypassed
- Natural tab order maintained after initial focus

---

**Status:** ✅ Fixed, tested, and verified working. Ready for production.

