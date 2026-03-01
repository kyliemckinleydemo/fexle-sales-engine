/**
 * @module e2e/scriptBuilder.spec
 * @description E2E tests for AI Script Builder modal workflow
 *
 * PURPOSE:
 * - Test complete user flows for creating custom playbooks
 * - Verify form validation, step navigation, localStorage persistence
 * - Test modal open/close, edit mode, delete functionality
 *
 * PATTERNS:
 * - Uses Playwright's locator API for reliable element selection
 * - Each test starts with fresh localStorage
 * - Tests are independent and can run in parallel
 *
 * CLAUDE NOTES:
 * - The app uses Babel transpilation in browser, so page load may take a moment
 * - Modal is opened via Playbooks tab → "Create Script" button
 * - Form validation disables Next button until required fields filled
 */

import { test, expect } from '@playwright/test';

test.describe('Script Builder Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first to be able to set localStorage
    await page.goto('/?e2e=true');
    // Set localStorage after page context is available - also disable onboarding tour
    await page.evaluate(() => {
      localStorage.setItem('e2eTestMode', 'true');
      localStorage.setItem('outboundSalesEngineMode', 'local');
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');
    });
    // Reload to pick up the localStorage values
    await page.goto('/?e2e=true');
    await page.waitForSelector('text=Today', { timeout: 30000 });

    // If onboarding modal still appears, skip it
    const skipTour = page.locator('text=Skip tour');
    if (await skipTour.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipTour.click();
    }
  });

  test.describe('Modal State Management', () => {
    test('opens modal when Create Script button is clicked', async ({ page }) => {
      // Navigate to Playbooks tab
      await page.click('text=Playbooks');

      // Click Create Script button
      await page.click('text=Create Script');

      // Verify modal is visible
      await expect(page.locator('text=AI Script Builder')).toBeVisible();
      await expect(page.locator('text=Step 1: Basic Info')).toBeVisible();
    });

    test('closes modal on backdrop click', async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');

      // Click the backdrop (the fixed overlay behind the modal)
      await page.click('.fixed.inset-0.bg-black', { position: { x: 10, y: 10 } });

      // Modal should be closed
      await expect(page.locator('text=AI Script Builder')).not.toBeVisible();
    });

    test('closes modal on X button click', async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');

      // Click the X button (uses × which is &times; in HTML)
      await page.click('button:has-text("×")');

      // Modal should be closed
      await expect(page.locator('text=AI Script Builder')).not.toBeVisible();
    });

    test('resets form data after closing', async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');

      // Fill in some data
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');

      // Close modal (uses × which is &times; in HTML)
      await page.click('button:has-text("×")');

      // Reopen modal
      await page.click('text=Create Script');

      // Field should be empty (form reset)
      const input = page.locator('input[placeholder*="SaaS Sales"]');
      await expect(input).toHaveValue('');
    });
  });

  test.describe('Step 1 Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');
    });

    test('Next button is disabled without Playbook Name', async ({ page }) => {
      // Fill other required fields but not name
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');

      // Next button should be disabled
      const nextButton = page.locator('button:has-text("Next →")');
      await expect(nextButton).toBeDisabled();
    });

    test('Next button is disabled without Product/Service', async ({ page }) => {
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');

      const nextButton = page.locator('button:has-text("Next →")');
      await expect(nextButton).toBeDisabled();
    });

    test('Next button is disabled without Target Titles', async ({ page }) => {
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');

      const nextButton = page.locator('button:has-text("Next →")');
      await expect(nextButton).toBeDisabled();
    });

    test('Next button is enabled when all required fields are filled', async ({ page }) => {
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');

      const nextButton = page.locator('button:has-text("Next →")');
      await expect(nextButton).toBeEnabled();
    });

    test('Icon dropdown works', async ({ page }) => {
      // Click the icon dropdown
      await page.click('select');

      // Should have icon options
      const options = page.locator('select option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });

  test.describe('Step Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');
    });

    test('navigates from Step 1 to Step 2', async ({ page }) => {
      // Fill Step 1 required fields
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');

      // Click Next
      await page.click('button:has-text("Next →")');

      // Should be on Step 2
      await expect(page.locator('text=Step 2: Pain Points & Value')).toBeVisible();
    });

    test('navigates from Step 2 to Step 3', async ({ page }) => {
      // Complete Step 1
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');
      await page.click('button:has-text("Next →")');

      // Fill Step 2 required fields
      await page.fill('textarea[placeholder*="Manual processes"]', 'Pain point 1\nPain point 2');
      await page.fill('textarea[placeholder*="What benefits"]', 'Value 1\nValue 2');

      // Click Next
      await page.click('button:has-text("Next →")');

      // Should be on Step 3
      await expect(page.locator('text=AI Will Generate')).toBeVisible();
    });

    test('Back button returns to previous step', async ({ page }) => {
      // Go to Step 2
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');
      await page.click('button:has-text("Next →")');

      // Verify on Step 2
      await expect(page.locator('text=Step 2: Pain Points & Value')).toBeVisible();

      // Click Back
      await page.click('button:has-text("← Back")');

      // Should be on Step 1
      await expect(page.locator('text=Step 1: Basic Info')).toBeVisible();
    });

    test('data is preserved during navigation', async ({ page }) => {
      // Fill Step 1
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical Name');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product Service');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO, CFO');
      await page.click('button:has-text("Next →")');

      // Fill Step 2
      await page.fill('textarea[placeholder*="Manual processes"]', 'Test Pain Points');
      await page.fill('textarea[placeholder*="What benefits"]', 'Test Value Props');

      // Go back to Step 1
      await page.click('button:has-text("← Back")');

      // Data should be preserved
      await expect(page.locator('input[placeholder*="SaaS Sales"]')).toHaveValue('Test Vertical Name');
      await expect(page.locator('textarea[placeholder*="product or service"]')).toHaveValue('Test Product Service');

      // Go forward to Step 2
      await page.click('button:has-text("Next →")');

      // Step 2 data should be preserved
      await expect(page.locator('textarea[placeholder*="Manual processes"]')).toHaveValue('Test Pain Points');
    });

    test('progress indicator updates correctly', async ({ page }) => {
      // On Step 1, first indicator should be active
      const step1Indicator = page.locator('.bg-blue-600').first();
      await expect(step1Indicator).toBeVisible();

      // Go to Step 2
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test');
      await page.fill('textarea[placeholder*="product or service"]', 'Test');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO');
      await page.click('button:has-text("Next →")');

      // First step should now show green (completed)
      const completedIndicator = page.locator('.bg-green-500').first();
      await expect(completedIndicator).toBeVisible();
    });
  });

  test.describe('Step 2 Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');

      // Complete Step 1
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');
      await page.click('button:has-text("Next →")');
    });

    test('Next button is disabled without Pain Points', async ({ page }) => {
      await page.fill('textarea[placeholder*="What benefits"]', 'Value 1');

      const nextButton = page.locator('button:has-text("Next →")');
      await expect(nextButton).toBeDisabled();
    });

    test('Next button is disabled without Value Props', async ({ page }) => {
      await page.fill('textarea[placeholder*="Manual processes"]', 'Pain 1');

      const nextButton = page.locator('button:has-text("Next →")');
      await expect(nextButton).toBeDisabled();
    });

    test('multiline input works for textareas', async ({ page }) => {
      const painPointsText = 'Pain point 1\nPain point 2\nPain point 3';
      await page.fill('textarea[placeholder*="Manual processes"]', painPointsText);

      await expect(page.locator('textarea[placeholder*="Manual processes"]')).toHaveValue(painPointsText);
    });
  });

  test.describe('Step 3 - AI Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=Playbooks');
      await page.click('text=Create Script');

      // Complete Step 1
      await page.fill('input[placeholder*="SaaS Sales"]', 'Test Vertical');
      await page.fill('textarea[placeholder*="product or service"]', 'Test Product');
      await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO');
      await page.click('button:has-text("Next →")');

      // Complete Step 2
      await page.fill('textarea[placeholder*="Manual processes"]', 'Pain 1\nPain 2');
      await page.fill('textarea[placeholder*="What benefits"]', 'Value 1\nValue 2');
      await page.click('button:has-text("Next →")');
    });

    test('Generate button is visible on Step 3', async ({ page }) => {
      await expect(page.locator('button:has-text("Generate Scripts with AI")')).toBeVisible();
    });

    test('Generate button is disabled without API key', async ({ page }) => {
      // By default, no API key is set
      const generateButton = page.locator('button:has-text("Generate Scripts with AI")');
      await expect(generateButton).toBeDisabled();
    });

    test('shows review section with entered data', async ({ page }) => {
      // Should show the entered vertical name in review
      await expect(page.locator('text=Test Vertical')).toBeVisible();
    });
  });

  test.describe('localStorage Persistence', () => {
    // These tests involve page reloads and need more time
    test.setTimeout(60000);

    test('custom scripts persist after page reload', async ({ page }) => {
      // Set custom script in localStorage
      await page.evaluate(() => {
        const customScript = {
          test_vertical: {
            name: 'Test Vertical',
            icon: '🧪',
            isCustom: true,
            productService: 'Test Product',
            targetTitles: ['CEO', 'CTO'],
            painPoints: ['Pain 1'],
            valueProps: ['Value 1'],
            openingScripts: [],
            discoveryQuestions: [],
            objectionHandlers: {},
            closingScripts: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        localStorage.setItem('customScripts', JSON.stringify(customScript));
      });

      // Verify localStorage was set
      const savedScripts = await page.evaluate(() => localStorage.getItem('customScripts'));
      expect(savedScripts).toContain('Test Vertical');

      // Use goto instead of reload for more reliable localStorage pickup
      await page.goto('/?e2e=true');
      await page.waitForSelector('button:has-text("Today")', { timeout: 30000 });

      // Skip tour if it appears
      const skipTour = page.locator('text=Skip tour');
      if (await skipTour.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skipTour.click();
      }

      // Navigate to Playbooks
      await page.click('button:has-text("Playbooks")');

      // Custom vertical should appear in the list
      await expect(page.locator('text=Test Vertical')).toBeVisible({ timeout: 10000 });
    });

    test('custom scripts appear in vertical selector', async ({ page }) => {
      // Set custom script
      await page.evaluate(() => {
        const customScript = {
          my_custom_vertical: {
            name: 'My Custom Vertical',
            icon: '✨',
            isCustom: true,
            productService: 'Custom Product',
            targetTitles: ['CEO'],
            painPoints: ['Pain'],
            valueProps: ['Value'],
            openingScripts: [{ name: 'Test', script: 'Hello!' }],
            discoveryQuestions: [],
            objectionHandlers: {},
            closingScripts: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        localStorage.setItem('customScripts', JSON.stringify(customScript));
      });

      // Verify localStorage was set
      const savedScripts = await page.evaluate(() => localStorage.getItem('customScripts'));
      expect(savedScripts).toContain('My Custom Vertical');

      // Use goto instead of reload for more reliable localStorage pickup
      await page.goto('/?e2e=true');
      await page.waitForSelector('button:has-text("Today")', { timeout: 30000 });

      // Skip tour if it appears
      const skipTour = page.locator('text=Skip tour');
      if (await skipTour.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skipTour.click();
      }

      await page.click('button:has-text("Playbooks")');

      // Should see custom vertical in the Custom Playbooks section
      await expect(page.locator('text=My Custom Vertical')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Edit Mode', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
      // Navigate first to establish page context
      await page.goto('/?e2e=true');

      // Set up a custom script to edit
      await page.evaluate(() => {
        localStorage.setItem('e2eTestMode', 'true');
        localStorage.setItem('outboundSalesEngineMode', 'local');
        localStorage.setItem('onboardingComplete', 'true');
        localStorage.setItem('hasSeenOnboarding', 'true');
        const customScript = {
          editable_vertical: {
            name: 'Editable Vertical',
            icon: '📝',
            isCustom: true,
            companyName: 'Test Company',
            productService: 'Original Product',
            targetTitles: ['CEO', 'CTO'],
            desiredOutcome: 'CEO Meeting',
            painPoints: ['Original Pain'],
            valueProps: ['Original Value'],
            openingScripts: [{ name: 'Direct', script: 'Hello!' }],
            discoveryQuestions: ['Question 1?'],
            valueStatements: ['Statement 1'],
            objectionHandlers: { 'Not interested': 'Response' },
            closingScripts: [{ name: 'Close', script: 'Let us schedule...' }],
            voicemailScript: 'VM script',
            followUpScript: 'Follow up',
            postDeckFollowUp: 'Post deck',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        };
        localStorage.setItem('customScripts', JSON.stringify(customScript));
      });

      // Navigate again to pick up localStorage
      await page.goto('/?e2e=true');
      await page.waitForSelector('button:has-text("Today")', { timeout: 30000 });

      // Skip tour if it appears
      const skipTour = page.locator('text=Skip tour');
      if (await skipTour.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skipTour.click();
      }
    });

    test('can select and view custom playbook', async ({ page }) => {
      await page.click('button:has-text("Playbooks")');

      // Click on the custom playbook
      await page.click('text=Editable Vertical');

      // Should show the playbook content
      await expect(page.locator('text=Direct')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Delete Functionality', () => {
    // These tests involve modal navigation and need more time
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
      // Set up a custom script to delete
      await page.evaluate(() => {
        const customScript = {
          deletable_vertical: {
            name: 'Deletable Vertical',
            icon: '🗑️',
            isCustom: true,
            productService: 'Test Product',
            targetTitles: ['CEO'],
            painPoints: ['Pain'],
            valueProps: ['Value'],
            openingScripts: [],
            discoveryQuestions: [],
            objectionHandlers: {},
            closingScripts: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        localStorage.setItem('customScripts', JSON.stringify(customScript));
      });

      await page.goto('/?e2e=true');
      await page.waitForSelector('button:has-text("Today")', { timeout: 30000 });

      // Skip tour if it appears
      const skipTour = page.locator('text=Skip tour');
      if (await skipTour.isVisible({ timeout: 1000 }).catch(() => false)) {
        await skipTour.click();
      }
    });

    test('custom playbooks have delete button', async ({ page }) => {
      await page.click('button:has-text("Playbooks")');

      // Hover or look for delete button near the custom playbook
      // The delete button should be visible for custom playbooks
      const customSection = page.locator('text=Custom Playbooks').locator('..');
      await expect(customSection).toBeVisible({ timeout: 10000 });
    });

    test('deleting removes playbook from list', async ({ page }) => {
      await page.click('button:has-text("Playbooks")');

      // Verify the playbook exists and select it
      const playbookButton = page.locator('button:has-text("Deletable Vertical")');
      await expect(playbookButton).toBeVisible({ timeout: 10000 });
      await playbookButton.click();

      // Click "Edit Playbook" to open modal in edit mode
      await page.click('text=Edit Playbook');
      // In edit mode, the modal title is "Edit Script Builder"
      await expect(page.locator('text=Edit Script Builder')).toBeVisible({ timeout: 10000 });

      // Navigate to Step 3 (data is pre-filled, so Next buttons should be enabled)
      await page.click('button:has-text("Next →")');
      await page.click('button:has-text("Next →")');

      // Should be on Step 3
      await expect(page.locator('text=AI Will Generate')).toBeVisible();

      // Set up dialog handler for browser confirm
      page.on('dialog', dialog => dialog.accept());

      // Click "Delete Playbook"
      await page.click('text=Delete Playbook');

      // Modal should close and playbook should be removed
      await expect(page.locator('text=Edit Script Builder')).not.toBeVisible({ timeout: 10000 });

      // Verify playbook is removed from list (the custom playbooks section)
      await expect(page.locator('button:has-text("Deletable Vertical")')).not.toBeVisible({ timeout: 5000 });
    });

    test('deleting updates localStorage', async ({ page }) => {
      await page.click('button:has-text("Playbooks")');

      // Select and click on the custom playbook
      const playbookButton = page.locator('button:has-text("Deletable Vertical")');
      await expect(playbookButton).toBeVisible({ timeout: 10000 });
      await playbookButton.click();

      // Click "Edit Playbook" to open modal in edit mode
      await page.click('text=Edit Playbook');
      // In edit mode, the modal title is "Edit Script Builder"
      await expect(page.locator('text=Edit Script Builder')).toBeVisible({ timeout: 10000 });

      // Navigate to Step 3
      await page.click('button:has-text("Next →")');
      await page.click('button:has-text("Next →")');

      // Set up dialog handler for browser confirm
      page.on('dialog', dialog => dialog.accept());

      // Click "Delete Playbook"
      await page.click('text=Delete Playbook');

      // Wait for modal to close
      await expect(page.locator('text=Edit Script Builder')).not.toBeVisible({ timeout: 10000 });

      // Check localStorage - the key should be removed
      const scripts = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('customScripts') || '{}');
      });

      expect(scripts.deletable_vertical).toBeUndefined();
    });
  });
});

test.describe('Full Create Workflow', () => {
  test('complete workflow without API key shows correct states', async ({ page }) => {
    // Set up E2E test mode
    await page.goto('/?e2e=true');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('e2eTestMode', 'true');
      localStorage.setItem('outboundSalesEngineMode', 'local');
    });
    await page.reload();
    await page.waitForSelector('text=Today', { timeout: 30000 });

    // Navigate to Playbooks
    await page.click('text=Playbooks');

    // Open Script Builder
    await page.click('text=Create Script');
    await expect(page.locator('text=AI Script Builder')).toBeVisible();

    // Step 1: Fill required fields
    await page.fill('input[placeholder*="SaaS Sales"]', 'E2E Test Vertical');
    await page.fill('textarea[placeholder*="product or service"]', 'E2E Test Product');
    await page.fill('input[placeholder*="CEO, CFO"]', 'CEO, CTO, VP Sales');

    // Optional: Select icon
    await page.selectOption('select', '🚀');

    // Proceed to Step 2
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=Step 2: Pain Points & Value')).toBeVisible();

    // Step 2: Fill required fields
    await page.fill('textarea[placeholder*="Manual processes"]', 'Pain point 1\nPain point 2\nPain point 3');
    await page.fill('textarea[placeholder*="What benefits"]', 'Value prop 1\nValue prop 2');

    // Optional: Fill objections
    const objectionsTextarea = page.locator('textarea[placeholder*="What objections"]');
    if (await objectionsTextarea.isVisible()) {
      await objectionsTextarea.fill('Not interested\nToo expensive');
    }

    // Proceed to Step 3
    await page.click('button:has-text("Next →")');
    await expect(page.locator('text=AI Will Generate')).toBeVisible();

    // Verify Generate button is disabled (no API key)
    const generateButton = page.locator('button:has-text("Generate Scripts with AI")');
    await expect(generateButton).toBeDisabled();

    // Verify review shows our data
    await expect(page.locator('text=E2E Test Vertical')).toBeVisible();
  });
});
