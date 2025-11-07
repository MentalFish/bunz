import { test, expect } from '@playwright/test';

test.describe('Quick Functionality Test', () => {
    test('homepage loads and shows content', async ({ page }) => {
        // Navigate to homepage
        await page.goto('http://localhost:3000/');
        
        // Wait for page to load (should NOT stay on "Loading...")
        await page.waitForSelector('.loading-screen', { state: 'hidden', timeout: 5000 });
        
        // Check that actual content loaded
        const content = await page.textContent('body');
        expect(content).toContain('Welcome to BUNZ');
        
        console.log('✅ Homepage loaded successfully');
    });
    
    test('login modal opens', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.waitForSelector('.loading-screen', { state: 'hidden', timeout: 5000 });
        
        // Click login button
        await page.click('button:has-text("Login")');
        
        // Wait for modal to appear
        await page.waitForSelector('#bunz-modal.active', { timeout: 3000 });
        
        // Check modal contains login form
        const modal = await page.locator('#bunz-modal');
        await expect(modal).toContainText('Welcome');
        await expect(modal).toContainText('Sign in');
        
        console.log('✅ Login modal opens successfully');
    });
    
    test('login form tabs work', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.waitForSelector('.loading-screen', { state: 'hidden', timeout: 5000 });
        
        // Open login modal
        await page.click('button:has-text("Login")');
        await page.waitForSelector('#bunz-modal.active', { timeout: 3000 });
        
        // Check login tab is active
        await expect(page.locator('#login-tab')).toHaveClass(/active/);
        
        // Click signup tab
        await page.click('.tab-btn[data-tab="signup"]');
        
        // Check signup tab is now active
        await expect(page.locator('#signup-tab')).toHaveClass(/active/);
        await expect(page.locator('#login-tab')).not.toHaveClass(/active/);
        
        console.log('✅ Tab switching works');
    });
    
    test('console has no critical errors', async ({ page }) => {
        const errors: string[] = [];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.goto('http://localhost:3000/');
        await page.waitForSelector('.loading-screen', { state: 'hidden', timeout: 5000 });
        
        // Filter out known acceptable errors
        const criticalErrors = errors.filter(err => 
            !err.includes('favicon') && 
            !err.includes('Extension')
        );
        
        if (criticalErrors.length > 0) {
            console.log('❌ Console errors found:', criticalErrors);
        }
        
        expect(criticalErrors.length).toBe(0);
        console.log('✅ No critical console errors');
    });
});

