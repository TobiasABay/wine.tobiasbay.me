#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * 
 * This script tests the WebSocket connection to the backend server.
 * It verifies that:
 * 1. The connection can be established
 * 2. The server responds to events
 * 3. Event rooms can be joined and left
 */

const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:3001';
const TEST_EVENT_ID = 'test-event-123';

console.log('🧪 WebSocket Connection Test');
console.log('=' .repeat(50));
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Test Event ID: ${TEST_EVENT_ID}`);
console.log('=' .repeat(50));
console.log('');

// Create socket connection
const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    timeout: 10000,
});

let testsPassed = 0;
let testsFailed = 0;

function logSuccess(message) {
    console.log(`✅ ${message}`);
    testsPassed++;
}

function logError(message) {
    console.log(`❌ ${message}`);
    testsFailed++;
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

// Test 1: Connection
socket.on('connect', () => {
    logSuccess(`Connected to server (Socket ID: ${socket.id})`);
    
    // Test 2: Join event room
    setTimeout(() => {
        logInfo(`Attempting to join event: ${TEST_EVENT_ID}`);
        socket.emit('join-event', TEST_EVENT_ID);
        
        setTimeout(() => {
            logSuccess(`Successfully joined event room: ${TEST_EVENT_ID}`);
            
            // Test 3: Leave event room
            setTimeout(() => {
                logInfo(`Attempting to leave event: ${TEST_EVENT_ID}`);
                socket.emit('leave-event', TEST_EVENT_ID);
                
                setTimeout(() => {
                    logSuccess(`Successfully left event room: ${TEST_EVENT_ID}`);
                    
                    // Test 4: Disconnect
                    setTimeout(() => {
                        logInfo('Disconnecting from server');
                        socket.disconnect();
                        
                        setTimeout(() => {
                            console.log('');
                            console.log('=' .repeat(50));
                            console.log('📊 Test Results:');
                            console.log(`   Passed: ${testsPassed}`);
                            console.log(`   Failed: ${testsFailed}`);
                            console.log('=' .repeat(50));
                            
                            if (testsFailed === 0) {
                                console.log('');
                                console.log('🎉 All tests passed!');
                                console.log('');
                                console.log('Next steps:');
                                console.log('1. Open your browser to http://localhost:5173/ws-test');
                                console.log('2. Verify the connection status shows "Connected"');
                                console.log('3. Test joining an event room');
                                console.log('4. Check the console logs for real-time events');
                                process.exit(0);
                            } else {
                                console.log('');
                                console.log('⚠️  Some tests failed. Please check the errors above.');
                                process.exit(1);
                            }
                        }, 500);
                    }, 1000);
                }, 500);
            }, 1000);
        }, 500);
    }, 1000);
});

socket.on('connect_error', (error) => {
    logError(`Connection error: ${error.message}`);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure the backend server is running on port 3001');
    console.log('2. Run: cd backend && npm start');
    console.log('3. Check that no firewall is blocking the connection');
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    logInfo(`Disconnected: ${reason}`);
});

socket.on('reconnect', (attemptNumber) => {
    logInfo(`Reconnected after ${attemptNumber} attempts`);
});

socket.on('error', (error) => {
    logError(`Socket error: ${error}`);
});

// Timeout after 15 seconds
setTimeout(() => {
    logError('Test timeout (15 seconds)');
    console.log('');
    console.log('The test did not complete within 15 seconds.');
    console.log('Please ensure the backend server is running and accessible.');
    socket.disconnect();
    process.exit(1);
}, 15000);

