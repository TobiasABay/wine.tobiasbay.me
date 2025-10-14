#!/usr/bin/env node

/**
 * Enable WebSocket on Cloudflare Zone
 * 
 * This script enables WebSocket support on your Cloudflare zone
 * using the Cloudflare API.
 */

require('dotenv').config();

const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
const ZONE_ID = process.env.ZONE_ID;

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║        🌐  Enable WebSocket on Cloudflare Zone  🌐            ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Validate environment variables
if (!CLOUDFLARE_EMAIL || !CLOUDFLARE_API_KEY || !ZONE_ID) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Please ensure the following are set in .env:');
    console.error('   - CLOUDFLARE_EMAIL');
    console.error('   - CLOUDFLARE_API_KEY');
    console.error('   - ZONE_ID\n');
    process.exit(1);
}

console.log('📧 Email:', CLOUDFLARE_EMAIL);
console.log('🔑 API Key:', CLOUDFLARE_API_KEY.substring(0, 10) + '...');
console.log('🆔 Zone ID:', ZONE_ID);
console.log('\n' + '─'.repeat(64) + '\n');

async function getWebSocketSetting() {
    console.log('🔍 Checking current WebSocket setting...');

    const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/websockets`,
        {
            method: 'GET',
            headers: {
                'X-Auth-Email': CLOUDFLARE_EMAIL,
                'X-Auth-Key': CLOUDFLARE_API_KEY,
                'Content-Type': 'application/json',
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to get WebSocket setting');
        console.error('   Status:', response.status);
        console.error('   Response:', JSON.stringify(data, null, 2));
        throw new Error('API request failed');
    }

    return data;
}

async function enableWebSocket() {
    console.log('⚙️  Enabling WebSocket...');

    const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/websockets`,
        {
            method: 'PATCH',
            headers: {
                'X-Auth-Email': CLOUDFLARE_EMAIL,
                'X-Auth-Key': CLOUDFLARE_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: 'on' }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Failed to enable WebSocket');
        console.error('   Status:', response.status);
        console.error('   Response:', JSON.stringify(data, null, 2));
        throw new Error('API request failed');
    }

    return data;
}

async function main() {
    try {
        // Step 1: Check current setting
        const currentSetting = await getWebSocketSetting();

        if (currentSetting.success) {
            const currentValue = currentSetting.result.value;
            console.log(`   Current value: ${currentValue}`);

            if (currentValue === 'on') {
                console.log('✅ WebSocket is already enabled!\n');
                console.log('─'.repeat(64) + '\n');
                console.log('🎉 No action needed - WebSocket is active on your zone\n');
                return;
            }
        }

        console.log('');

        // Step 2: Enable WebSocket
        const result = await enableWebSocket();

        if (result.success) {
            console.log('✅ WebSocket successfully enabled!');
            console.log('   New value:', result.result.value);
            console.log('   Modified:', result.result.modified_on);
        }

        console.log('\n' + '─'.repeat(64) + '\n');
        console.log('🎉 Success! WebSocket is now enabled on your Cloudflare zone');
        console.log('\n📋 Next Steps:');
        console.log('   1. Your zone now supports WebSocket connections');
        console.log('   2. Deploy your backend with WebSocket support');
        console.log('   3. Update your frontend to use the production WebSocket URL');
        console.log('   4. Test the connection in production\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nTroubleshooting:');
        console.error('   1. Verify your API credentials are correct');
        console.error('   2. Ensure you have permission to modify zone settings');
        console.error('   3. Check that the Zone ID matches your domain');
        console.error('   4. Try regenerating your API key if it\'s invalid\n');
        process.exit(1);
    }
}

main();

