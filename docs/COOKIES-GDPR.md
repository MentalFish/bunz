# BUNZ GDPR Cookie Consent & Toast System

## 🍪 **GDPR-Compliant Cookie Consent**

BUNZ now includes a comprehensive, GDPR-compliant cookie consent system with:
- ✅ **Default: Reject All** - Privacy-first approach
- ⏱️ **10-second auto-reject** - Automatic rejection if no action
- 🍪 **Granular control** - Choose specific cookie categories
- 🎨 **Toast-based UI** - Non-intrusive, bottom-center placement
- 📱 **Mobile responsive** - Works on all devices
- ♿ **Accessible** - Keyboard navigation, ARIA labels

---

## 📋 **Toast Notification System**

Reusable toast system for all notifications:
- 🎨 **5 types**: info, success, warning, error, cookie
- ⏱️ **Auto-dismiss** - Configurable duration
- 🔘 **Action buttons** - Custom callbacks
- 📚 **Stackable** - Multiple toasts supported
- 🎭 **Smooth animations** - Fade in/out
- 📍 **Center-bottom** - Non-blocking placement

---

## 🎯 **How It Works**

### **First Visit Flow:**

1. User lands on site
2. After 1s delay, cookie consent toast appears
3. Toast shows for 10 seconds
4. If no action: **Auto-rejects all non-essential cookies**
5. User can click "Manage preferences" for detailed settings

### **Consent Options:**

1. **Reject All** (Default after 10s)
   - Only necessary cookies
   - No language/theme persistence
   - No analytics/marketing

2. **Accept Necessary Only**
   - Same as Reject All
   - Explicit user choice

3. **Accept All**
   - All cookie categories
   - Full functionality

4. **Custom** (via "Manage preferences")
   - Granular control per category
   - Saved preferences

---

## 🍪 **Cookie Categories**

### **1. Necessary** (Always Enabled)
- `bunz-cookie-consent` - Stores consent choice
- `bunz-cookie-preferences` - Stores detailed preferences
- **Required for**: Basic site functionality

### **2. Functional** (Optional)
- `bunz-lang` - Language preference
- `session` - User session
- **Required for**: Remember your settings

### **3. Analytics** (Optional)
- (None currently)
- **Required for**: Site improvement

### **4. Marketing** (Optional)
- (None currently)
- **Required for**: Personalized ads

---

## 💻 **Usage**

### **Show Cookie Consent Toast:**
```javascript
// Automatic on first visit
// Or manually:
bunzCookies.showConsentToast();
```

### **Reset Consent (User Profile):**
```javascript
// Dashboard card or button
bunzCookies.resetConsent();
```

### **Check if Category Allowed:**
```javascript
if (bunzCookies.isAllowed('functional')) {
  // Save language preference
  localStorage.setItem('bunz-lang', 'no');
}
```

### **Get Current Preferences:**
```javascript
const prefs = bunzCookies.getPreferences();
// { necessary: true, functional: false, analytics: false, marketing: false }
```

---

## 🎨 **Toast API**

### **Show Toast:**
```javascript
bunzToast.show({
  message: 'Your data has been saved!',
  type: 'success',  // info, success, warning, error, cookie
  duration: 5000,   // ms (0 = persistent)
  actions: [
    {
      label: 'Undo',
      primary: false,
      callback: () => console.log('Undo clicked')
    },
    {
      label: 'View',
      primary: true,
      callback: () => window.location = '/view'
    }
  ],
  onDismiss: () => console.log('Toast dismissed')
});
```

### **Quick Helpers:**
```javascript
bunzToast.info('Information message');
bunzToast.success('Success!');
bunzToast.warning('Warning message');
bunzToast.error('Error occurred');
```

### **Dismiss Toasts:**
```javascript
// Dismiss specific toast
bunzToast.dismiss(toastId);

// Dismiss all
bunzToast.dismissAll();
```

---

## 🎯 **User Flow**

### **Scenario 1: Passive User**
```
1. Visit site
2. See cookie toast (10s)
3. Do nothing
4. Auto-reject → Only necessary cookies
5. Site works, but no preferences saved
```

### **Scenario 2: Active User (Accept All)**
```
1. Visit site
2. See cookie toast
3. Click "Accept All"
4. All cookies allowed
5. Language, theme, etc. persist
```

### **Scenario 3: Privacy-Conscious User**
```
1. Visit site
2. See cookie toast
3. Click "Manage preferences"
4. Enable only "Functional" cookies
5. Language persists, no analytics
```

### **Scenario 4: Change Mind Later**
```
1. Go to Dashboard
2. Click "Cookie Preferences" card
3. Toast appears again
4. Click "Accept Necessary Only"
5. Preferences updated
```

---

## 🔒 **GDPR Compliance**

### **✅ Requirements Met:**

1. **Informed Consent**
   - ✅ Clear explanation of what cookies do
   - ✅ Link to manage preferences
   - ✅ Granular control per category

2. **Opt-In Required**
   - ✅ Default: Reject all non-essential
   - ✅ No pre-checked boxes
   - ✅ Explicit user action required

3. **Easy to Withdraw**
   - ✅ Dashboard "Cookie Preferences" card
   - ✅ Same UI as initial consent
   - ✅ Changes apply immediately

4. **Audit Trail**
   - ✅ Timestamp stored with preferences
   - ✅ Can log consent changes (add to backend)

5. **Accessibility**
   - ✅ Keyboard navigable
   - ✅ Screen reader friendly
   - ✅ Clear labels and descriptions

---

## 📱 **Mobile Experience**

### **Optimized for Mobile:**
- Toast width: 95% on mobile vs 90% on desktop
- Full-width action buttons on mobile
- Touch-friendly hit targets
- No horizontal scroll

---

## 🎨 **Styling**

### **Toast Colors:**
- **Info**: Blue border (`--info`)
- **Success**: Green border (`--success`)
- **Warning**: Yellow/orange border (`--warning`)
- **Error**: Red border (`--danger`)
- **Cookie**: Orange border with gradient background

### **Customization:**
All toast styles use CSS variables, easy to customize:
```css
:root {
  --info: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
}
```

---

## 🧪 **Testing**

### **Test Cookie Consent:**
```javascript
// Reset to see consent again
localStorage.removeItem('bunz-cookie-consent');
localStorage.removeItem('bunz-cookie-preferences');
location.reload();
```

### **Test Auto-Reject:**
```javascript
// Should auto-reject after 10s
// Watch console for: "⏱️ Auto-rejecting cookies after 10s timeout"
```

### **Test Preferences Persistence:**
```javascript
// Accept functional cookies
// Set language to Norwegian
// Reload page
// Should still be Norwegian
```

---

## 📊 **Events**

### **Listen for Consent Changes:**
```javascript
document.addEventListener('bunz:cookie-consent-shown', () => {
  console.log('Cookie consent shown');
});

document.addEventListener('bunz:cookie-consent-changed', (e) => {
  console.log('Preferences changed:', e.detail.preferences);
});

document.addEventListener('bunz:toast-shown', (e) => {
  console.log('Toast shown:', e.detail);
});

document.addEventListener('bunz:toast-dismissed', (e) => {
  console.log('Toast dismissed:', e.detail.id);
});
```

---

## 🎯 **Best Practices**

1. **Don't Block Functionality**
   - Site should work with only necessary cookies
   - Gracefully degrade if functional cookies rejected

2. **Respect User Choice**
   - Check `bunzCookies.isAllowed()` before setting cookies
   - Don't nag users to accept cookies

3. **Clear Communication**
   - Explain what each category does
   - Be transparent about data collection

4. **Easy Access**
   - Cookie preferences in user profile/dashboard
   - Clear labeling ("Cookie Preferences")

5. **Privacy First**
   - Default to reject all
   - Auto-reject if no action
   - Make it easy to reject

---

## 📚 **Files Added**

### **Modules:**
- `/bunz/bunz-toast.js` - Toast notification system (144 lines)
- `/bunz/bunz-cookies.js` - GDPR cookie consent (327 lines)

### **Styles:**
- Added to `style.css`:
  - Toast container & animations (~150 lines)
  - Cookie settings modal (~50 lines)
  - Mobile responsive styles

### **Integration:**
- `app.html` - Loads toast & cookies modules
- `dashboard.htx` - Cookie preferences card

---

## 🎉 **Summary**

BUNZ now has:
- ✅ **GDPR-compliant** cookie consent
- ✅ **Privacy-first** (default reject)
- ✅ **Auto-reject** after 10s
- ✅ **Toast system** for all notifications
- ✅ **Granular control** per category
- ✅ **User-friendly** UI
- ✅ **Mobile responsive**
- ✅ **Accessible**

**Total addition: ~470 lines of well-documented code!** 🚀

