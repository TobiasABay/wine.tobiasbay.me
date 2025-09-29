# Wine Tasting App - Cloudflare Deployment Guide

## Prerequisites

1. **Cloudflare Account** with Pages and Workers enabled
2. **Domain**: wine.tobiasbay.me (already configured)
3. **Wrangler CLI** installed globally

```bash
npm install -g wrangler
```

## Step 1: Deploy Frontend to Cloudflare Pages

### Option A: Connect GitHub Repository
1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your GitHub repository
4. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

### Option B: Manual Upload
```bash
# Build the project
npm run build

# Upload dist folder to Cloudflare Pages via dashboard
```

## Step 2: Set up Cloudflare D1 Database

```bash
# Create D1 database
cd workers
wrangler d1 create wine-events

# This will output a database ID - copy it to wrangler.toml
```

Update `workers/wrangler.toml` with your database ID:
```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "wine-events"
database_id = "your-actual-database-id-here"
```

## Step 3: Run Database Migrations

```bash
cd workers

# Install dependencies
npm install

# Run migrations locally (for testing)
wrangler d1 migrations apply wine-events --local

# Run migrations in production
wrangler d1 migrations apply wine-events
```

## Step 4: Deploy Backend to Cloudflare Workers

```bash
cd workers

# Login to Cloudflare
wrangler login

# Deploy the worker
wrangler deploy
```

This will give you a URL like: `https://wine-tasting-api.your-subdomain.workers.dev`

## Step 5: Configure Custom Domain

### For the Frontend (Pages):
1. Go to your Pages project
2. Click "Custom domains"
3. Add `wine.tobiasbay.me`
4. Update DNS records as instructed

### For the Backend (Workers):
1. Go to Workers & Pages → wine-tasting-api
2. Click "Triggers" → "Custom domains"
3. Add `api.wine.tobiasbay.me` (or use the same domain with `/api` path)

## Step 6: Update DNS Records

Add these DNS records in Cloudflare:

```
Type: CNAME
Name: wine
Content: your-pages-domain.pages.dev
Proxy: ✅ (Orange cloud)

Type: CNAME  
Name: api.wine
Content: wine-tasting-api.your-subdomain.workers.dev
Proxy: ✅ (Orange cloud)
```

## Step 7: Update Environment Variables

In Cloudflare Workers dashboard:
- Set `FRONTEND_URL` = `https://wine.tobiasbay.me`

## Step 8: Test the Deployment

1. **Frontend**: Visit `https://wine.tobiasbay.me`
2. **Backend**: Visit `https://api.wine.tobiasbay.me/api/health`
3. **Create an event** and verify it works end-to-end

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in Workers
2. **Database Errors**: Run migrations with `wrangler d1 migrations apply wine-events`
3. **WebSocket Issues**: Cloudflare Workers doesn't support WebSockets natively. Consider using:
   - Durable Objects for real-time features
   - Server-Sent Events (SSE)
   - Polling for updates

### WebSocket Alternative (Recommended):

Since Cloudflare Workers doesn't support WebSockets, we can implement real-time updates using:

1. **Server-Sent Events (SSE)**: For one-way real-time updates
2. **Polling**: Check for updates every few seconds
3. **Durable Objects**: For more complex real-time features

Would you like me to implement one of these alternatives?

## Environment Variables

Make sure these are set in Cloudflare Workers:

```
FRONTEND_URL=https://wine.tobiasbay.me
NODE_ENV=production
```

## Build Commands

```bash
# Frontend build
npm run build

# Workers deploy
cd workers && wrangler deploy
```

## Monitoring

- **Pages Analytics**: Available in Cloudflare dashboard
- **Workers Analytics**: Monitor API usage and errors
- **D1 Analytics**: Database query performance

---

**Note**: WebSockets won't work with Cloudflare Workers. The real-time features will need to be implemented using SSE or polling.
