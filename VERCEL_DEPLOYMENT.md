# Vercel Deployment Guide

Complete guide to deploy your Period Tracker application to Vercel with automatic GitHub integration.

## Why Vercel?

✅ **Truly free forever** - No credit card required for hobby projects
✅ **Unlimited builds** - No daily limits like Replit
✅ **Auto-deploy from GitHub** - Push code → automatically deployed
✅ **Fast builds** - 2-3 minutes vs 5-10 minutes
✅ **No cold starts** - Always fast
✅ **Built-in CI/CD** - Automatic preview deployments for PRs
✅ **Free SSL** - Automatic HTTPS
✅ **Global CDN** - Fast everywhere

---

## What Was Set Up

✅ `vercel.json` - Vercel configuration
✅ `.vercelignore` - Files to exclude from deployment
✅ Updated `frontend/package.json` - Added vercel-build script
✅ Updated `backend/package.json` - Added vercel-build script
✅ Updated `.env.production` - API routes use `/api` prefix
✅ Cleaned up all Replit files

---

## Architecture on Vercel

```
┌────────────────────────────────────────────┐
│           Vercel Platform                  │
├────────────────────────────────────────────┤
│                                            │
│  Frontend (React/Vite)                     │
│  ├── Static files served from CDN          │
│  └── Routes: /, /login, etc.              │
│                                            │
│  Backend (Node.js/Express)                 │
│  ├── Serverless Functions                  │
│  └── Routes: /api/*                        │
│                                            │
│  Database: Neon PostgreSQL (external)      │
│  └── Connection via DATABASE_URL           │
│                                            │
└────────────────────────────────────────────┘
```

---

## Deployment Steps

### Step 1: Sign Up for Vercel

1. Go to **https://vercel.com**
2. Click "**Sign Up**"
3. Choose "**Continue with GitHub**"
4. Authorize Vercel to access your GitHub

**No credit card required!** ✅

---

### Step 2: Import Your Project

1. After signing in, click "**Add New...**" → "**Project**"

2. Find your `period-tracker` (or `periods_tracker`) repository

3. Click "**Import**"

4. Vercel will auto-detect:
   - ✅ Framework: Node.js
   - ✅ Build Command: Auto-detected
   - ✅ Output Directory: Auto-detected

---

### Step 3: Configure Environment Variables

Before deploying, add your environment variables:

#### In Vercel Dashboard:

Click "**Environment Variables**" section and add:

**1. DATABASE_URL**
```
Value: [Your Neon PostgreSQL connection string]
postgresql://neondb_owner:npg_UoM9jXKCtG1s@ep-odd-sea-aia90vu8-pooler.c-4.us-east-1.aws.neon.tech/period-tracker-db?sslmode=require
```

**2. JWT_SECRET**
```
Value: [Generate a random string]
# Use this command: openssl rand -base64 32
```

**3. NODE_ENV**
```
Value: production
```

**4. PORT** (optional, Vercel handles this)
```
Value: 3000
```

**5. CORS_ORIGIN**
```
Value: https://your-project-name.vercel.app
# Note: Update this after first deployment with actual URL
```

---

### Step 4: Deploy!

1. Click "**Deploy**" button

2. Vercel will:
   - ✅ Install dependencies
   - ✅ Build backend (TypeScript → JavaScript)
   - ✅ Build frontend (React → static files)
   - ✅ Deploy to global CDN
   - ✅ Give you a live URL!

**Deployment time:** 2-3 minutes ⚡

---

### Step 5: Update CORS_ORIGIN

After first deployment:

1. Copy your Vercel URL (e.g., `https://period-tracker-abc123.vercel.app`)

2. Go to **Settings** → **Environment Variables**

3. Update `CORS_ORIGIN` with your actual URL

4. **Redeploy**: Deployments → Three dots → Redeploy

---

## Your Live URLs

After deployment:

**Production:**
- `https://your-project-name.vercel.app` - Your live app
- `https://your-project-name.vercel.app/api/health` - API health check

**Preview (for PRs):**
- Every pull request gets a unique preview URL
- Test changes before merging!

---

## Auto-Deploy from GitHub

### Already Set Up! 🎉

Vercel automatically watches your GitHub repo:

```
1. You push code to GitHub (any branch)
       ↓
2. Vercel automatically detects the push
       ↓
3. Builds and deploys
       ↓
4. Comments on PR with preview URL
       ↓
5. Merge to main → Auto-deploys to production
```

**No manual steps needed!**

---

## How to Make Changes

### Development Workflow

```bash
# 1. Make changes locally
echo "New feature" >> backend/src/index.ts

# 2. Test locally
cd backend && npm run dev
cd frontend && npm run dev

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# 4. Vercel automatically deploys! 🚀
```

---

## Features You Get

### 1. Automatic Preview Deployments

Every PR gets its own URL:
```
PR #5 → https://period-tracker-git-feature-branch.vercel.app
```

Test before merging!

### 2. Instant Rollbacks

Made a mistake?
1. Go to **Deployments**
2. Find previous working deployment
3. Click "**Promote to Production**"

Done in seconds!

### 3. Real-time Logs

View logs for any deployment:
- Build logs
- Function logs (API calls)
- Error tracking

### 4. Analytics (Free)

Built-in analytics:
- Page views
- Performance metrics
- Web Vitals

---

## Environment Variables Management

### Add New Variable

1. **Settings** → **Environment Variables**
2. Click "**Add**"
3. Name: `NEW_VAR`
4. Value: `value`
5. Environment: Production, Preview, Development
6. **Save**
7. **Redeploy** to apply changes

### Update Existing Variable

1. Find the variable
2. Click "**Edit**"
3. Update value
4. **Save**
5. **Redeploy**

---

## Custom Domain (Optional)

Want your own domain? Easy!

1. **Settings** → **Domains**
2. Click "**Add**"
3. Enter your domain (e.g., `periodtracker.com`)
4. Follow DNS instructions
5. Vercel handles SSL automatically!

**Cost:** Domain registration only (~$12/year), Vercel hosting free!

---

## Vercel CLI (Optional)

Install for local development:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy from CLI
vercel

# Deploy to production
vercel --prod
```

---

## Troubleshooting

### Build Fails

**Check build logs:**
1. Click on failed deployment
2. View "**Build Logs**"
3. Fix errors in code
4. Push to GitHub → Auto-redeploys

**Common issues:**
- TypeScript errors → Fix in code
- Missing dependencies → Check package.json
- Environment variables → Check they're set

---

### API Routes Not Working

**Issue:** `/api/*` routes return 404

**Fix:**
1. Check `vercel.json` routes configuration
2. Verify backend builds successfully
3. Check Function logs for errors

---

### Database Connection Fails

**Issue:** Can't connect to Neon

**Fix:**
1. Verify `DATABASE_URL` is set correctly
2. Check Neon database is running
3. Ensure connection string has `?sslmode=require`
4. Check backend logs for specific error

---

### CORS Errors

**Issue:** Frontend can't call API

**Fix:**
1. Update `CORS_ORIGIN` environment variable
2. Set to your Vercel URL
3. Redeploy

---

## Monitoring Your App

### View Deployment Status

**Dashboard → Deployments**
- See all deployments
- Build time
- Status (success/failed)
- Logs

### Function Logs

**Deployment → Functions**
- Real-time API logs
- Error tracking
- Performance metrics

### Analytics

**Dashboard → Analytics**
- Page views
- Performance
- Top pages
- Visitors

---

## Cost Breakdown

### Free Tier (Hobby)

**What you get:**
- ✅ Unlimited deployments
- ✅ Unlimited bandwidth (100GB)
- ✅ Unlimited projects
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ Analytics
- ✅ CDN
- ✅ Serverless Functions (100GB-hrs)

**Your usage:**
- Frontend: Static files (minimal)
- Backend: Serverless functions (well within limits)
- Database: External (Neon - free)

**Total Cost: $0.00/month** 🎉

### If You Exceed Free Tier

Very unlikely, but if you do:
- Pro plan: $20/month
- Includes: More bandwidth, faster builds, more team features

**Your app won't come close to limits!**

---

## Advanced Features

### Environment-Specific Builds

Test different configs:
- Production: Real database
- Preview: Test database
- Development: Local database

### CI/CD Integration

Already set up! Every push:
1. Runs build
2. Runs checks
3. Deploys if successful
4. Notifies you

### Team Collaboration

Invite team members:
- **Settings** → **Team**
- Add by email
- Set permissions

---

## Comparison: Replit vs Vercel

| Feature | Replit | Vercel |
|---------|--------|--------|
| **Cost** | Free (limited) | Free (generous) |
| **Build Limits** | 5/day | Unlimited |
| **Build Speed** | 5-10 min | 2-3 min |
| **Cold Starts** | Yes | No |
| **Auto-Deploy** | Manual | Automatic |
| **Preview URLs** | No | Yes (PRs) |
| **Custom Domain** | $7/month | Free |
| **SSL** | Included | Automatic |
| **Global CDN** | No | Yes |

**Winner: Vercel** 🏆

---

## Next Steps

1. ✅ Sign up for Vercel
2. ✅ Import your GitHub repo
3. ✅ Add environment variables
4. ✅ Deploy!
5. ✅ Test your app
6. ✅ Update CORS_ORIGIN
7. ✅ Redeploy
8. ✅ Share your app!

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Community**: https://github.com/vercel/vercel/discussions
- **Status**: https://vercel-status.com

---

## Summary

✅ **No credit card required**
✅ **Unlimited builds**
✅ **Auto-deploy from GitHub**
✅ **Fast and reliable**
✅ **Perfect for your project**

**Your Period Tracker is ready to deploy on Vercel!** 🚀

Just follow the steps above and you'll be live in 10 minutes!
