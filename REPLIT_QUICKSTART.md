# Replit Quick Start Guide

Get your Period Tracker app deployed on Replit in **15 minutes**!

## 🎯 What You'll Get

- ✅ Full-stack app running on Replit
- ✅ PostgreSQL database on Neon (free forever)
- ✅ Your own URL: `https://your-app.repl.co`
- ✅ **Total Cost: $0.00/month**

---

## 📋 Quick Setup (5 Steps)

### Step 1: Create Neon Database (3 min)

1. Go to https://neon.tech
2. Sign up (free, no credit card)
3. Click "Create Project" → Name: `period-tracker-db`
4. Copy the connection string (looks like):
   ```
   postgres://user:pass@ep-name.region.aws.neon.tech/neondb?sslmode=require
   ```

---

### Step 2: Push Code to GitHub (2 min)

```bash
cd /Users/ruchidavda/period_tracker

git init
git add .
git commit -m "Deploy to Replit"
git remote add origin https://github.com/YOUR_USERNAME/period-tracker.git
git push -u origin main
```

---

### Step 3: Import to Replit (2 min)

1. Go to https://replit.com
2. Sign up/Login
3. Click "**+ Create Repl**"
4. Select "**Import from GitHub**"
5. Choose your `period-tracker` repo
6. Click "**Import**"

---

### Step 4: Add Environment Variables (3 min)

In Replit, go to **Tools → Secrets** and add:

```
DATABASE_URL = [Your Neon connection string from Step 1]
JWT_SECRET = [Generate with: openssl rand -base64 32]
PORT = 3000
NODE_ENV = production
CORS_ORIGIN = https://period-tracker.YOUR_USERNAME.repl.co
```

---

### Step 5: Build & Run (5 min)

In Replit **Shell** tab:

```bash
# Install dependencies
npm run install:all

# Build everything
npm run build:all
```

Then click the big green **"Run"** button!

---

## ✅ You're Live!

Your app is now at: `https://period-tracker.YOUR_USERNAME.repl.co`

### Final Steps:

1. **Update Frontend URL**:
   - Edit `frontend/.env.production`
   - Set: `VITE_API_URL=https://your-actual-repl-url.repl.co`
   - Run: `npm run build:frontend`
   - Click "Run" again

2. **Update CORS**:
   - Go to Secrets
   - Update `CORS_ORIGIN` with your actual Repl URL
   - Restart app

3. **Test Your App**:
   - Open your Repl URL
   - Sign up for an account
   - Add a period
   - Check predictions!

---

## 🆘 Common Issues

### "Can't connect to database"
→ Check `DATABASE_URL` secret is correct

### "CORS error in browser"
→ Update `CORS_ORIGIN` secret to match your Repl URL exactly

### "Port already in use"
→ Click "Stop" button, wait 10 seconds, click "Run"

---

## 🎁 Keep App Awake (Optional)

Free Replit apps sleep after 1 hour. To keep awake:

1. Sign up at https://uptimerobot.com (free)
2. Add monitor: `https://your-repl.repl.co/health`
3. Set interval: 5 minutes

---

## 📚 Full Documentation

For detailed instructions, see: **REPLIT_DEPLOYMENT.md**

---

**Need help?** Check the full deployment guide or ask in Replit community!
