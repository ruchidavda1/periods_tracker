# Replit Deployment Guide

Complete guide to deploy your Period Tracker application on Replit with PostgreSQL database.

## Overview

Your app will be deployed as a single Replit project with:
- **Backend**: Node.js/Express API (Port 3000)
- **Frontend**: React app served via Vite (Port 80/5173)
- **Database**: PostgreSQL via Neon (free tier)

## Prerequisites

- GitHub account (to import your code)
- Replit account (free) - Sign up at https://replit.com
- Neon account (free) - Sign up at https://neon.tech

---

## Part 1: Set Up PostgreSQL Database (Neon)

### Step 1: Create Neon Account

1. Go to https://neon.tech
2. Click "Sign Up" (free forever tier)
3. Sign up with GitHub, Google, or email

### Step 2: Create Database

1. Click "**Create Project**"
2. Project name: `period-tracker-db`
3. PostgreSQL version: **15** (recommended)
4. Region: Choose closest to you
5. Click "**Create Project**"

### Step 3: Save Connection String

After creation, you'll see a connection string like:

```
postgres://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Save this!** You'll need it for Replit environment variables.

---

## Part 2: Deploy on Replit

### Option A: Import from GitHub (Recommended)

#### Step 1: Push Code to GitHub

If you haven't already:

```bash
cd /Users/ruchidavda/period_tracker

# Initialize git (if not done)
git init
git add .
git commit -m "Prepare for Replit deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/period-tracker.git
git branch -M main
git push -u origin main
```

#### Step 2: Import to Replit

1. Go to https://replit.com
2. Click "**+ Create Repl**"
3. Select "**Import from GitHub**"
4. Authorize GitHub if needed
5. Select your `period-tracker` repository
6. Replit will auto-detect the configuration
7. Click "**Import from GitHub**"

---

### Option B: Upload Code Directly

1. Go to https://replit.com
2. Click "**+ Create Repl**"
3. Select "**Node.js**" as template
4. Name: `period-tracker`
5. Click "**Create Repl**"
6. In the Replit editor:
   - Delete default files
   - Use "**Upload folder**" to upload your `period_tracker` folder

---

## Part 3: Configure Environment Variables

### Step 1: Open Secrets (Environment Variables)

In your Replit project:
1. Click the "**Tools**" button (left sidebar)
2. Click "**Secrets**" (lock icon)

### Step 2: Add Environment Variables

Add these secrets one by one:

#### Backend Secrets

**1. DATABASE_URL**
```
Value: [Your Neon connection string from Part 1]
Example: postgres://user:pass@ep-name.region.aws.neon.tech/neondb?sslmode=require
```

**2. JWT_SECRET**
```
Value: [Generate a random string]
Use this command to generate:
openssl rand -base64 32
```

**3. PORT**
```
Value: 3000
```

**4. NODE_ENV**
```
Value: production
```

**5. CORS_ORIGIN**
```
Value: https://period-tracker.YOUR_USERNAME.repl.co
(You'll get the exact URL after first deployment)
```

---

## Part 4: Install Dependencies

### Step 1: Open Shell

In Replit, click "**Shell**" tab (bottom)

### Step 2: Install All Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

This will take 2-3 minutes.

---

## Part 5: Build and Deploy

### Step 1: Build the Application

In the Shell:

```bash
npm run build:all
```

This compiles both backend (TypeScript → JavaScript) and frontend (React → static files).

### Step 2: Update Frontend API URL

1. Get your Replit URL (top right, looks like: `https://period-tracker.username.repl.co`)
2. Edit `frontend/.env.production`:
   ```
   VITE_API_URL=https://period-tracker.username.repl.co
   ```
3. Rebuild frontend:
   ```bash
   npm run build:frontend
   ```

### Step 3: Update CORS_ORIGIN Secret

1. Go to Secrets (Tools → Secrets)
2. Update `CORS_ORIGIN` to your Replit URL
3. Example: `https://period-tracker.username.repl.co`

### Step 4: Start the Application

Click the big green "**Run**" button at the top!

Or in Shell:
```bash
npm run start:all
```

Your app should start:
- Backend: Running on port 3000
- Frontend: Running on port 5173 (proxied to port 80)
- Database: Connected to Neon PostgreSQL

---

## Part 6: Access Your App

### Your App URL

After deployment, your app will be available at:

```
https://period-tracker.YOUR_USERNAME.repl.co
```

### Test the Deployment

1. Open your Replit URL
2. You should see the Period Tracker login page
3. Try registering a new account
4. Log in and test adding a period

---

## Keeping Your App Always On

### Free Tier Limitations

- Replit free tier apps **sleep after 1 hour of inactivity**
- They wake up when someone visits (takes 5-10 seconds)

### Option 1: Replit Always On (Paid)

- $7/month per Repl
- Keeps app running 24/7
- No cold starts

### Option 2: Use UptimeRobot (Free)

Keep your app awake for free:

1. Sign up at https://uptimerobot.com (free)
2. Add a new monitor:
   - Monitor Type: **HTTP(s)**
   - URL: `https://your-repl.repl.co/health`
   - Monitoring Interval: **5 minutes**
3. UptimeRobot will ping your app every 5 minutes, keeping it awake

---

## Troubleshooting

### Database Connection Error

**Error**: `Unable to connect to database`

**Fix**:
1. Check `DATABASE_URL` secret is correct
2. Ensure Neon database is running (check neon.tech dashboard)
3. Verify connection string has `?sslmode=require` at the end

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Fix**:
1. Stop the current process (Ctrl+C in Shell)
2. Click "Stop" button in Replit
3. Wait 10 seconds
4. Click "Run" again

### Build Errors

**Error**: TypeScript compilation errors

**Fix**:
```bash
# Clean and rebuild
rm -rf backend/dist frontend/dist
npm run build:all
```

### Frontend Shows CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Fix**:
1. Check `CORS_ORIGIN` secret matches your Replit URL exactly
2. Restart the app after changing secrets
3. Clear browser cache

### Frontend Can't Connect to Backend

**Fix**:
1. Ensure `frontend/.env.production` has correct Replit URL
2. Rebuild frontend: `npm run build:frontend`
3. Restart app

---

## Updating Your App

### Making Code Changes

1. Edit files in Replit editor
2. Rebuild if needed:
   ```bash
   # For backend changes
   npm run build:backend
   
   # For frontend changes
   npm run build:frontend
   ```
3. Click "Run" to restart

### Syncing with GitHub

If you imported from GitHub:

```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build:all

# Restart app
```

---

## Database Management

### Viewing Database

1. Go to https://console.neon.tech
2. Select your project
3. Click "**SQL Editor**"
4. Run queries:

```sql
-- View all users
SELECT * FROM users;

-- View all periods
SELECT * FROM periods ORDER BY start_date DESC;

-- Count users
SELECT COUNT(*) FROM users;
```

### Backup Database

Neon automatically backs up your database. To download:

1. Go to Neon console
2. Click "**Backups**" tab
3. Download snapshot

---

## Monitoring

### View Logs

In Replit:
1. Click "**Console**" tab
2. See real-time logs for both backend and frontend

### Check App Status

Visit your app's health endpoint:
```
https://your-repl.repl.co/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-02T..."
}
```

---

## Cost Summary

### Free Tier (What You Get)

**Replit Free:**
- ✅ Unlimited public Repls
- ✅ 0.5GB RAM
- ✅ 0.5 vCPUs
- ✅ 1GB storage
- ⚠️ Apps sleep after 1 hour inactivity

**Neon Free:**
- ✅ 0.5GB storage
- ✅ 1 project
- ✅ Unlimited databases
- ✅ Auto-suspend compute after 5 minutes inactivity
- ✅ Free forever

**Total Cost: $0/month** 🎉

### Paid Options (Optional)

**Replit Hacker ($7/month):**
- Private Repls
- Always-on Repls
- 2GB RAM
- More compute power

**Neon Pro ($19/month):**
- 10GB storage
- More compute
- Faster queries

---

## Advanced: Custom Domain

### Add Custom Domain to Replit

1. Upgrade to Replit Hacker plan ($7/month)
2. Go to Repl settings
3. Click "**Domains**"
4. Add your custom domain
5. Update DNS records at your domain registrar

---

## Support

- **Replit Docs**: https://docs.replit.com
- **Replit Community**: https://ask.replit.com
- **Neon Docs**: https://neon.tech/docs
- **Neon Discord**: https://discord.gg/neon

---

## Quick Reference

### Useful Commands

```bash
# Install dependencies
npm run install:all

# Build everything
npm run build:all

# Start app (production)
npm run start:all

# Development mode
npm run dev

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

### Important URLs

After deployment:
- **App**: `https://period-tracker.YOUR_USERNAME.repl.co`
- **API**: `https://period-tracker.YOUR_USERNAME.repl.co/api`
- **Health**: `https://period-tracker.YOUR_USERNAME.repl.co/health`

---

## Next Steps

1. ✅ Deploy your app following this guide
2. ✅ Test all features (signup, login, add periods, predictions)
3. ✅ Set up UptimeRobot to keep app awake (optional)
4. ✅ Share your app URL!

---

**Your Period Tracker is ready to deploy on Replit!** 🚀

Follow the steps above and you'll be live in 15-20 minutes.
