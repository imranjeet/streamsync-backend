# Vercel Deployment Guide

## Prerequisites

1. Vercel account (free tier available)
2. PostgreSQL database (can use Vercel Postgres, Supabase, or external RDS)
3. Firebase service account credentials
4. YouTube API key

## Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

## Step 2: Configure Environment Variables

Set these environment variables in Vercel Dashboard (Settings → Environment Variables):

### Required:
```
# Database (Neon PostgreSQL)
# Option 1: Use DATABASE_URL (Recommended - supports connection pooling)
DATABASE_URL=postgresql://neondb_owner:npg_S8aCLEpuJ0ek@ep-withered-mud-a1zuocqa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Option 2: Use POSTGRES_URL (Vercel Postgres compatible)
POSTGRES_URL=postgresql://neondb_owner:npg_S8aCLEpuJ0ek@ep-withered-mud-a1zuocqa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Option 3: Individual parameters (fallback)
# DB_HOST=ep-withered-mud-a1zuocqa-pooler.ap-southeast-1.aws.neon.tech
# DB_PORT=5432
# DB_USERNAME=neondb_owner
# DB_PASSWORD=npg_S8aCLEpuJ0ek
# DB_DATABASE=neondb

# JWT
JWT_SECRET=your-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# YouTube
YOUTUBE_API_KEY=your-api-key
YOUTUBE_CHANNEL_ID=your-channel-id

# Optional
CORS_ORIGIN=*
CRON_SECRET=your-cron-secret-for-worker-security
```

### Neon Database Setup:
The application is configured for **Neon PostgreSQL**. The database module automatically:
- Detects `DATABASE_URL` or `POSTGRES_URL` and uses connection pooling
- Falls back to individual parameters if URL is not provided
- Enables SSL/TLS for secure connections

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Set Root Directory to: `backend`
5. Build Command: `npm run build`
6. Output Directory: (leave empty, Vercel will handle it)
7. Install Command: `npm ci`
8. Click "Deploy"

### Option B: Via CLI

```bash
cd backend
vercel
```

Follow the prompts:
- Link to existing project? (No for first time)
- What's your project's name? (streamsync-backend)
- In which directory is your code located? (./)
- Want to override the settings? (No)

Then:
```bash
vercel --prod
```

## Step 4: Configure Cron Job

The worker service is handled by Vercel Cron Jobs. The `vercel.json` already includes:
- Path: `/api/worker`
- Schedule: Every 5 minutes (`*/5 * * * *`)

If you set `CRON_SECRET`, make sure it matches in your cron job configuration.

## Step 5: Verify Deployment

1. **Health Check:**
   ```bash
   curl https://your-project.vercel.app/health
   ```

2. **Test API:**
   ```bash
   curl https://your-project.vercel.app/auth/register \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","password":"test123"}'
   ```

3. **Check Worker:**
   ```bash
   curl https://your-project.vercel.app/api/worker \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Important Notes

1. **Worker Service**: 
   - Automatically disabled in serverless mode
   - Uses Vercel Cron Jobs instead (every 5 minutes)
   - Access `/api/worker` manually if needed

2. **Database Connections**:
   - Vercel has connection pooling limits
   - Consider using connection pooling (PgBouncer) for high traffic
   - Vercel Postgres includes pooling automatically

3. **Cold Starts**:
   - First request may be slower (cold start)
   - Subsequent requests are fast (warm functions)
   - Consider Vercel Pro for better performance

4. **File Limits**:
   - Serverless functions have 50MB limit
   - Ensure build output is optimized

5. **Environment Variables**:
   - Set separately for Production, Preview, and Development
   - Secrets should never be in code

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard. Common issues:
- Missing dependencies: Check `package.json`
- TypeScript errors: Run `npm run build` locally first
- Missing env vars: Add in Vercel dashboard

### Database Connection Issues

- Verify database allows connections from Vercel IPs
- Check security groups (if using RDS)
- Verify connection string format
- Consider Vercel Postgres for easier setup

### Worker Not Running

- Check Vercel Cron Jobs in dashboard
- Verify `/api/worker` endpoint is accessible
- Check function logs for errors
- Ensure `CRON_SECRET` matches if set

### API Timeouts

- Vercel free tier: 10s timeout
- Vercel Pro: 60s timeout
- Optimize slow endpoints
- Consider splitting large operations

## Project Structure

```
backend/
├── api/
│   ├── index.ts          # Main API handler
│   └── worker.ts         # Cron job handler
├── src/                  # NestJS source code
├── vercel.json           # Vercel configuration
└── package.json
```

## Updates

To update after deployment:
```bash
git push origin main  # Auto-deploys if connected to Vercel
# OR
vercel --prod
```

## Support

- Vercel Docs: https://vercel.com/docs
- NestJS on Vercel: https://vercel.com/guides/deploying-nestjs-with-vercel

