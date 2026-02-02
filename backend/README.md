# Period Tracker Backend - Sequelize + PostgreSQL

## 🚀 Quick Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env file (use your macOS username)
cp .env.example .env

# Edit .env:
# DB_USER=ruchidavda  (your username)
# DB_PASSWORD=        (leave empty)
# DB_NAME=period_tracker

# 3. Create database
createdb period_tracker

# 4. Run migrations
npm run db:migrate

# 5. Seed demo data
npm run db:seed

# 6. Start server
npm run dev
```

Server runs on `http://localhost:3000`

## 📝 Demo Credentials

- **Email**: demo@example.com
- **Password**: password123

## 🛠 Database Commands

```bash
npm run db:migrate        # Run migrations
npm run db:migrate:undo   # Undo last migration
npm run db:seed           # Seed data
npm run db:seed:undo      # Undo seeds
npm run db:reset          # Reset everything
```

## 🎯 Tech Stack

- **ORM**: Sequelize 6
- **Database**: PostgreSQL
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js

## 📊 Features

- ✅ Period tracking
- ✅ Smart prediction algorithm
- ✅ Ovulation tracking
- ✅ Cycle analytics
- ✅ JWT authentication

## 🔧 Troubleshooting

### Database Connection Error

If you get "role does not exist":

```bash
# Use your macOS username in .env
DB_USER=ruchidavda  # Your actual username
DB_PASSWORD=        # Leave empty
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Reset Database

```bash
npm run db:reset
```

## 📚 API Endpoints

Same as before - all endpoints work identically:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/periods`
- `POST /api/periods`
- `GET /api/predictions/next-period`
- `GET /api/predictions/calendar`

See main README.md for full API documentation.
