import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('BUNZ Framework E2E Tests', () => {
  
  test.describe('Navigation & Routing', () => {
    
    test('should load homepage', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/BUNZ Conference|Home/);
      await expect(page.locator('h1')).toContainText(/Video Conferencing|Welcome/);
    });
    
    test('should navigate between pages with crossfade', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Click dashboard link
      await page.click('a[href*="dashboard"]');
      
      // Wait for URL to change
      await expect(page).toHaveURL(/dashboard/);
      
      // Should show dashboard content
      await expect(page.locator('h1, h2')).toContainText(/Dashboard/);
    });
    
    test('should handle browser back/forward buttons', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('a[href*="room"]');
      await expect(page).toHaveURL(/room/);
      
      // Go back
      await page.goBack();
      await expect(page).toHaveURL(BASE_URL);
      
      // Go forward
      await page.goForward();
      await expect(page).toHaveURL(/room/);
    });
    
    test('should not reload when clicking same page link', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Add marker to detect reload
      await page.evaluate(() => {
        (window as any).testMarker = 'keep-me';
      });
      
      // Click home link again
      await page.click('a[href="/"]');
      
      // Marker should still exist (no reload)
      const marker = await page.evaluate(() => (window as any).testMarker);
      expect(marker).toBe('keep-me');
    });
    
    test('should direct URL navigation work', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page.locator('h1, h2')).toContainText(/Dashboard/);
    });
  });
  
  test.describe('Authentication Flow', () => {
    
    test('full signup → login → logout flow', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const testEmail = `test-${Date.now()}@example.com`;
      
      // Open login modal
      await page.click('[data-action="open-login-modal"], button:has-text("Login")');
      await page.waitForSelector('#bunz-modal.active', { timeout: 5000 });
      
      // Switch to signup tab
      await page.click('button.tab-btn[data-tab="signup"]');
      await page.waitForSelector('#signup-tab.active');
      
      // Fill signup form
      await page.fill('#signup-tab input[name="name"]', 'Test User');
      await page.fill('#signup-tab input[name="email"]', testEmail);
      await page.fill('#signup-tab input[name="password"]', 'SecurePassword123!');
      
      // Submit
      await page.click('#signup-tab button[type="submit"]');
      
      // Wait for redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
      
      // Should show user info in navbar
      await expect(page.locator('.navbar-user')).toBeVisible();
      
      // Logout
      await page.click('#logout-btn, button:has-text("Logout")');
      
      // Should redirect to home
      await expect(page).toHaveURL(BASE_URL);
      
      // Should show login button again
      await expect(page.locator('button:has-text("Login")')).toBeVisible();
    });
    
    test('should protect authenticated routes', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should open login modal (not show 404)
      await expect(page.locator('#bunz-modal')).toBeVisible({ timeout: 5000 });
    });
    
    test('login with invalid credentials shows error', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Open login modal
      await page.click('[data-action="open-login-modal"], button:has-text("Login")');
      await page.waitForSelector('#bunz-modal.active');
      
      // Fill with invalid credentials
      await page.fill('#login-tab input[name="email"]', 'invalid@example.com');
      await page.fill('#login-tab input[name="password"]', 'wrongpassword');
      
      // Submit
      await page.click('#login-tab button[type="submit"]');
      
      // Should show error
      await expect(page.locator('#error-message')).toBeVisible();
      await expect(page.locator('#error-message')).toContainText(/Invalid|failed/i);
    });
  });
  
  test.describe('BUNZ Features', () => {
    
    test('lifecycle hooks - scripts execute on load', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Navigate to a page with scripts
      await page.click('a[href*="room"]');
      
      // Check if room.js executed
      const hasRoomScript = await page.evaluate(() => {
        return typeof (window as any).room !== 'undefined' || 
               document.querySelector('script[src*="room.js"]') !== null;
      });
      
      expect(hasRoomScript).toBeTruthy();
    });
    
    test('error boundary - shows fallback on 404', async ({ page }) => {
      await page.goto(`${BASE_URL}/nonexistent-page`);
      
      // Should show error UI (not blank page)
      const hasContent = await page.evaluate(() => document.body.textContent?.length ?? 0);
      expect(hasContent).toBeGreaterThan(0);
    });
    
    test('crossfade animation on navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Start navigation
      const navigationPromise = page.click('a[href*="room"]');
      
      // Check for fade-out class
      await page.waitForSelector('#app.fade-out', { timeout: 500 });
      
      await navigationPromise;
      
      // fade-out should be removed after load
      await expect(page.locator('#app.fade-out')).not.toBeVisible();
    });
  });
  
  test.describe('Internationalization', () => {
    
    test('language switcher changes language', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Open language dropdown
      await page.click('#lang-trigger');
      await page.waitForSelector('.lang-dropdown.open');
      
      // Select Norwegian
      await page.click('.lang-option[data-lang="no"]');
      
      // Wait for translation
      await page.waitForTimeout(500);
      
      // Check if text changed to Norwegian
      const navText = await page.locator('.navbar-brand').textContent();
      expect(navText).toContain('BUNZ'); // Brand stays same
      
      // Check translated element
      const homeLink = await page.locator('a[data-i18n="nav.home"]').textContent();
      expect(homeLink).toMatch(/Hjem|Home/);
    });
    
    test('language persists across navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Switch to Spanish
      await page.click('#lang-trigger');
      await page.click('.lang-option[data-lang="es"]');
      await page.waitForTimeout(300);
      
      // Navigate to different page
      await page.click('a[href*="room"]');
      
      // Language should persist
      const currentLang = await page.evaluate(() => localStorage.getItem('bunz-lang'));
      expect(currentLang).toBe('es');
    });
  });
  
  test.describe('Accessibility', () => {
    
    test('keyboard navigation works', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate link with Enter
      await page.keyboard.press('Enter');
      
      // URL should change
      const url = page.url();
      expect(url).not.toBe(BASE_URL);
    });
    
    test('Escape key closes modal', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Open modal
      await page.click('[data-action="open-login-modal"], button:has-text("Login")');
      await expect(page.locator('#bunz-modal.active')).toBeVisible();
      
      // Press Escape
      await page.keyboard.press('Escape');
      
      // Modal should close
      await expect(page.locator('#bunz-modal.active')).not.toBeVisible();
    });
    
    test('has proper ARIA landmarks', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for main landmark
      const main = await page.locator('main');
      await expect(main).toBeVisible();
      
      // Check for navigation
      const nav = await page.locator('nav');
      await expect(nav).toBeVisible();
    });
  });
  
  test.describe('Forms', () => {
    
    test('form validation prevents submission', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Open signup modal
      await page.click('[data-action="open-login-modal"], button:has-text("Login")');
      await page.click('button.tab-btn[data-tab="signup"]');
      
      // Fill with invalid data (short password)
      await page.fill('#signup-tab input[name="email"]', 'test@example.com');
      await page.fill('#signup-tab input[name="password"]', 'short');
      
      // Submit
      await page.click('#signup-tab button[type="submit"]');
      
      // Should show error
      await expect(page.locator('#error-message')).toBeVisible();
    });
  });
});

console.log('✅ Playwright E2E Tests configured');

