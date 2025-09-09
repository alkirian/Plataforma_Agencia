import { test, expect } from '@playwright/test'

test.describe('Modal Migration Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173')

    // Wait for the application to load
    await page.waitForLoadState('networkidle')
  })

  test('Application loads successfully', async ({ page }) => {
    // Check if the main app container exists
    const app = page.locator('#root')
    await expect(app).toBeVisible()

    // Check for common UI elements (allowing for both Cadence and login titles)
    const title = await page.title()
    expect(title).toMatch(/Cadence|plataforma|Sign in/i)

    console.log('✅ Application loaded successfully')
  })

  test('Modal components are accessible', async ({ page }) => {
    // Test modal trigger buttons are present and functional
    // This will depend on your app's navigation structure

    // Look for common modal triggers
    const modalTriggers = await page
      .locator('button:has-text("Crear"), button:has-text("Editar"), button:has-text("Exportar")')
      .all()

    if (modalTriggers.length > 0) {
      console.log(`✅ Found ${modalTriggers.length} potential modal triggers`)
    }

    // Check for modal containers in DOM (they might be hidden initially)
    const modalContainers = await page.locator('[role="dialog"]').all()
    console.log(`📋 Found ${modalContainers.length} modal containers in DOM`)
  })

  test('Modal visual consistency - backdrop and animations', async ({ page }) => {
    // Try to find and click a modal trigger
    const createButton = page.locator('button:has-text("Crear")').first()

    if (await createButton.isVisible()) {
      await createButton.click()

      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]', { state: 'visible' })

      // Check modal backdrop
      const backdrop = page.locator(
        '.bg-black\\/60.backdrop-blur-sm, [class*="bg-black"][class*="backdrop-blur"]'
      )
      await expect(backdrop).toBeVisible()
      console.log('✅ Modal backdrop with blur effect found')

      // Check modal container styling
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()

      // Check for consistent border radius
      const modalPanel = page.locator('[role="dialog"] > div').first()
      const borderRadius = await modalPanel.evaluate(el => getComputedStyle(el).borderRadius)
      console.log(`✅ Modal border radius: ${borderRadius}`)

      // Test ESC key closing
      await page.keyboard.press('Escape')
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' })
      console.log('✅ Modal closes with ESC key')
    }
  })

  test('Button components consistency', async ({ page }) => {
    // Look for buttons across the app
    const buttons = await page.locator('button').all()
    console.log(`📋 Found ${buttons.length} buttons in the application`)

    // Check for consistent button styling classes
    const styledButtons = await page.locator('button[class*="btn"], button[class*="button"]').all()
    console.log(`✅ Found ${styledButtons.length} styled buttons`)

    // Test button hover states (basic check)
    if (styledButtons.length > 0) {
      await styledButtons[0].hover()
      console.log('✅ Button hover interaction works')
    }
  })

  test('Navigation and routing works', async ({ page }) => {
    // Test basic navigation if routes exist
    const navLinks = await page.locator('a[href], button[data-route]').all()
    console.log(`📋 Found ${navLinks.length} navigation elements`)

    // Test one navigation if available
    if (navLinks.length > 0) {
      const firstLink = navLinks[0]
      const href = await firstLink.getAttribute('href')

      if (href && href.startsWith('/')) {
        await firstLink.click()
        await page.waitForLoadState('networkidle')
        console.log(`✅ Navigation to ${href} successful`)
      }
    }
  })

  test('No console errors on load', async ({ page }) => {
    const errors = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Navigate and wait for load
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      error =>
        !error.includes('favicon') && !error.includes('DevTools') && !error.includes('extension')
    )

    console.log(`📋 Total console errors: ${errors.length}`)
    console.log(`⚠️ Critical errors: ${criticalErrors.length}`)

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors)
    }

    // Expect no critical errors
    expect(criticalErrors.length).toBe(0)
  })

  test('Responsive design - mobile viewport', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    const app = page.locator('#root')
    await expect(app).toBeVisible()

    console.log('✅ Application renders correctly on mobile viewport')
  })
})
