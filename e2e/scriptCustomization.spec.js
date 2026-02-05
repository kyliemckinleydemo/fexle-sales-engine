/**
 * @module e2e/scriptCustomization.spec
 * @description E2E tests for white-label script customization UI
 *
 * PURPOSE:
 * - Test editing default vertical scripts (opening scripts, objections, pain points)
 * - Test Script Edit Modal open/close, save, reset to default
 * - Test override persistence across page reloads
 * - Test "Customized" badges and admin banner
 *
 * PATTERNS:
 * - Uses Playwright's locator API for reliable element selection
 * - Each test starts with fresh localStorage (no prior overrides)
 * - Tests navigate to Playbooks tab and interact with Healthcare vertical (default)
 *
 * CLAUDE NOTES:
 * - Healthcare is the default selectedVertical on page load
 * - Edit buttons only appear for admins (local mode = admin by default)
 * - verticalOverrides stored in localStorage key 'verticalOverrides'
 * - Default verticals use 'openings' and 'objections' (not openingScripts/objectionHandlers)
 */

import { test, expect } from '@playwright/test';

test.describe('Script Customization', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first to be able to set localStorage
    await page.goto('/?e2e=true');
    await page.evaluate(() => {
      localStorage.setItem('e2eTestMode', 'true');
      localStorage.setItem('outboundSalesEngineMode', 'local');
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');
      // Clear any prior overrides
      localStorage.removeItem('verticalOverrides');
    });
    // Reload to pick up localStorage values
    await page.goto('/?e2e=true');
    await page.waitForSelector('text=Today', { timeout: 30000 });

    // Skip onboarding if it appears
    const skipTour = page.locator('text=Skip tour');
    if (await skipTour.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipTour.click();
    }

    // Navigate to Playbooks tab - Healthcare is selected by default
    await page.click('text=Playbooks');
    await page.waitForSelector('text=Healthcare', { timeout: 5000 });
  });

  test.describe('Edit Button Visibility', () => {
    test('edit buttons appear on opening scripts for default verticals', async ({ page }) => {
      // Scroll down to find opening scripts section
      const openingScriptsSection = page.locator('text=Opening Scripts').first();
      await expect(openingScriptsSection).toBeVisible({ timeout: 5000 });

      // Find edit buttons within the opening scripts area
      const editButtons = page.locator('button:has-text("Edit")');
      const count = await editButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('edit buttons appear on pain points for default verticals', async ({ page }) => {
      // Find pain points section
      const painPointsSection = page.locator('text=Pain Points to Probe').first();
      await expect(painPointsSection).toBeVisible({ timeout: 5000 });

      // Find edit emoji buttons near pain points
      const painPointEdits = page.locator('.grid >> button:has-text("✏️")');
      const count = await painPointEdits.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Script Edit Modal', () => {
    test('opens when clicking Edit on an opening script', async ({ page }) => {
      // Find and click the first Edit button in opening scripts
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      // Modal should appear with the title
      await expect(page.locator('text=Edit Opening Script')).toBeVisible({ timeout: 3000 });
    });

    test('shows original script in read-only field', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      // Should show "Original (Default)" label
      await expect(page.locator('text=Original (Default)')).toBeVisible();

      // Original script should have content
      const originalField = page.locator('label:has-text("Original (Default)") + div');
      const text = await originalField.textContent();
      expect(text.length).toBeGreaterThan(10);
    });

    test('shows editable textarea for custom version', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      // Should show editable field
      await expect(page.locator('label:has-text("Your Customized Version")')).toBeVisible();
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();
      await expect(textarea).toBeEditable();
    });

    test('shows live preview section', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      await expect(page.locator('label:has-text("Preview")')).toBeVisible();
    });

    test('Save button is disabled when text matches original', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const saveBtn = page.locator('button:has-text("Save Changes")');
      await expect(saveBtn).toBeDisabled();
    });

    test('Save button enables when text is modified', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('This is my custom opening script for testing purposes.');

      const saveBtn = page.locator('button:has-text("Save Changes")');
      await expect(saveBtn).toBeEnabled();
    });

    test('closes on Cancel button click', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      await expect(page.locator('text=Edit Opening Script')).toBeVisible();

      await page.click('button:has-text("Cancel")');

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();
    });

    test('closes on backdrop click', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      await expect(page.locator('text=Edit Opening Script')).toBeVisible();

      // Click the backdrop (the overlay div)
      await page.locator('.fixed.inset-0.bg-black').last().click({ position: { x: 10, y: 10 } });

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();
    });

    test('closes on X button click', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      await expect(page.locator('text=Edit Opening Script')).toBeVisible();

      // Click the X close button (× character)
      await page.locator('.fixed.inset-0 >> button:has-text("×")').last().click();

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();
    });
  });

  test.describe('Saving Customizations', () => {
    test('saving a script customization persists to localStorage', async ({ page }) => {
      // Open edit modal for first opening script
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      // Modify the script
      const textarea = page.locator('textarea');
      await textarea.fill('Custom E2E test opening script');

      // Save
      await page.click('button:has-text("Save Changes")');

      // Verify localStorage was updated
      const overrides = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('verticalOverrides') || '{}');
      });

      expect(Object.keys(overrides).length).toBeGreaterThan(0);
      // Healthcare should have overrides
      expect(overrides.healthcare).toBeDefined();
    });

    test('saved customization shows "Edited" badge on the script', async ({ page }) => {
      // Open edit modal and save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('Custom E2E test opening script');
      await page.click('button:has-text("Save Changes")');

      // Wait for modal to close
      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Should now see "Edited" badge
      await expect(page.locator('text=Edited').first()).toBeVisible({ timeout: 3000 });
    });

    test('saved customization shows "Customized" section badge', async ({ page }) => {
      // Save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('Custom E2E test opening script');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Should see "Customized" badge on the section
      await expect(page.locator('span:has-text("Customized")').first()).toBeVisible({ timeout: 3000 });
    });

    test('customization persists across page reloads', async ({ page }) => {
      // Save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      const customText = 'Persistent custom script for E2E testing';
      await textarea.fill(customText);
      await page.click('button:has-text("Save Changes")');

      // Re-set localStorage flags before reload to prevent onboarding
      await page.evaluate(() => {
        localStorage.setItem('e2eTestMode', 'true');
        localStorage.setItem('outboundSalesEngineMode', 'local');
        localStorage.setItem('onboardingComplete', 'true');
        localStorage.setItem('hasSeenOnboarding', 'true');
      });

      // Reload the page
      await page.goto('/?e2e=true');
      await page.waitForSelector('text=Today', { timeout: 30000 });

      // Skip onboarding if it still appears
      const skipTour = page.locator('text=Skip tour');
      if (await skipTour.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipTour.click();
      }

      // Navigate back to Playbooks
      await page.click('text=Playbooks');
      await page.waitForSelector('text=Healthcare', { timeout: 5000 });

      // The "Edited" badge should still be visible
      await expect(page.locator('text=Edited').first()).toBeVisible({ timeout: 5000 });

      // Open the edit modal again - it should show our custom text
      const editBtnReloaded = page.locator('button:has-text("Edit")').first();
      await editBtnReloaded.scrollIntoViewIfNeeded();
      await editBtnReloaded.click();

      const textareaReloaded = page.locator('textarea');
      const currentValue = await textareaReloaded.inputValue();
      expect(currentValue).toBe(customText);
    });
  });

  test.describe('Admin Banner', () => {
    test('admin banner appears after saving a customization', async ({ page }) => {
      // Save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('Custom script for banner test');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Admin banner should appear
      await expect(page.locator('text=Organization Customizations Active')).toBeVisible({ timeout: 3000 });
    });

    test('admin banner shows correct count of customized scripts', async ({ page }) => {
      // Save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('Custom script for count test');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Should show "1 script customized"
      await expect(page.locator('text=1 script customized')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Reset to Default', () => {
    test('Reset to Default button appears in modal for customized scripts', async ({ page }) => {
      // First, save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('Custom script to be reset');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Re-open the modal - should now have "Reset to Default"
      const editBtnAgain = page.locator('button:has-text("Edit")').first();
      await editBtnAgain.scrollIntoViewIfNeeded();
      await editBtnAgain.click();

      await expect(page.locator('button:has-text("Reset to Default")')).toBeVisible();
    });

    test('Reset to Default removes the customization', async ({ page }) => {
      // Save a customization
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('Custom script to be reset');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Re-open and click Reset to Default
      const editBtnAgain = page.locator('button:has-text("Edit")').first();
      await editBtnAgain.scrollIntoViewIfNeeded();
      await editBtnAgain.click();

      await page.click('button:has-text("Reset to Default")');

      // Modal should close
      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // "Edited" badge should no longer be visible
      const editedBadges = page.locator('span:has-text("Edited")');
      await expect(editedBadges).toHaveCount(0, { timeout: 3000 });

      // localStorage should be cleaned up
      const overrides = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('verticalOverrides') || '{}');
      });
      // Healthcare should be removed or empty
      expect(overrides.healthcare).toBeUndefined();
    });

    test('Reset All button clears all overrides for the vertical', async ({ page }) => {
      // Save two customizations
      const editBtn = page.locator('button:has-text("Edit")').first();
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();

      const textarea = page.locator('textarea');
      await textarea.fill('First custom script');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('text=Edit Opening Script')).not.toBeVisible();

      // Now edit a pain point
      const painEditBtn = page.locator('.grid >> button:has-text("✏️")').first();
      await painEditBtn.scrollIntoViewIfNeeded();
      await painEditBtn.click();

      await expect(page.locator('text=Edit Pain Point')).toBeVisible();
      const painTextarea = page.locator('textarea');
      await painTextarea.fill('Custom pain point for testing');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('text=Edit Pain Point')).not.toBeVisible();

      // Admin banner should show 2 customizations
      await expect(page.locator('text=Organization Customizations Active')).toBeVisible();

      // Accept the confirm dialog that Reset All will trigger
      page.on('dialog', dialog => dialog.accept());

      // Click Reset All
      const resetAllBtn = page.locator('button:has-text("Reset All")');
      await resetAllBtn.scrollIntoViewIfNeeded();
      await resetAllBtn.click();

      // Admin banner should disappear
      await expect(page.locator('text=Organization Customizations Active')).not.toBeVisible({ timeout: 3000 });

      // localStorage should be clean
      const overrides = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('verticalOverrides') || '{}');
      });
      expect(overrides.healthcare).toBeUndefined();
    });
  });

  test.describe('Objection Editing', () => {
    test('can edit an objection response', async ({ page }) => {
      // Scroll to objection handling section
      const objectionSection = page.locator('text=Objection Handling').first();
      await objectionSection.scrollIntoViewIfNeeded();

      // Find Edit button in the objections area
      const objEditBtn = page.locator('.bg-green-50 >> button:has-text("Edit")').first();
      if (await objEditBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await objEditBtn.click();

        await expect(page.locator('text=Edit Objection Response')).toBeVisible();

        const textarea = page.locator('textarea');
        await textarea.fill('Custom objection response for E2E test');
        await page.click('button:has-text("Save Changes")');

        await expect(page.locator('text=Edit Objection Response')).not.toBeVisible();

        // Verify saved to localStorage
        const overrides = await page.evaluate(() => {
          return JSON.parse(localStorage.getItem('verticalOverrides') || '{}');
        });
        expect(overrides.healthcare).toBeDefined();
        expect(overrides.healthcare.objections).toBeDefined();
      }
    });
  });
});
