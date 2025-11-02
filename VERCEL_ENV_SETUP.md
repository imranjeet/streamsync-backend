# ⚠️ VERCEL ENVIRONMENT VARIABLES SETUP

## Critical Error Fix

Your deployment is failing because `DATABASE_URL` is not set in Vercel.

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

This happens when the app tries to connect to localhost instead of your Neon database.

## ✅ Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project: **streamsync-backend**
3. Go to: **Settings** → **Environment Variables**

### Step 2: Add These Variables

Click **"Add New"** and add each variable:

#### 1. DATABASE_URL (Required - Add First!)
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_K7BVwqrZD8LI@ep-wispy-hall-a1ryra17-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development (select all)
```

#### 2. JWT_SECRET
```
Name: JWT_SECRET
Value: [your-secret-minimum-32-characters-long]
Environment: Production, Preview, Development
```

#### 3. JWT_REFRESH_SECRET
```
Name: JWT_REFRESH_SECRET
Value: [your-refresh-secret-minimum-32-characters-long]
Environment: Production, Preview, Development
```

#### 4. NODE_ENV
```
Name: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

#### 5. Firebase Variables
```
Name: FIREBASE_PROJECT_ID
Value: [your-firebase-project-id]

Name: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
[your-private-key-content]
-----END PRIVATE KEY-----
(Include newlines as \n in Vercel)

Name: FIREBASE_CLIENT_EMAIL
Value: [your-service-account@project.iam.gserviceaccount.com]
```

#### 6. YouTube API
```
Name: YOUTUBE_API_KEY
Value: [your-youtube-api-key]

Name: YOUTUBE_CHANNEL_ID
Value: [your-channel-id]
```

### Step 3: Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deployment

## 🔍 How to Verify

After redeployment, check:

1. **Function Logs** in Vercel Dashboard
   - Should see: `[Database] Using DATABASE_URL (...)`
   - Should NOT see: `connect ECONNREFUSED 127.0.0.1:5432`

2. **Health Check**
   ```bash
   curl https://streamsync-backend.vercel.app/health
   ```
   Should return: `{"status":"ok",...}`

## ⚠️ Common Mistakes

1. **Forgot to set DATABASE_URL** - This is the #1 cause of the error
2. **Set in wrong environment** - Make sure to select "Production"
3. **Wrong format** - Must be full PostgreSQL URL with `sslmode=require`
4. **Missing quotes** - Don't add quotes around the value in Vercel dashboard
5. **Not redeploying** - Must redeploy after adding variables

## 📝 Quick Copy-Paste for Vercel

Copy this exact value for DATABASE_URL:
```
postgresql://neondb_owner:npg_K7BVwqrZD8LI@ep-wispy-hall-a1ryra17-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

## 🆘 Still Having Issues?

1. **Check Function Logs** in Vercel Dashboard for detailed error messages
2. **Verify DATABASE_URL format** - Should start with `postgresql://`
3. **Test locally** - Create `.env` file and test with `npm run start:dev`
4. **Check Neon dashboard** - Verify database is running and accessible

## ✅ After Fixing

Once DATABASE_URL is set correctly, your deployment should:
- ✅ Connect to Neon database successfully
- ✅ Return 200 OK for `/health` endpoint
- ✅ Allow API requests to work properly

