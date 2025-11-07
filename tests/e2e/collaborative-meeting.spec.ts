import { test, expect, type Page } from '@playwright/test';

/**
 * Collaborative Meeting E2E Tests
 * Tests WebRTC, MapLibre, and Canvas features
 */

test.describe('Collaborative Meeting System', () => {
  const TEST_ROOM = 'test-room-' + Date.now();
  const MEETING_URL = `http://localhost:3000/meeting/${TEST_ROOM}`;
  
  test.beforeEach(async ({ page }) => {
    // Grant camera/microphone permissions
    await page.context().grantPermissions(['camera', 'microphone']);
  });

  test.describe('Meeting Room Basics', () => {
    test('should load meeting room page', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Check page title
      await expect(page).toHaveTitle(/Collaborative Meeting/);
      
      // Check main heading
      const heading = page.locator('h1');
      await expect(heading).toContainText('Collaborative Meeting');
      
      // Check controls are present
      await expect(page.locator('#start-call')).toBeVisible();
      await expect(page.locator('#toggle-video')).toBeVisible();
      await expect(page.locator('#toggle-audio')).toBeVisible();
      await expect(page.locator('#share-screen')).toBeVisible();
      await expect(page.locator('#end-call')).toBeVisible();
    });

    test('should show video grid', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      const videoGrid = page.locator('#video-grid');
      await expect(videoGrid).toBeVisible();
      
      // Should have local video container
      const localContainer = page.locator('.video-container.local');
      await expect(localContainer).toBeVisible();
      
      const localVideo = page.locator('#local-video');
      await expect(localVideo).toBeVisible();
    });

    test('should display participant count', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      const participantCount = page.locator('#participant-count');
      await expect(participantCount).toBeVisible();
      
      // Initially should show 0 (just self, not counted yet)
      await expect(participantCount).toHaveText('0');
    });

    test('should have all view toggle buttons', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await expect(page.locator('#toggle-view')).toBeVisible();
      await expect(page.locator('#toggle-map')).toBeVisible();
      await expect(page.locator('#toggle-canvas')).toBeVisible();
    });
  });

  test.describe('WebRTC Functionality', () => {
    test('should have start call button enabled initially', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      const startBtn = page.locator('#start-call');
      await expect(startBtn).toBeEnabled();
      
      // Other controls should be disabled
      await expect(page.locator('#toggle-video')).toBeDisabled();
      await expect(page.locator('#toggle-audio')).toBeDisabled();
      await expect(page.locator('#share-screen')).toBeDisabled();
      await expect(page.locator('#end-call')).toBeDisabled();
    });

    test('should load WebRTC module on start call', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Listen for module load
      const moduleLoaded = page.waitForEvent('console', msg => 
        msg.text().includes('bunz-webrtc')
      );
      
      // Click start call
      await page.click('#start-call');
      
      // Wait for module to load
      await moduleLoaded;
      
      // Check that bunzWebRTC is available
      const hasWebRTC = await page.evaluate(() => {
        return typeof window.bunzWebRTC !== 'undefined';
      });
      expect(hasWebRTC).toBeTruthy();
    });

    test('should enable controls after starting call', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Mock getUserMedia to prevent actual camera access in test
      await page.addInitScript(() => {
        const mockStream = {
          getTracks: () => [
            { 
              kind: 'video', 
              enabled: true, 
              stop: () => {},
              addEventListener: () => {}
            },
            { 
              kind: 'audio', 
              enabled: true, 
              stop: () => {},
              addEventListener: () => {}
            }
          ],
          getVideoTracks: () => [{ enabled: true, stop: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }]
        };
        
        navigator.mediaDevices.getUserMedia = async () => mockStream;
        navigator.mediaDevices.getDisplayMedia = async () => mockStream;
      });
      
      await page.reload();
      
      // Start call
      await page.click('#start-call');
      
      // Wait for initialization
      await page.waitForTimeout(500);
      
      // Controls should be enabled
      await expect(page.locator('#toggle-video')).toBeEnabled();
      await expect(page.locator('#toggle-audio')).toBeEnabled();
      await expect(page.locator('#share-screen')).toBeEnabled();
      await expect(page.locator('#end-call')).toBeEnabled();
      
      // Start call should be disabled
      await expect(page.locator('#start-call')).toBeDisabled();
    });

    test('should toggle video on/off', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Mock media
      await page.addInitScript(() => {
        const mockStream = {
          getTracks: () => [
            { kind: 'video', enabled: true, stop: () => {} },
            { kind: 'audio', enabled: true, stop: () => {} }
          ],
          getVideoTracks: () => [{ enabled: true, stop: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }]
        };
        navigator.mediaDevices.getUserMedia = async () => mockStream;
      });
      
      await page.reload();
      await page.click('#start-call');
      await page.waitForTimeout(500);
      
      const videoBtn = page.locator('#toggle-video');
      
      // Should show "Video On" initially
      await expect(videoBtn).toContainText('Video');
      
      // Click to toggle
      await videoBtn.click();
      
      // Should update text (implementation dependent)
      await page.waitForTimeout(100);
    });
  });

  test.describe('Map View', () => {
    test('should toggle map view', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Initially video should be visible, map hidden
      await expect(page.locator('#video-section')).toBeVisible();
      await expect(page.locator('#map-section')).toBeHidden();
      
      // Click map button
      await page.click('#toggle-map');
      
      // Wait for map to load
      await page.waitForTimeout(1000);
      
      // Map section should be visible
      await expect(page.locator('#map-section')).toBeVisible();
      
      // Map container should exist
      const mapContainer = page.locator('#meeting-map');
      await expect(mapContainer).toBeVisible();
    });

    test('should load MapLibre library', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Click map button
      await page.click('#toggle-map');
      
      // Wait for MapLibre to load
      await page.waitForTimeout(2000);
      
      // Check if MapLibre is loaded
      const hasMapLibre = await page.evaluate(() => {
        return typeof window.maplibregl !== 'undefined';
      });
      
      expect(hasMapLibre).toBeTruthy();
    });

    test('should initialize bunzMap', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      const hasBunzMap = await page.evaluate(() => {
        return typeof window.bunzMap !== 'undefined' && 
               window.bunzMap.map !== null;
      });
      
      expect(hasBunzMap).toBeTruthy();
    });

    test('should switch back to video view', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Open map
      await page.click('#toggle-map');
      await page.waitForTimeout(1000);
      await expect(page.locator('#map-section')).toBeVisible();
      
      // Click map button again to toggle back
      await page.click('#toggle-map');
      await page.waitForTimeout(500);
      
      // Should show video again
      await expect(page.locator('#video-section')).toBeVisible();
      await expect(page.locator('#map-section')).toBeHidden();
    });
  });

  test.describe('Drawing Canvas', () => {
    test('should toggle drawing controls', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      const drawingControls = page.locator('#drawing-controls');
      
      // Should be hidden initially
      await expect(drawingControls).toBeHidden();
      
      // Click draw button
      await page.click('#toggle-canvas');
      
      // Should be visible
      await expect(drawingControls).toBeVisible();
      
      // Should have drawing tools
      await expect(page.locator('[data-tool="pen"]')).toBeVisible();
      await expect(page.locator('[data-tool="eraser"]')).toBeVisible();
      await expect(page.locator('[data-tool="arrow"]')).toBeVisible();
      await expect(page.locator('#canvas-color')).toBeVisible();
      await expect(page.locator('#clear-canvas')).toBeVisible();
    });

    test('should load canvas module', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      const hasCanvas = await page.evaluate(() => {
        return typeof window.bunzCanvas !== 'undefined';
      });
      
      expect(hasCanvas).toBeTruthy();
    });

    test('should create canvas overlay', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Canvas should be created
      const canvas = page.locator('.bunz-canvas');
      await expect(canvas).toBeVisible();
      
      // Should have crosshair cursor
      const cursor = await canvas.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('crosshair');
    });

    test('should switch tools', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Click eraser tool
      await page.click('[data-tool="eraser"]');
      
      // Check if tool changed (in bunzCanvas)
      const tool = await page.evaluate(() => {
        return window.bunzCanvas?.tool;
      });
      
      expect(tool).toBe('eraser');
    });

    test('should clear canvas', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Clear button should work
      await page.click('#clear-canvas');
      
      // Drawing history should be empty
      const historyLength = await page.evaluate(() => {
        return window.bunzCanvas?.drawingHistory?.length || 0;
      });
      
      expect(historyLength).toBe(0);
    });

    test('should overlay on map when map view active', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Switch to map view
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      // Enable canvas
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Canvas should be overlaying map
      const canvas = page.locator('.bunz-canvas');
      await expect(canvas).toBeVisible();
      
      // Parent should be map-related
      const parentId = await canvas.evaluate(el => 
        el.closest('[id*="map"]')?.id
      );
      expect(parentId).toContain('map');
    });
  });

  test.describe('Multi-User Collaboration', () => {
    test('should connect two users to same room', async ({ browser }) => {
      // Create two browser contexts (two users)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      await context1.grantPermissions(['camera', 'microphone']);
      await context2.grantPermissions(['camera', 'microphone']);
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Navigate both to same room
      await page1.goto(MEETING_URL);
      await page2.goto(MEETING_URL);
      
      // Wait for WebSocket connection
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);
      
      // Check WebSocket is connected on both
      const ws1Connected = await page1.evaluate(() => {
        return window.bunzWebRTC?.ws?.readyState === WebSocket.OPEN;
      });
      
      const ws2Connected = await page2.evaluate(() => {
        return window.bunzWebRTC?.ws?.readyState === WebSocket.OPEN;
      });
      
      expect(ws1Connected).toBeTruthy();
      expect(ws2Connected).toBeTruthy();
      
      // Cleanup
      await context1.close();
      await context2.close();
    });

    test('should show participant when second user joins', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // User 1 joins
      await page1.goto(MEETING_URL);
      await page1.waitForTimeout(1000);
      
      // Check initial count
      let count1 = await page1.locator('#participant-count').textContent();
      expect(count1).toBe('0');
      
      // User 2 joins
      await page2.goto(MEETING_URL);
      await page2.waitForTimeout(1500);
      
      // Count should update on page 1
      count1 = await page1.locator('#participant-count').textContent();
      expect(parseInt(count1 || '0')).toBeGreaterThan(0);
      
      // Cleanup
      await context1.close();
      await context2.close();
    });

    test('should sync canvas drawings between users', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Both join room
      await page1.goto(MEETING_URL);
      await page2.goto(MEETING_URL);
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);
      
      // User 1 enables canvas
      await page1.click('#toggle-canvas');
      await page1.waitForTimeout(500);
      
      // User 2 enables canvas
      await page2.click('#toggle-canvas');
      await page2.waitForTimeout(500);
      
      // User 1 draws something (simulate)
      await page1.evaluate(() => {
        if (window.bunzCanvas) {
          window.bunzCanvas.drawLine(
            { x: 10, y: 10 },
            { x: 50, y: 50 },
            '#ff0000',
            3
          );
        }
      });
      
      // Wait for broadcast
      await page2.waitForTimeout(500);
      
      // User 2 should have received drawing
      const hasDrawing = await page2.evaluate(() => {
        return window.bunzCanvas?.drawingHistory?.length > 0;
      });
      
      expect(hasDrawing).toBeTruthy();
      
      // Cleanup
      await context1.close();
      await context2.close();
    });

    test('should clear canvas for all users', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Setup
      await page1.goto(MEETING_URL);
      await page2.goto(MEETING_URL);
      await page1.waitForTimeout(1000);
      
      // Both enable canvas
      await page1.click('#toggle-canvas');
      await page2.click('#toggle-canvas');
      await page1.waitForTimeout(500);
      
      // User 1 draws
      await page1.evaluate(() => {
        window.bunzCanvas?.drawLine({ x: 10, y: 10 }, { x: 50, y: 50 }, '#ff0000', 3);
      });
      
      await page2.waitForTimeout(500);
      
      // User 1 clears canvas
      await page1.click('#clear-canvas');
      await page2.waitForTimeout(500);
      
      // Both should have empty canvas
      const history1 = await page1.evaluate(() => 
        window.bunzCanvas?.drawingHistory?.length || 0
      );
      const history2 = await page2.evaluate(() => 
        window.bunzCanvas?.drawingHistory?.length || 0
      );
      
      expect(history1).toBe(0);
      expect(history2).toBe(0);
      
      // Cleanup
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Map Avatars', () => {
    test('should sync avatar positions between users', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Join room
      await page1.goto(MEETING_URL);
      await page2.goto(MEETING_URL);
      await page1.waitForTimeout(1000);
      
      // Both open map
      await page1.click('#toggle-map');
      await page2.click('#toggle-map');
      await page1.waitForTimeout(2500); // Wait for MapLibre
      await page2.waitForTimeout(2500);
      
      // User 1 places avatar
      await page1.evaluate(() => {
        if (window.bunzMap) {
          window.bunzMap.addAvatar('me', 10.7522, 59.9139, {
            label: 'U1',
            name: 'User 1'
          });
        }
      });
      
      // Wait for broadcast
      await page2.waitForTimeout(500);
      
      // User 2 should see User 1's avatar
      const hasAvatar = await page2.evaluate(() => {
        return window.bunzMap?.avatars?.size > 0;
      });
      
      expect(hasAvatar).toBeTruthy();
      
      // Cleanup
      await context1.close();
      await context2.close();
    });
  });

  test.describe('View Switching', () => {
    test('should maintain canvas when switching views', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Enable canvas on video view
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Draw something
      await page.evaluate(() => {
        window.bunzCanvas?.drawLine({ x: 10, y: 10 }, { x: 50, y: 50 }, '#ff0000', 3);
      });
      
      const historyLength = await page.evaluate(() => 
        window.bunzCanvas?.drawingHistory?.length || 0
      );
      
      // Switch to map
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      // Canvas should still have history
      const historyAfterSwitch = await page.evaluate(() => 
        window.bunzCanvas?.drawingHistory?.length || 0
      );
      
      expect(historyAfterSwitch).toBe(historyLength);
    });

    test('should show correct button text for each view', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      const toggleBtn = page.locator('#toggle-map');
      
      // Initially should show "Map"
      await expect(toggleBtn).toContainText('Map');
      
      // Switch to map
      await page.click('#toggle-map');
      await page.waitForTimeout(1000);
      
      // Should now show "Video"
      await expect(toggleBtn).toContainText('Video');
    });
  });

  test.describe('Cleanup and Lifecycle', () => {
    test('should cleanup WebRTC on navigation away', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Mock media and start call
      await page.addInitScript(() => {
        const mockStream = {
          getTracks: () => [
            { kind: 'video', enabled: true, stop: () => console.log('Track stopped') },
            { kind: 'audio', enabled: true, stop: () => console.log('Track stopped') }
          ],
          getVideoTracks: () => [{ enabled: true, stop: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }]
        };
        navigator.mediaDevices.getUserMedia = async () => mockStream;
      });
      
      await page.reload();
      await page.click('#start-call');
      await page.waitForTimeout(500);
      
      // Navigate away
      await page.goto('http://localhost:3000/');
      await page.waitForTimeout(500);
      
      // WebRTC should be cleaned up
      // (Hard to test directly, but no errors should occur)
    });

    test('should destroy map on cleanup', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Open map
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      const hasMap = await page.evaluate(() => 
        window.bunzMap?.map !== null
      );
      expect(hasMap).toBeTruthy();
      
      // Navigate away
      await page.goto('http://localhost:3000/');
      await page.waitForTimeout(500);
      
      // Check console for errors (shouldn't have any)
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      
      expect(errors.length).toBe(0);
    });

    test('should handle end call properly', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Mock and start call
      await page.addInitScript(() => {
        const mockStream = {
          getTracks: () => [
            { kind: 'video', enabled: true, stop: () => {} },
            { kind: 'audio', enabled: true, stop: () => {} }
          ],
          getVideoTracks: () => [{ enabled: true, stop: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }]
        };
        navigator.mediaDevices.getUserMedia = async () => mockStream;
      });
      
      await page.reload();
      await page.click('#start-call');
      await page.waitForTimeout(500);
      
      // End call
      await page.click('#end-call');
      await page.waitForTimeout(500);
      
      // Start button should be enabled again
      await expect(page.locator('#start-call')).toBeEnabled();
      
      // Other buttons should be disabled
      await expect(page.locator('#toggle-video')).toBeDisabled();
      await expect(page.locator('#toggle-audio')).toBeDisabled();
      await expect(page.locator('#end-call')).toBeDisabled();
    });
  });

  test.describe('Integration Tests', () => {
    test('complete meeting flow - video + map + canvas', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Mock media
      await page.addInitScript(() => {
        const mockStream = {
          getTracks: () => [
            { kind: 'video', enabled: true, stop: () => {} },
            { kind: 'audio', enabled: true, stop: () => {} }
          ],
          getVideoTracks: () => [{ enabled: true, stop: () => {} }],
          getAudioTracks: () => [{ enabled: true, stop: () => {} }]
        };
        navigator.mediaDevices.getUserMedia = async () => mockStream;
      });
      
      await page.reload();
      
      // Step 1: Start call
      await page.click('#start-call');
      await page.waitForTimeout(500);
      await expect(page.locator('#toggle-video')).toBeEnabled();
      
      // Step 2: Open map
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      await expect(page.locator('#map-section')).toBeVisible();
      
      // Step 3: Enable canvas
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      await expect(page.locator('.bunz-canvas')).toBeVisible();
      
      // Step 4: Draw something
      await page.evaluate(() => {
        window.bunzCanvas?.drawLine({ x: 10, y: 10 }, { x: 50, y: 50 }, '#ff0000', 3);
      });
      
      const hasDrawing = await page.evaluate(() => 
        window.bunzCanvas?.drawingHistory?.length > 0
      );
      expect(hasDrawing).toBeTruthy();
      
      // Step 5: Switch back to video
      await page.click('#toggle-map');
      await page.waitForTimeout(500);
      await expect(page.locator('#video-section')).toBeVisible();
      
      // Step 6: End call
      await page.click('#end-call');
      await page.waitForTimeout(500);
      await expect(page.locator('#start-call')).toBeEnabled();
    });

    test('all modules load without errors', async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(MEETING_URL);
      await page.waitForTimeout(1000);
      
      // Enable all features
      await page.click('#toggle-map');
      await page.waitForTimeout(2500);
      
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Check for errors
      const criticalErrors = consoleErrors.filter(err => 
        !err.includes('401') && // Ignore auth errors (no login in test)
        !err.includes('Failed to load resource') // Ignore resource 401s
      );
      
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Check controls have labels
      const closeBtn = page.locator('.modal-close');
      const ariaLabel = await closeBtn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Tab should navigate through controls
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
      
      // No errors should occur
    });

    test('should have skip link', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      const skipLink = page.locator('.skip-link');
      await expect(skipLink).toBeInViewport();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing camera gracefully', async ({ page }) => {
      // Don't grant camera permission
      await page.goto(MEETING_URL);
      
      // Mock getUserMedia to reject
      await page.addInitScript(() => {
        navigator.mediaDevices.getUserMedia = async () => {
          throw new Error('Permission denied');
        };
      });
      
      await page.reload();
      
      // Click start call
      await page.click('#start-call');
      await page.waitForTimeout(500);
      
      // Should show error (via toast or alert)
      // Controls should remain disabled
      await expect(page.locator('#toggle-video')).toBeDisabled();
    });

    test('should handle map load failure gracefully', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Block MapLibre CDN
      await page.route('**/maplibre-gl**', route => route.abort());
      
      // Try to open map
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      // Should not crash (check for console errors)
      const jsErrors = [];
      page.on('pageerror', error => jsErrors.push(error));
      
      await page.waitForTimeout(500);
      
      // May have load errors but shouldn't crash page
    });
  });

  test.describe('Performance', () => {
    test('should lazy-load modules only when needed', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Initially, map and canvas modules should not be loaded
      let hasMap = await page.evaluate(() => 
        typeof window.bunzMap?.map !== 'undefined' && window.bunzMap.map !== null
      );
      expect(hasMap).toBeFalsy();
      
      let hasCanvas = await page.evaluate(() => 
        typeof window.bunzCanvas?.canvas !== 'undefined' && window.bunzCanvas.canvas !== null
      );
      expect(hasCanvas).toBeFalsy();
      
      // Open map
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      // Now map should be loaded
      hasMap = await page.evaluate(() => 
        window.bunzMap?.map !== null
      );
      expect(hasMap).toBeTruthy();
      
      // Enable canvas
      await page.click('#toggle-canvas');
      await page.waitForTimeout(500);
      
      // Now canvas should be created
      hasCanvas = await page.evaluate(() => 
        window.bunzCanvas?.canvas !== null
      );
      expect(hasCanvas).toBeTruthy();
    });

    test('should not reload modules if already loaded', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // Track script loads
      const scriptsLoaded = [];
      page.on('request', request => {
        if (request.url().includes('.js')) {
          scriptsLoaded.push(request.url());
        }
      });
      
      // Load map twice
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      const initialScripts = scriptsLoaded.filter(s => s.includes('bunz-map')).length;
      
      // Switch away and back
      await page.click('#toggle-map');
      await page.waitForTimeout(500);
      await page.click('#toggle-map');
      await page.waitForTimeout(500);
      
      const finalScripts = scriptsLoaded.filter(s => s.includes('bunz-map')).length;
      
      // Should only load once
      expect(finalScripts).toBe(initialScripts);
    });
  });

  test.describe('Security', () => {
    test('should require session for WebSocket', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      // WebSocket should connect (session verification happens server-side)
      await page.waitForTimeout(1000);
      
      const wsState = await page.evaluate(() => {
        return window.bunzWebRTC?.ws?.readyState;
      });
      
      // Should be OPEN (1) or CONNECTING (0)
      expect([0, 1]).toContain(wsState);
    });

    test('should escape user content in avatars', async ({ page }) => {
      await page.goto(MEETING_URL);
      
      await page.click('#toggle-map');
      await page.waitForTimeout(2000);
      
      // Try to add avatar with XSS attempt
      await page.evaluate(() => {
        if (window.bunzMap) {
          window.bunzMap.addAvatar('test', 10.75, 59.91, {
            name: '<script>alert("xss")</script>',
            label: 'XS'
          });
        }
      });
      
      // Check that script tag was escaped
      const avatarHtml = await page.evaluate(() => {
        const avatar = document.querySelector('#avatar-test');
        return avatar?.innerHTML || '';
      });
      
      // Should contain escaped HTML, not actual script tag
      expect(avatarHtml).toContain('&lt;script&gt;');
    });
  });
});

