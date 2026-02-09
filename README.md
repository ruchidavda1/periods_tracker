# Period Tracker

A full-stack period tracking app with smart predictions. Built this to learn more about health tech and prediction algorithms.

**Live:** [https://periods-tracker-xi.vercel.app](https://periods-tracker-xi.vercel.app)

## What it does

- Log periods with dates and flow intensity and symptoms tracking
- Predicts your next period using weighted averages (gets better with more data)
- Shows ovulation windows
- Tracks symptoms and patterns
- Gives confidence scores based on how regular your cycles are

The prediction algorithm is statistical and based on the weighted averages of the user's cycles it weights recent cycles more heavily than older ones, handles irregular cycles, and adjusts confidence based on data quality.

## Stack

**Backend:**

- Node.js + TypeScript + Express
- PostgreSQL (Neon for hosting)
- Redis for caching predictions
- Sequelize ORM
- Jest for testing

**Frontend:**

- React + TypeScript
- Vite
- Tailwind CSS
- Axios

**Deployment:**
Reasons for choosing these services: All free tier services.

- Frontend: Vercel
- Backend: Render
- Database: Neon (serverless Postgres)
- CI/CD: GitHub Actions

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (or use Neon - see below)

### Using Neon (easier)

1. Sign up at [neon.tech](https://neon.tech) and create a project
2. Grab your connection string from the dashboard

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Add your database URL and JWT secret
```

Your `.env` should have:

```
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=some_random_string
REDIS_URL=redis_url 
PORT=3000
```

Start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5000`, backend on `http://localhost:3000`.

## How the Prediction Works

The algorithm uses weighted moving averages - basically, your last 3 cycles count for 50% of the prediction, the next 3 count for 30%, and older cycles get 20%.

It calculates:

- **Cycle length prediction** - weighted average of your past cycles
- **Regularity** - standard deviation of cycle lengths (low = regular, high = irregular)
- **Confidence score** - based on regularity + amount of data + how typical your cycle length is

Example: if you have 8 cycles averaging 28 days with a standard deviation of 2 days, you would get about 85% confidence (regular cycles, good amount of data).

For irregular cycles, the confidence drops but it still tries to predict based on trends.

**Detailed prediction algorithm breakdown:** Check out [DOCUMENTATION.md](./DOCUMENTATION.md) for the complete algorithm breakdown with example.

## Database Schema

```
users
├── periods (one-to-many)
│   └── symptoms (one-to-many)
├── predictions (one-to-many)
└── user_settings (one-to-one)
```

Indexes on user_id and foreign keys for fast queries. Composite index on (user_id, start_date) for date range queries.

## Testing

```bash
cd backend
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

Tests cover:

- Prediction algorithm with different cycle patterns
- Edge cases (insufficient data, irregular cycles)
- Flow intensity predictions
- Confidence score calculations

## Performance Optimizations

**Caching:** Redis caches predictions for 1 hour. Cache hit rate is around 85-90%, which means most requests do not hit the database. Invalidates automatically when you add/update periods.

**Query optimization:**

- Use of indexes and composite indexes(implemented in the database schema)
- Only fetch needed columns (sequelize feature) (Implemented)
- Fixed N+1 queries by using eager loading (2 queries instead of 100+) (sequelize feature) (Implemented)
- Pagination for long lists (Server side / Client side)
- Connection pooling (sequelize feature) (Implemented)

See [QUERY_OPTIMIZATION.md](./QUERY_OPTIMIZATION.md) for details on what we can optimize if need to scale the app.

## API Endpoints

### Auth

- `POST /api/auth/register` - create account
- `POST /api/auth/login` - login

### Periods

- `POST /api/periods` - log a period
- `GET /api/periods` - get your history (paginated)
- `PUT /api/periods/:id` - update
- `DELETE /api/periods/:id` - delete

### Predictions

- `GET /api/predictions/next-period` - next cycle prediction (cached)
- `GET /api/predictions/calendar?months=3` - future cycles for calendar view

### Symptoms

- `POST /api/periods/:id/symptoms` - add symptom
- `GET /api/symptoms/patterns` - get symptom patterns analysis
- `DELETE /api/symptoms/:id` - remove symptom

All protected endpoints need JWT token in Authorization header.

## Security

- Passwords hashed with bcrypt and use of salt
- JWT tokens (7 day expiry)
- Rate limiting (100 requests per 15 min per IP)
- Input validation with Zod npm package
- Parameterized queries (no SQL injection)

## Deployment

The app auto-deploys on push to master branch:

1. GitHub Actions runs tests
2. If tests pass, Vercel deploys frontend
3. Render deploys backend

## Project Structure

```
period_tracker/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD
├── backend/
│   ├── src/
│   │   ├── config/          # database and redis setup
│   │   │   ├── database.ts
│   │   │   └── redis.ts
│   │   ├── models/          # Sequelize models
│   │   │   ├── User.ts
│   │   │   ├── Period.ts
│   │   │   ├── Symptom.ts
│   │   │   ├── Prediction.ts
│   │   │   ├── UserSettings.ts
│   │   │   └── index.ts
│   │   ├── routes/          # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── periods.ts
│   │   │   ├── predictions.ts
│   │   │   └── symptoms.ts
│   │   ├── services/        # business logic
│   │   │   └── predictionService.ts
│   │   ├── middleware/      # auth, rate limiting, errors
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── errorHandler.ts
│   │   ├── __tests__/       # Jest tests
│   │   │   └── predictionService.test.ts
│   │   └── index.ts         # app entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Login.tsx
│   │   │   ├── AddPeriodForm.tsx
│   │   │   ├── PeriodList.tsx
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── CalendarHeatmap.tsx
│   │   │   ├── CycleProgressBar.tsx
│   │   │   └── SymptomInsights.tsx
│   │   ├── api.ts           # API client
│   │   ├── App.tsx          # main app component
│   │   ├── main.tsx         # React entry point
│   │   ├── index.css        # global styles
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── HLD_For_Period_Tracker.drawio.svg  # high-level design diagram
├── LLD_For_Period_Tracker.md          # low-level design doc
├── QUERY_OPTIMIZATION.md              # database optimization notes
├── DOCUMENTATION.md                   # algorithm deep dive
├── Problem_Statement.pdf              # original assignment
├── vercel.json                        # Vercel deployment config
└── README.md
```

## Known Limitations

- Needs at least 3 cycles for statistical predictions (uses defaults before that)
- Does not handle pregnancy or menopause scenarios
- Calendar predictions get less confident the further out you go.
- Free tier hosting means cold starts on backend (first request can be slow)

## Scaling Challenges

### What Would Break First

**The database** is the obvious bottleneck. Right now it is handling everything - all reads, all writes, on a single instance with limited connections (max 10 in our pool). As more users join, we would start seeing connection pool exhaustion pretty quickly. The indexes help, but once you have millions of period records, even indexed queries start slowing down.

**The backend** would be the next problem. Single Node.js instance, and while we tried to keep things efficient, there are some CPU-intensive operations i.e. calculating standard deviations for cycle regularity, bcrypt hashing during auth, generating predictions for users with years of data. Right now these take milliseconds, but under load they would pile up. Node's single-threaded nature means one slow request can slow down others.

Memory could also become an issue. If we are fetching large result sets (say, a user with 5 years of periods), we are loading all that into memory before sending it. No streaming, no chunking.

### At 10K+ Users

Around 10,000 active users, we would probably start seeing real problems:

The **database connection pool** would max out during peak hours. We would either need to increase the pool size (which has its own limits) or add a proper connection pooler like PgBouncer in front of PostgreSQL.

**Query performance** would degrade even with indexes. Queries like "get all periods for a user ordered by date" would slow down as the periods table grows to millions of rows. Pagination with large offsets would get painful (OFFSET 10000 means PostgreSQL still has to scan through 10000 rows).

We would need to think about **read replicas** - send all the SELECT queries to replicas and keep the primary for writes. Most of our endpoints are reads (fetching periods, getting predictions), so this would help distribute the load.

The backend would need **horizontal scaling** - multiple instances behind a load balancer.

### At 100K+ Users

This is where the architecture would need serious changes:

**Database sharding** becomes necessary. We would probably shard by user_id - split users across multiple databases. Each shard handles its own subset of users.

**Disk space** becomes a real concern. Millions of period records, predictions, symptoms - all growing continuously. We would need data retention policies. Maybe archive periods older than 2 years to cheaper cold storage.

### Query Optimization

The optimizations we can do are:

- Only fetching what we need (we already have this) using attributes(sequelize feature)
- Indexes prevent full table scans
- Preventing duplicate data using composite indexes
- Connection pooling reuses connections instead of creating new ones every request(we already have this)
- Fixing N+1 queries by using eager loading (2 queries instead of 100+) using include in the query (sequelize feature)
- Implement proper pagination for long lists
- Redis caching (when available) cuts database load significantly (we already have this)

More read about query optimization in [QUERY_OPTIMIZATION.md](./QUERY_OPTIMIZATION.md)

But there's a limit to how far these take you. Eventually you need architectural changes - read replicas, sharding, microservices, proper caching infrastructure. For the current scope though, what we have would handle a few thousand users without major issues.
