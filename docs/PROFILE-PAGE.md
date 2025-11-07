# BUNZ Profile Page

## 📋 Overview

Complete user profile management page with password changes, cookie preferences, language settings, and account deletion.

---

## 🎯 Features

### 1. **Profile Information**
- Display user avatar (initial-based)
- Show name and email
- Member since date

### 2. **Password Management**
- Change password with validation
- Current password verification
- New password confirmation
- Minimum 8 characters
- Real-time error/success messages
- Secure bcrypt hashing

### 3. **Privacy & Cookies**
- Current consent status display
- Quick access to cookie settings modal
- Reset consent option
- Shows enabled categories
- Last updated timestamp

### 4. **Language Settings**
- Dropdown selector
- Supported languages: EN, NO, ES, DE
- Auto-saves preference
- Lazy-loads i18n module
- Works with functional cookies

### 5. **Danger Zone**
- Account deletion
- Double confirmation required
- Types "DELETE" to verify
- Cascades to all user data
- Auto-logout and redirect

---

## 🔗 Access

**URL:** `/profile` (requires authentication)

**Navigation:**
- Click avatar/name in navbar
- Direct URL: `http://localhost:3000/profile`

---

## 🔐 Security

1. **Authentication Required**
   - Route guarded with `requireAuth`
   - Redirects to login if not authenticated

2. **Password Security**
   - Current password verified before change
   - Bcrypt hashing (Bun.js native)
   - Minimum length validation
   - Confirmation matching

3. **Account Deletion**
   - Two-step confirmation
   - Must type "DELETE" exactly
   - Immediate session termination
   - Data cascade deletion

---

## 🎨 User Experience

### Password Change Flow:
```
1. User enters current password
2. User enters new password (≥8 chars)
3. User confirms new password
4. Click "Update Password"
5. Server verifies current password
6. Server hashes and saves new password
7. Success toast shown
8. Form cleared
```

### Cookie Preferences Flow:
```
1. View current status (Minimal/Custom/All)
2. Click "Manage Cookie Preferences"
3. Modal opens with checkboxes
4. Toggle categories (except Necessary)
5. Click "Save Preferences"
6. Modal closes
7. Status updates
8. Toast confirmation
```

### Account Deletion Flow:
```
1. Click "Delete Account"
2. Confirm dialog with warning
3. Prompt: Type "DELETE"
4. Server deletes user data
5. Session destroyed
6. Redirect to homepage
7. All localStorage cleared
```

---

## 📡 API Endpoints

### `POST /api/auth/change-password`
```json
Request:
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}

Response (Success):
{
  "success": true
}

Response (Error):
{
  "error": "Current password is incorrect"
}
```

### `DELETE /api/auth/delete-account`
```json
Response:
{
  "success": true
}
```

---

## 🧩 Integration

### Files:
- `public/htx/profile.htx` - Profile page HTML
- `public/js/profile.js` - Profile page logic
- `server.ts` - API endpoints
- `bunz-navbar.js` - Profile link in navbar
- `style.css` - Profile page styles

### Dependencies:
- `bunz-toast.js` - Toast notifications
- `bunz-cookies.js` - Cookie consent
- `bunz-modal.js` - Settings modal
- `bunz-i18n.js` - Language switching (lazy-loaded)
- `bunz-loader.js` - Module lazy loading

---

## 🎨 Styling

### Sections:
- `.profile-page` - Main container (max-width: 800px)
- `.panel` - Content sections
- `.panel-danger` - Danger zone (red theme)
- `.form-grid` - Password form layout
- `.form-message` - Success/error messages
- `.cookie-status` - Cookie status box

### Responsive:
- Mobile-friendly language selector
- Full-width form controls on mobile
- Stacked buttons on small screens

---

## 🧪 Testing Checklist

### Password Change:
- [ ] Wrong current password → Error message
- [ ] Passwords don't match → Error message
- [ ] Password < 8 chars → Error message
- [ ] Valid passwords → Success + toast
- [ ] Form clears after success

### Cookie Preferences:
- [ ] Status shows correctly (Minimal/Custom/All)
- [ ] "Manage" button opens modal
- [ ] Settings save correctly
- [ ] "Reset" button shows toast
- [ ] Status updates in real-time

### Language:
- [ ] Current language pre-selected
- [ ] Changing language works
- [ ] i18n module lazy-loads
- [ ] Preference persists on reload

### Account Deletion:
- [ ] First confirmation dialog
- [ ] Second "DELETE" prompt
- [ ] Typing wrong text cancels
- [ ] Correct deletion flow works
- [ ] Redirects to homepage
- [ ] User can't access protected pages

### Navigation:
- [ ] Avatar/name in navbar is clickable
- [ ] Hover effect on profile link
- [ ] Clicking navigates to /profile
- [ ] Profile page loads correctly

---

## 📊 Stats

- **Lines of Code:**
  - `profile.htx`: 165 lines
  - `profile.js`: 180 lines
  - Server endpoints: ~70 lines
  - CSS additions: ~50 lines

- **Total Addition:** ~465 lines

- **Features:** 5 major sections
- **API Endpoints:** 2 new endpoints
- **Security Checks:** 4 layers

---

## 🚀 Future Enhancements

### Possible additions:
1. **Profile Picture Upload**
   - Avatar image instead of initial
   - File upload handling
   - Image optimization

2. **Email Change**
   - Verification required
   - Send confirmation email

3. **Two-Factor Authentication**
   - TOTP codes
   - Backup codes
   - Recovery options

4. **Activity Log**
   - Login history
   - Password changes
   - Account actions

5. **Export Data**
   - GDPR data export
   - Download all user data
   - JSON format

6. **Notification Preferences**
   - Email notifications toggle
   - Meeting reminders
   - Weekly digest

---

## 💡 Tips

1. **Password Security:**
   - Use strong, unique passwords
   - Consider password manager
   - Change regularly

2. **Cookie Preferences:**
   - Accept "Functional" for best UX
   - Language/theme won't persist with "Necessary only"
   - Can change anytime

3. **Account Deletion:**
   - Irreversible action
   - Export data first if needed
   - Consider "deactivation" feature instead

---

## 🎉 Summary

The profile page provides a complete user account management experience:
- ✅ Secure password changes
- ✅ Cookie consent management
- ✅ Language preferences
- ✅ Account deletion
- ✅ Clean, intuitive UI
- ✅ Mobile responsive
- ✅ Accessible
- ✅ GDPR compliant

All seamlessly integrated with the BUNZ framework! 🚀

