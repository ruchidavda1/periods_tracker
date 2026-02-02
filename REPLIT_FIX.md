# Replit Deployment Fix

## What Was Changed

✅ **Switched from Autoscale to VM deployment** (supports multi-process)
✅ **Fixed port configuration** (backend internal, frontend external)
✅ **Simplified build and start scripts**

## Configuration Changes

### `.replit` file:
- **Deployment target**: Changed to `gce` (VM)
- **Ports**: 
  - Backend: Port 3000 → External 80 (main web traffic)
  - Frontend: Port 5173 → External 8080 (preview)
- **Run command**: `npm run build && npm start`

### `package.json`:
- **build**: Installs and builds both backend + frontend
- **start**: Runs both concurrently

## Steps to Deploy in Replit

### Option 1: Update Files in Replit (Easiest)

1. **In Replit Editor**, open these files and copy the new content:

   **`.replit`** - Copy from `/Users/ruchidavda/period_tracker/.replit`
   
   **`package.json`** - Copy from `/Users/ruchidavda/period_tracker/package.json`

2. **Save both files** (Ctrl+S / Cmd+S)

3. **Go to Deployments tab**

4. **Create new deployment**

---

### Option 2: Pull from GitHub (If you can commit)

In your **local terminal** (not Cursor):

```bash
cd /Users/ruchidavda/period_tracker

# Commit changes
git add .replit package.json
git commit -m "Fix Replit VM deployment config"
git push origin main
```

Then in **Replit**:
1. Go to Version Control
2. Click "Pull"
3. Go to Deployments
4. Create new deployment

---

## What Happens During Deployment

1. **Build Phase**:
   ```
   npm install (root dependencies - concurrently)
   npm run build:
     → cd backend && npm install → tsc (compile TypeScript)
     → cd frontend && npm install → vite build (compile React)
   ```

2. **Run Phase**:
   ```
   npm start:
     → Backend starts on port 3000 (mapped to external 80)
     → Frontend starts on port 5173 (mapped to external 8080)
   ```

3. **Access**:
   - Main app: `https://your-repl.repl.co` (port 80 → backend)
   - Frontend: `https://your-repl.repl.co:8080` (port 8080 → frontend)

---

## Expected Deployment Output

```
✓ Installing packages
✓ Building backend (TypeScript compilation)
✓ Building frontend (Vite build)
✓ Starting backend on port 3000
✓ Starting frontend on port 5173
✓ Deployment successful
```

---

## If Deployment Still Fails

### Check Logs For:

**"Missing script"** → Make sure `package.json` has `"build"` and `"start"` scripts

**"Port in use"** → Stop existing Repl and redeploy

**"Module not found"** → Build phase didn't complete - check if `backend/dist` and `frontend/dist` exist

**"concurrently not found"** → Root `npm install` didn't run - add to dependencies

---

## Alternative: Serve Frontend from Backend

If VM deployment is still problematic, we can make the backend serve the frontend static files (single process, simpler deployment). Let me know if you want this approach!

---

## Current Status

✅ Configuration files updated locally
⚠️ Need to update in Replit (manually or via git pull)
🚀 Ready to deploy once files are updated

---

**Next step:** Update the files in Replit and try deploying again!
