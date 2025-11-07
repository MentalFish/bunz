# BUNZ Testing Guide

## 🧪 Comprehensive Testing Suite

BUNZ includes a full-featured testing suite that covers API endpoints, E2E user flows, and performance audits using Bun, Playwright, and Lighthouse.

---

## 📦 Test Structure

```
tests/
├── api/                    # API & Backend tests (Bun)
│   └── auth.test.ts       # Authentication endpoints
├── e2e/                    # End-to-end tests (Playwright)
│   └── bunz.spec.ts       # Full user flows
├── performance/            # Performance tests (Lighthouse)
│   └── lighthouse.test.ts # Lighthouse audits
└── run-all.ts             # Master test runner
```

---

## 🚀 Running Tests

### All Tests (Full Suite)
```bash
bun test
# or
bun run test
```

### Individual Test Suites

#### API Tests Only
```bash
bun run test:api
```

#### E2E Tests Only
```bash
bun run test:e2e
```

#### Lighthouse Audit Only
```bash
bun run test:lighthouse
```

#### Playwright UI Mode (Interactive)
```bash
bun run test:ui
```

#### View Playwright Report
```bash
bun run test:report
```

---

## 📊 Test Reports

### State of the Bunz Report
After running `bun test`, open the comprehensive HTML report:
```bash
open test-results/state-of-the-bunz.html
```

This report includes:
- ✅ Pass/fail status for all test suites
- ⏱️ Duration for each suite
- 📈 Overall test health
- 🎨 Beautiful HTML dashboard

### Playwright Report
```bash
bun run test:report
```

### Lighthouse JSON Report
```
lighthouse-report.json
```

---

## 🧪 Test Coverage

### 1. API Tests (`tests/api/auth.test.ts`)

**Authentication Endpoints:**
- ✅ POST `/api/auth/sign-up` - User registration
- ✅ POST `/api/auth/sign-in` - User login
- ✅ GET `/api/me` - Get current user
- ✅ POST `/api/logout` - Logout

**Test Cases:**
- Valid signup with strong password
- Duplicate email rejection
- Weak password rejection
- Valid login
- Invalid credentials rejection
- Session management
- Logout functionality

**Example:**
```typescript
test("POST /api/auth/sign-up - creates new user", async () => {
  const response = await fetch(`${BASE_URL}/api/auth/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `test@example.com`,
      password: "SecurePassword123!",
      name: "Test User"
    })
  });
  
  expect(response.status).toBe(200);
});
```

---

### 2. E2E Tests (`tests/e2e/bunz.spec.ts`)

**User Flows:**
- 🔄 Navigation & Routing
  - Page loading
  - Client-side navigation
  - Browser back/forward
  - Direct URL navigation
  - Duplicate navigation prevention

- 🔐 Authentication
  - Full signup → login → logout flow
  - Protected route guards
  - Invalid credentials handling
  - Session persistence

- ⚙️ BUNZ Features
  - Lifecycle hooks
  - Script execution
  - Error boundaries
  - Crossfade animations

- 🌍 Internationalization
  - Language switcher
  - Language persistence
  - Translation loading

- ♿ Accessibility
  - Keyboard navigation
  - Escape key modal closing
  - ARIA landmarks
  - Focus management

- 📝 Forms
  - Form validation
  - Error display

**Example:**
```typescript
test('full signup → login → logout flow', async ({ page }) => {
  await page.goto(BASE_URL);
  
  // Open modal
  await page.click('button:has-text("Login")');
  
  // Fill form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePassword123!');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify redirect
  await expect(page).toHaveURL(/dashboard/);
});
```

---

### 3. Lighthouse Audits (`tests/performance/lighthouse.test.ts`)

**Metrics:**
- 🎯 Performance Score (target: 85+)
- ♿ Accessibility Score (target: 90+)
- ✅ Best Practices Score (target: 85+)
- 🔍 SEO Score (target: 85+)
- 📱 PWA Score (target: 50+)

**Core Web Vitals:**
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TBT** (Total Blocking Time)
- **CLS** (Cumulative Layout Shift)
- **SI** (Speed Index)

**Pages Tested:**
- `/` - Homepage
- `/dashboard` - Dashboard (authenticated)
- `/room/lobby` - Video room

**Example Output:**
```
📊 Results for /:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Performance:    ✅ 92/100
  Accessibility:  ✅ 95/100
  Best Practices: ✅ 88/100
  SEO:            ✅ 90/100
  PWA:            ✅ 60/100

  Core Web Vitals:
  FCP: 0.8s
  LCP: 1.2s
  TBT: 50ms
  CLS: 0.02
  SI: 1.5s
```

---

## 🔧 Configuration Files

### `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run server.ts',
    url: 'http://localhost:3000',
  },
});
```

### `package.json` Scripts
```json
{
  "scripts": {
    "test": "bun run tests/run-all.ts",
    "test:api": "bun test tests/api",
    "test:e2e": "bunx playwright test",
    "test:lighthouse": "bun run tests/performance/lighthouse.test.ts",
    "test:ui": "bunx playwright test --ui",
    "test:report": "bunx playwright show-report"
  }
}
```

---

## 🎯 CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request to `main`

**Workflow:** `.github/workflows/test.yml`

**Features:**
- ✅ Runs all test suites
- 📦 Uploads test reports as artifacts
- 💬 Comments on PRs with test results
- ⏱️ 30-day report retention

**Example PR Comment:**
```
## 🚀 State of the Bunz

**Status**: ✅ PASSED
**Duration**: 45.32s

### Test Suites
- ✅ API Tests: PASSED (8.12s)
- ✅ E2E Tests: PASSED (28.50s)
- ✅ Lighthouse Audit: PASSED (8.70s)

[View full report](https://github.com/your-repo/actions/runs/12345)
```

---

## 📝 Writing New Tests

### API Test Template
```typescript
import { describe, test, expect } from "bun:test";

describe("My API", () => {
  test("should do something", async () => {
    const response = await fetch("http://localhost:3000/api/endpoint");
    expect(response.status).toBe(200);
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test('my feature works', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('button');
  await expect(page).toHaveURL(/expected/);
});
```

---

## 🐛 Debugging

### Playwright Debug Mode
```bash
bunx playwright test --debug
```

### Headed Mode (See browser)
```bash
bunx playwright test --headed
```

### Specific Test
```bash
bunx playwright test tests/e2e/bunz.spec.ts:42
```

### Playwright Inspector
```bash
PWDEBUG=1 bunx playwright test
```

---

## 📊 Thresholds & Expectations

### API Tests
- All endpoints must return correct status codes
- Session management must work correctly
- Error handling must be consistent

### E2E Tests
- All user flows must complete successfully
- No console errors
- Proper navigation and routing

### Lighthouse
```typescript
const THRESHOLDS = {
  performance: 85,
  accessibility: 90,
  bestPractices: 85,
  seo: 85,
  pwa: 50
};
```

---

## 🔥 Best Practices

1. **Run tests before committing**
   ```bash
   bun test
   ```

2. **Run E2E tests in UI mode during development**
   ```bash
   bun run test:ui
   ```

3. **Check Lighthouse scores regularly**
   ```bash
   bun run test:lighthouse
   ```

4. **Keep test data isolated**
   - Use unique emails with timestamps
   - Clean up after tests if needed

5. **Write descriptive test names**
   ```typescript
   test('user can login with valid credentials', async () => {
     // ...
   });
   ```

6. **Use page objects for complex flows**
   ```typescript
   class LoginPage {
     async login(email: string, password: string) {
       await this.page.fill('input[name="email"]', email);
       await this.page.fill('input[name="password"]', password);
       await this.page.click('button[type="submit"]');
     }
   }
   ```

---

## 🎉 Success Criteria

Your BUNZ app is in great shape when:
- ✅ All API tests pass
- ✅ All E2E tests pass
- ✅ Lighthouse scores above thresholds
- ✅ No console errors in browser
- ✅ All features work as expected

**Run `bun test` and aim for 100% green! 🚀**

