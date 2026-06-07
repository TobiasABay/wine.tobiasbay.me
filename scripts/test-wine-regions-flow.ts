/**
 * Simulates join + scoring flows for multiple users with different country/region picks.
 * Run: npx tsx scripts/test-wine-regions-flow.ts
 */
import {
    WINE_COUNTRIES,
    WINE_REGIONS_BY_COUNTRY,
    ALL_WINE_REGIONS,
    getRegionsForCountry,
} from '../src/data/wineRegions';

type Guesses = Record<string, string>;

interface Category {
    id: string;
    guessing_element: string;
}

const CATEGORIES: Category[] = [
    { id: 'cat-grape', guessing_element: 'Grape Variety' },
    { id: 'cat-country', guessing_element: 'Country' },
    { id: 'cat-region', guessing_element: 'Region' },
];

/** Mirrors JoinEventPage / PlayerScoringPage country→region filtering behaviour. */
function simulateGuessFlow(
    userName: string,
    picks: { country: string; region: string }
): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    let selectedCountry = '';
    const guesses: Guesses = {};

    const applyCountry = (country: string) => {
        guesses['cat-country'] = country;
        selectedCountry = country;
        guesses['cat-region'] = '';
    };

    const regionOptions = () => getRegionsForCountry(selectedCountry);

    applyCountry(picks.country);

    const options = regionOptions();
    if (!options.includes(picks.region)) {
        errors.push(
            `${userName}: region "${picks.region}" not in options for country "${picks.country}" (${options.length} options)`
        );
    } else {
        guesses['cat-region'] = picks.region;
    }

    // Country outside mapped list should still allow picking a region from full list
    if (!WINE_REGIONS_BY_COUNTRY[picks.country] && picks.country) {
        if (options.length !== ALL_WINE_REGIONS.length) {
            errors.push(
                `${userName}: unmapped country "${picks.country}" should show all ${ALL_WINE_REGIONS.length} regions, got ${options.length}`
            );
        }
    }

    // Mapped country should NOT expose regions from another country
    if (WINE_REGIONS_BY_COUNTRY[picks.country]) {
        const foreignSamples: Record<string, string> = {
            France: 'Tuscany',
            Italy: 'Bordeaux',
            Spain: 'Napa Valley',
            'United States': 'Rioja',
            Germany: 'Burgundy',
        };
        const foreign = foreignSamples[picks.country];
        if (foreign && options.includes(foreign)) {
            errors.push(`${userName}: foreign region "${foreign}" leaked into "${picks.country}" options`);
        }
    }

    if (guesses['cat-region'] !== picks.region && errors.length === 0) {
        errors.push(`${userName}: region guess was not stored`);
    }

    return { passed: errors.length === 0, errors };
}

/** Simulates changing country clears the region selection. */
function simulateCountryChange(): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    let selectedCountry = '';
    const guesses: Guesses = { 'cat-region': 'Burgundy' };

    const setCountry = (country: string) => {
        guesses['cat-country'] = country;
        selectedCountry = country;
        guesses['cat-region'] = '';
    };

    setCountry('France');
    if (guesses['cat-region'] !== '') {
        errors.push('Region should clear when country is set to France');
    }

    setCountry('Italy');
    const italyRegions = getRegionsForCountry(selectedCountry);
    if (!italyRegions.includes('Tuscany')) {
        errors.push('Tuscany should be available after switching to Italy');
    }
    if (italyRegions.includes('Burgundy')) {
        errors.push('Burgundy should not appear after switching to Italy');
    }

    return { passed: errors.length === 0, errors };
}

function runStructuralChecks(): { passed: boolean; errors: string[] } {
    const errors: string[] = [];

    const derivedCount = new Set(Object.values(WINE_REGIONS_BY_COUNTRY).flat()).size;
    if (ALL_WINE_REGIONS.length !== derivedCount) {
        errors.push(`ALL_WINE_REGIONS length mismatch: ${ALL_WINE_REGIONS.length} vs derived ${derivedCount}`);
    }

    for (const [country, regions] of Object.entries(WINE_REGIONS_BY_COUNTRY)) {
        const unique = new Set(regions);
        if (unique.size !== regions.length) {
            errors.push(`Duplicate regions in ${country}`);
        }
        if (regions.length === 0) {
            errors.push(`Empty region list for ${country}`);
        }
    }

    if (WINE_COUNTRIES.length < 50) {
        errors.push(`Expected at least 50 countries, got ${WINE_COUNTRIES.length}`);
    }

    const mappedCountries = Object.keys(WINE_REGIONS_BY_COUNTRY).length;
    if (mappedCountries < 20) {
        errors.push(`Expected at least 20 mapped countries, got ${mappedCountries}`);
    }

    return { passed: errors.length === 0, errors };
}

const userScenarios = [
    { user: 'Alice', country: 'France', region: 'Burgundy' },
    { user: 'Bob', country: 'Italy', region: 'Tuscany' },
    { user: 'Charlie', country: 'Spain', region: 'Rioja' },
    { user: 'Diana', country: 'United States', region: 'Napa Valley' },
    { user: 'Eve', country: 'Germany', region: 'Mosel' },
    { user: 'Frank', country: 'Argentina', region: 'Mendoza' },
    { user: 'Grace', country: 'Australia', region: 'Barossa Valley' },
    { user: 'Henry', country: 'Chile', region: 'Maipo Valley' },
    { user: 'Iris', country: 'Portugal', region: 'Douro Valley' },
    { user: 'Jack', country: 'Algeria', region: 'Bordeaux' }, // unmapped country → full list
];

let totalPassed = 0;
let totalFailed = 0;
const allErrors: string[] = [];

console.log('=== Wine regions flow test ===\n');

const structural = runStructuralChecks();
if (structural.passed) {
    console.log('✓ Structural checks passed');
    totalPassed++;
} else {
    console.log('✗ Structural checks failed');
    allErrors.push(...structural.errors);
    totalFailed++;
}

const countryChange = simulateCountryChange();
if (countryChange.passed) {
    console.log('✓ Country change clears region and updates options');
    totalPassed++;
} else {
    console.log('✗ Country change behaviour failed');
    allErrors.push(...countryChange.errors);
    totalFailed++;
}

console.log('\n--- Multi-user guess scenarios ---');
for (const scenario of userScenarios) {
    const result = simulateGuessFlow(scenario.user, {
        country: scenario.country,
        region: scenario.region,
    });
    if (result.passed) {
        console.log(`✓ ${scenario.user}: ${scenario.country} → ${scenario.region}`);
        totalPassed++;
    } else {
        console.log(`✗ ${scenario.user}: ${scenario.country} → ${scenario.region}`);
        allErrors.push(...result.errors);
        totalFailed++;
    }
}

// Scoring page: country guess restored from saved guesses
console.log('\n--- Scoring page: restore country from saved guesses ---');
{
    const savedGuesses: Guesses = { 'cat-country': 'France', 'cat-region': 'Champagne' };
    const countryCategory = CATEGORIES.find((c) => c.guessing_element === 'Country');
    const restoredCountry =
        countryCategory && savedGuesses[countryCategory.id]
            ? savedGuesses[countryCategory.id]
            : '';
    const regionOptions = getRegionsForCountry(restoredCountry);
    if (restoredCountry === 'France' && regionOptions.includes('Champagne')) {
        console.log('✓ Restored France guess filters regions correctly (Champagne available)');
        totalPassed++;
    } else {
        console.log('✗ Restored country guess did not filter regions correctly');
        allErrors.push('Scoring page restore: Champagne not in France regions');
        totalFailed++;
    }
}

console.log('\n=== Summary ===');
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);

if (allErrors.length > 0) {
    console.log('\nFailures:');
    for (const err of allErrors) {
        console.log(`  - ${err}`);
    }
    process.exit(1);
}

console.log('\nAll tests passed.');
process.exit(0);
