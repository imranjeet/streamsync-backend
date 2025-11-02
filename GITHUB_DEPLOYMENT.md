# GitHub → Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying, ensure all files are committed to GitHub:

### Required Files (Must be in Git):
- ✅ `vercel.json` - Vercel configuration
- ✅ `api/index.ts` - Main API handler
- ✅ `api/worker.ts` - Cron job handler  
- ✅ `package.json` - Dependencies and scripts
- ✅ `.env.example` - Environment variables template
- ✅ `src/` - All source code
- ✅ `tsconfig.json` - TypeScript configuration

### Files That Should NOT be in Git (already in .gitignore):
- ❌ `.env` - Actual environment variables (use Vercel Dashboard)
- ❌ `node_modules/` - Dependencies
- ❌ `dist/` - Build output
- ❌ `.vercel/` - Vercel local config

## Step 1: Commit All Files to GitHub

```bash
# If not already a git repository, initialize it
cd /Users/ranjeet/Desktop/STREAMSYNC_LITE_ASSIGNMENT
git init
git add .
git commit -m "Setup backend for Vercel deployment"

# Connect to GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**Important:** Make sure these files are committed:
- `backend/vercel.json`
- `backend/api/index.ts`
- `backend/api/worker.ts`
- `backend/.env.example` (template, not actual secrets)
- `backend/package.json`
- All files in `backend/src/`

## Step 2: Deploy via Vercel Dashboard

### Option A: New Project from GitHub (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Repository:**
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project Settings:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend` ⚠️ **CRITICAL: Set this!**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** Leave empty (Vercel handles serverless functions)
   - **Install Command:** `npm ci` (recommended for production)
   - **Node.js Version:** 18.x or 20.x (auto-detected)

4. **Environment Variables:**
   Click "Environment Variables" and add:

   ```env
   # Database (Neon PostgreSQL)
   DATABASE_URL=postgresql://neondb_owner:npg_S8aCLEpuJ0ek@ep-withered-mud-a1zuocqa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   
   # JWT
   JWT_SECRET=your-secret-minimum-32-characters-long
   JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
   
   # Server
   NODE_ENV=production
   
   # Firebase
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   
   # YouTube
   YOUTUBE_API_KEY=your-api-key
   YOUTUBE_CHANNEL_ID=your-channel-id
   
   # Optional
   CORS_ORIGIN=*
   CRON_SECRET=your-cron-secret-optional
   ```

   **Important:** Set these for **Production**, **Preview**, and **Development** environments (or at least Production).

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your API will be live at `https://your-project.vercel.app`

## Step 3: Verify Deployment

### Health Check:
```bash
curl https://your-project.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### Test API Endpoint:
```bash
curl https://your-project.vercel.app/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

### Verify Cron Job:
- Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
- You should see: `/api/worker` scheduled every 5 minutes
- Check Function Logs to see if cron is executing

## Step 4: Auto-Deployment from GitHub

Once connected, every push to your main branch will automatically trigger a new deployment:

```bash
git add .
git commit -m "Update code"
git push origin main
# Vercel will automatically deploy!
```

## Important Configuration Notes

### 1. Root Directory is Critical
⚠️ **MUST SET:** `Root Directory: backend`
- Without this, Vercel will look for files in the repo root
- Your `vercel.json` and `api/` folder are in `backend/`

### 2. Build Command
- `npm run build` - Builds TypeScript to JavaScript
- This is required even though we use `api/*.ts` (Vercel compiles TypeScript)

### 3. Output Directory
- Leave empty for serverless functions
- Vercel doesn't need a traditional build output

### 4. Cron Jobs
- Automatically configured from `vercel.json`
- Runs every 5 minutes: `*/5 * * * *`
- Check in Dashboard → Settings → Cron Jobs

### 5. Environment Variables
- Never commit `.env` files
- Always set variables in Vercel Dashboard
- Use `.env.example` as a template

## Troubleshooting

### Build Fails: "Cannot find module"
**Solution:** Ensure `Root Directory` is set to `backend` in project settings.

### Build Fails: "TypeScript errors"
**Solution:** Run `npm run build` locally first to check for errors.

### Database Connection Error
**Solution:** 
- Verify `DATABASE_URL` is set correctly in Vercel
- Check Neon database allows external connections
- Ensure SSL mode is correct (`sslmode=require`)

### Cron Job Not Running
**Solution:**
- Check Vercel Dashboard → Settings → Cron Jobs
- Verify `vercel.json` has correct cron configuration
- Check Function Logs for errors

### API Returns 404
**Solution:**
- Verify `api/index.ts` exists in `backend/api/`
- Check `vercel.json` routes are correct
- Ensure Root Directory is set to `backend`

## Project Structure for Vercel

```
your-repo/
├── backend/              ← Root Directory in Vercel
│   ├── api/
│   │   ├── index.ts      ← Main API handler
│   │   └── worker.ts      ← Cron job handler
│   ├── src/              ← NestJS source code
│   ├── vercel.json       ← Vercel configuration
│   ├── package.json
│   └── .env.example
└── streamsync_lite/      ← Flutter app (not deployed to Vercel)
```

## Next Steps After Deployment

1. **Update Frontend API URL:**
   - Change your Flutter app's base URL to: `https://your-project.vercel.app`
   - Update `api_client.dart` or your API configuration

2. **Monitor Deployments:**
   - Vercel Dashboard shows all deployments
   - Function logs show API calls and errors

3. **Set Up Custom Domain (Optional):**
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Dashboard: https://vercel.com/dashboard
- NestJS on Vercel: https://vercel.com/guides/deploying-nestjs-with-vercel

