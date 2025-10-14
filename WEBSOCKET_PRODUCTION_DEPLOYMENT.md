# WebSocket Production Deployment Guide

## Current Status

✅ **Local Development**: WebSocket working perfectly  
⚠️ **Production**: Currently **DISABLED** (no backend deployed yet)

WebSocket is currently configured to work only in local development. When you visit the production site (`wine.tobiasbay.me`), WebSocket is disabled to prevent connection errors.

## Why Is WebSocket Disabled in Production?

The production site is trying to connect to `wss://api.wine.tobiasbay.me/socket.io/`, but there's no WebSocket server running there yet. Your WebSocket backend is only running locally at `localhost:3001`.

## How to Enable WebSocket in Production

### Prerequisites

You need to deploy your backend with WebSocket support. Here are your options:

### Option 1: Deploy to a VPS/Cloud Server (Recommended)

Deploy your backend to a server that supports WebSocket connections:

**Platforms that support WebSocket:**
- DigitalOcean App Platform
- AWS EC2 / Elastic Beanstalk
- Google Cloud Run
- Heroku
- Railway
- Render
- Fly.io

**Steps:**

1. **Deploy your backend:**
   ```bash
   cd backend
   # Deploy to your chosen platform
   # Make sure Socket.IO is included in the deployment
   ```

2. **Update the backend URL:**
   - Ensure your backend is accessible at `https://api.wine.tobiasbay.me`
   - Or update the frontend to use a different URL

3. **Enable WebSocket in the frontend:**
   - Open `/src/services/websocket.ts`
   - Change line 7 from:
     ```typescript
     const WEBSOCKET_ENABLED = isLocalhost;
     ```
     to:
     ```typescript
     const WEBSOCKET_ENABLED = true;
     ```

4. **Rebuild and deploy frontend:**
   ```bash
   npm run build
   # Deploy to Cloudflare Pages
   ```

### Option 2: Use Cloudflare Durable Objects (Advanced)

Cloudflare Durable Objects support WebSocket connections and can be used to build a WebSocket server:

1. Create a Durable Object for WebSocket handling
2. Update your Workers to use Durable Objects
3. Migrate Socket.IO logic to Durable Objects API
4. Enable WebSocket in frontend (see step 3 above)

**Resources:**
- [Cloudflare Durable Objects WebSocket](https://developers.cloudflare.com/durable-objects/api/websockets/)

### Option 3: Keep Polling for Now

If you don't want to deploy a WebSocket backend yet, you can continue using the existing polling mechanism (`useSmartPolling`). The application works fine without WebSocket - it's just slower (12s updates instead of real-time).

## Testing After Deployment

1. **Test the backend WebSocket endpoint:**
   ```bash
   # Update the script to test production
   curl https://api.wine.tobiasbay.me/api/health
   ```

2. **Test WebSocket connection:**
   - Open browser DevTools Console
   - Visit `https://wine.tobiasbay.me/ws-test`
   - Check for "Connected" status

3. **Verify in production:**
   - Create a test event
   - Open in multiple browsers
   - Verify real-time updates work

## Configuration File Reference

**File:** `/src/services/websocket.ts`

```typescript
// Current configuration (WebSocket disabled in production)
const WEBSOCKET_ENABLED = isLocalhost;

// When backend is deployed, change to:
const WEBSOCKET_ENABLED = true;

// Or make it configurable via environment variable:
const WEBSOCKET_ENABLED = import.meta.env.VITE_WEBSOCKET_ENABLED !== 'false';
```

## Backend Deployment Checklist

Before enabling WebSocket in production:

- [ ] Backend deployed and accessible at `https://api.wine.tobiasbay.me`
- [ ] Health check endpoint responding: `/api/health`
- [ ] Socket.IO server running and accepting connections
- [ ] CORS configured to allow `https://wine.tobiasbay.me`
- [ ] SSL/TLS certificate valid (required for WSS connections)
- [ ] Cloudflare WebSocket setting enabled (✅ already done)
- [ ] Test WebSocket connection from browser
- [ ] Monitor for connection errors in production

## Environment Variables (Optional)

You can make WebSocket configurable via environment variables:

1. **Add to `.env`:**
   ```
   VITE_WEBSOCKET_ENABLED=true
   VITE_WEBSOCKET_URL=https://api.wine.tobiasbay.me
   ```

2. **Update `websocket.ts`:**
   ```typescript
   const WEBSOCKET_ENABLED = 
       import.meta.env.VITE_WEBSOCKET_ENABLED !== 'false';
   
   const WEBSOCKET_URL = 
       import.meta.env.VITE_WEBSOCKET_URL || 
       (isLocalhost ? 'http://localhost:3001' : 'https://api.wine.tobiasbay.me');
   ```

3. **Rebuild and deploy:**
   ```bash
   npm run build
   ```

## Troubleshooting Production WebSocket

### Connection Fails After Enabling

**Error:** `WebSocket connection to 'wss://...' failed`

**Possible causes:**
1. Backend not deployed or not running
2. Wrong URL in frontend configuration
3. CORS not configured properly
4. SSL certificate issues
5. Firewall blocking WebSocket connections

**Solutions:**
1. Verify backend is running: `curl https://api.wine.tobiasbay.me/api/health`
2. Check backend logs for errors
3. Verify CORS allows your frontend domain
4. Ensure SSL certificate is valid
5. Check Cloudflare settings (should be OK)

### WebSocket Works Locally But Not in Production

1. Check if backend URL is correct
2. Verify SSL certificate on backend
3. Check Cloudflare proxy settings
4. Review backend CORS configuration

## Current Configuration Summary

**Local Development:**
- WebSocket: ✅ Enabled
- URL: `http://localhost:3001`
- Status: Working perfectly

**Production:**
- WebSocket: ⚠️ Disabled (by design)
- URL: `https://api.wine.tobiasbay.me` (not yet deployed)
- Fallback: Using polling (`useSmartPolling`)
- Cloudflare Zone: ✅ Configured for WebSocket

## Next Steps

1. Choose a deployment platform for your backend
2. Deploy the backend with Socket.IO support
3. Verify the backend is accessible
4. Enable WebSocket in frontend (`WEBSOCKET_ENABLED = true`)
5. Test thoroughly in production
6. Monitor for errors and connection issues

---

**Questions?** Check the main [WEBSOCKET_IMPLEMENTATION.md](./WEBSOCKET_IMPLEMENTATION.md) for more details.

