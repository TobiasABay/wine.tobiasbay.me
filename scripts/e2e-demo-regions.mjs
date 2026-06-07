/**
 * Browser E2E: demo mode scoring with country/region filtering.
 * Run: node scripts/e2e-demo-regions.mjs
 * Requires dev server at http://localhost:5173
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.APP_URL || 'http://localhost:5173';

async function selectMuiOption(page, labelText, optionValue) {
    const formControl = page.locator('.MuiFormControl-root').filter({
        has: page.locator(`label:has-text("${labelText}")`),
    });
    await formControl.locator('[role="combobox"]').click();
    await page.getByRole('option', { name: optionValue, exact: true }).click();
}

async function testPlayer(page, playerName, country, region) {
    await page.goto(`${BASE_URL}/demo`);
    await page.getByText(playerName, { exact: true }).click();
    await page.waitForURL(/\/score\/demo-event-001/);

    await page.getByText('Guess the Wine Details').waitFor({ timeout: 10000 });

    await selectMuiOption(page, 'Country', country);

    // Open region dropdown and verify target region exists, foreign region absent
    const regionControl = page.locator('.MuiFormControl-root').filter({
        has: page.locator('label:has-text("Region")'),
    });
    await regionControl.locator('[role="combobox"]').click();

    const regionOption = page.getByRole('option', { name: region, exact: true });
    if ((await regionOption.count()) === 0) {
        throw new Error(`${playerName}: region "${region}" not found after selecting ${country}`);
    }

    const foreignRegion = country === 'France' ? 'Tuscany' : 'Burgundy';
    const foreignCount = await page.getByRole('option', { name: foreignRegion, exact: true }).count();
    if (foreignCount > 0) {
        throw new Error(`${playerName}: foreign region "${foreignRegion}" visible for ${country}`);
    }

    await regionOption.click();

    // Grape variety to complete form
    await selectMuiOption(page, 'Grape Variety', 'Pinot Noir');

    const submitButton = page.getByRole('button', { name: /submit score & guesses/i });
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    await page.getByText(/Score & Guesses Submitted!/i).waitFor({ timeout: 10000 });
    await page.getByText(`${country}`).waitFor();
    await page.getByText(`${region}`).waitFor();

    console.log(`✓ E2E ${playerName}: ${country} → ${region}`);
}

async function main() {
    const scenarios = [
        { player: 'Alice', country: 'France', region: 'Burgundy' },
        { player: 'Bob', country: 'Italy', region: 'Tuscany' },
        { player: 'Charlie', country: 'Spain', region: 'Rioja' },
        { player: 'Diana', country: 'United States', region: 'Napa Valley' },
    ];

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
    } catch {
        console.error('Playwright browser not installed. Run: npx playwright install chromium');
        process.exit(1);
    }

    const errors = [];

    for (const scenario of scenarios) {
        const context = await browser.newContext();
        const page = await context.newPage();
        try {
            await testPlayer(page, scenario.player, scenario.country, scenario.region);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`✗ E2E ${scenario.player}: ${message}`);
            errors.push(message);
        } finally {
            await context.close();
        }
    }

    await browser.close();

    if (errors.length > 0) {
        console.error(`\nE2E failed: ${errors.length} scenario(s)`);
        process.exit(1);
    }

    console.log(`\nAll ${scenarios.length} E2E demo scenarios passed.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
