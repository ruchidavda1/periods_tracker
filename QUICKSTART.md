# Period Tracker - Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v18+ installed (`node --version`)
- ✅ PostgreSQL v14+ installed (`psql --version`)
- ✅ npm installed (`npm --version`)

## 5-Minute Setup

### Step 1: Database Setup (2 minutes)

```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
# OR
sudo systemctl start postgresql    # Linux

# Create database
psql postgres -c "CREATE DATABASE period_tracker;"
```

### Step 2: Backend Setup (2 minutes)

```bash
cd backend

# Install and setup
npm install

# Copy environment file
cp .env.example .env

# Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start server (keep this terminal open)
npm run dev
```

✅ Backend should be running on http://localhost:3000

### Step 3: Frontend Setup (1 minute)

Open a NEW terminal:

```bash
cd frontend

# Install and start
npm install
npm run dev
```

✅ Frontend should be running on http://localhost:5173

### Step 4: Login

Open browser to http://localhost:5173

**Demo Credentials:**
- Email: `demo@example.com`
- Password: `password123`

## 🎉 You're Ready!

The demo account includes 7 periods over 6 months, so you'll immediately see:
- Next period prediction
- Ovulation window
- Cycle statistics
- Period history

## Testing the Prediction Algorithm

1. **View Current Prediction** - See the prediction card on the dashboard
2. **Add New Period** - Click "Log Period" and add a new entry
3. **Watch Predictions Update** - Predictions recalculate based on your data
4. **Check Confidence Score** - Notice how it changes with data quality

## Common Issues

**Database Error?**
```bash
# Reset database
cd backend
npm run prisma:migrate reset
npm run prisma:seed
```

**Port Already in Use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Dependencies Issue?**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Explore the prediction algorithm in `backend/src/services/predictionService.ts`

## API Testing (Optional)

Test APIs directly using curl:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'

# Get prediction (replace TOKEN)
curl http://localhost:3000/api/predictions/next-period \
  -H "Authorization: Bearer TOKEN"
```

## Development Tools

**Database GUI:**
```bash
cd backend
npm run prisma:studio
```
Opens Prisma Studio at http://localhost:5555

**API Health Check:**
http://localhost:3000/health

---

Need help? Check the troubleshooting section in README.md
