# Vercel Quick Start

Deploy your Period Tracker to Vercel in **5 steps, 10 minutes**!

## 🚀 Quick Deploy (5 Steps)

### 1. Sign Up for Vercel (2 min)

1. Go to **https://vercel.com**
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

✅ **No credit card required!**

---

### 2. Import Your Project (1 min)

1. Click "Add New..." → "Project"
2. Find `period-tracker` repository
3. Click "Import"

---

### 3. Add Environment Variables (3 min)

In Vercel, add these secrets:

**DATABASE_URL**
```
postgresql://neondb_owner:npg_UoM9jXKCtG1s@ep-odd-sea-aia90vu8-pooler.c-4.us-east-1.aws.neon.tech/period-tracker-db?sslmode=require
```

**JWT_SECRET**
```
[Generate with: openssl rand -base64 32]
```

**NODE_ENV**
```
production
```

**CORS_ORIGIN** (temporary, will update)
```
https://your-app.vercel.app
```

---

### 4. Deploy! (2 min)

1. Click "Deploy"
2. Wait 2-3 minutes
3. Get your live URL!

---

### 5. Update CORS (2 min)

1. Copy your Vercel URL
2. Settings → Environment Variables
3. Update `CORS_ORIGIN` to your actual URL
4. Deployments → Redeploy

---

## ✅ You're Live!

Your app is now at: `https://your-app.vercel.app`

---

## 🎯 Auto-Deploy is Already Set Up!

From now on:

```bash
git push origin main
# Vercel automatically deploys! 🚀
```

---

## 📚 Full Guide

See `VERCEL_DEPLOYMENT.md` for:
- Detailed instructions
- Troubleshooting
- Advanced features
- Custom domains

---

## 💡 Why Vercel?

✅ Free forever (no daily limits!)
✅ Unlimited builds
✅ Auto-deploy from GitHub
✅ Fast (2-3 min builds)
✅ No cold starts
✅ Preview deployments for PRs

---

**That's it! You're deployed!** 🎉
