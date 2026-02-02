# Vercel Deployment - Frontend Only

## Important Note

Vercel's free tier works best when you deploy **frontend and backend as separate projects**.

## Current Setup

This configuration deploys **frontend only** to Vercel.

### What to Do

You have two options:

### Option 1: Deploy Backend Separately (Recommended)

**Backend Options:**
1. **Render** - Free tier for backend APIs
2. **Railway** - Good for Node.js backends  
3. **Fly.io** - VM-based deployment (if you add payment)

**Then:**
- Deploy frontend to Vercel (static site)
- Update `VITE_API_URL` to point to your backend URL

### Option 2: Use Vercel for Both (Requires Setup)

Convert backend to Vercel serverless functions:
- Move backend routes to `/api` folder
- Convert Express app to serverless format
- More complex setup

---

## Quick Fix for Now

### Deploy Frontend to Vercel:

1. Push the current changes to GitHub
2. In Vercel dashboard, click "Redeploy"
3. Frontend will deploy successfully

### Deploy Backend to Render:

1. Go to https://render.com
2. Sign up (free, no credit card for 90 days)
3. Create "Web Service"
4. Connect your GitHub repo
5. Set root directory: `backend`
6. Build command: `npm install && npm run build`
7. Start command: `npm start`
8. Add environment variables (DATABASE_URL, JWT_SECRET, etc.)

### Update Frontend:

1. Get your Render backend URL (e.g., `https://period-tracker-backend.onrender.com`)
2. In Vercel: Settings → Environment Variables
3. Set `VITE_API_URL` to your Render URL
4. Redeploy frontend

---

## Why This Approach?

Vercel is **amazing for frontend** (React, Vue, etc.) but:
- Serverless functions have cold starts
- Complex backend better on dedicated services
- Render/Railway better for Express apps

**Result:** Best of both worlds!
- Vercel: Fast frontend (CDN, no cold starts)
- Render: Reliable backend (always-on or free tier)

---

## Next Steps

1. **Push current changes to GitHub**
   ```bash
   git add .
   git commit -m "Fix Vercel config for frontend-only"
   git push origin main
   ```

2. **Redeploy in Vercel** - Frontend will work

3. **Deploy backend to Render** - Follow guide above

4. **Update VITE_API_URL** in Vercel to point to Render

---

**Your frontend will be live in 5 minutes on Vercel!** 🚀

Backend deployment to Render will take another 10 minutes.
