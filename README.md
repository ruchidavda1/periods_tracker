# Period Tracker Application

A comprehensive period tracking application with intelligent prediction algorithms built with TypeScript, Node.js, React, and PostgreSQL.

## Live Demo

The application is deployed and accessible at:

- **Frontend**: [https://periods-tracker-xi.vercel.app](https://periods-tracker-xi.vercel.app)
- **Backend API**: [https://round-judy-abcdefghiw-b8b6fbce.koyeb.app](https://round-judy-abcdefghiw-b8b6fbce.koyeb.app)

### Deployment Stack
- **Frontend**: Deployed on [Vercel](https://vercel.com) (Free Tier)
- **Backend**: Deployed on [Koyeb](https://koyeb.com) (Free Tier)
- **Database**: [Neon](https://neon.tech) - Serverless PostgreSQL (Free Tier)
- **CI/CD**: GitHub Actions with auto-deployment enabled

### Auto-Deployment Flow

On every `git push` to `main` branch:

1. **GitHub Actions runs CI checks** (`.github/workflows/ci.yml`)
   - Backend TypeScript type checking & build verification
   - Frontend TypeScript type checking & build verification

2. **Vercel auto-deploys Frontend** (if CI passes)
   - Automatic deployment via Vercel-GitHub integration
   - Preview deployments for pull requests
   - Production deployment for `main` branch

3. **Koyeb auto-deploys Backend** (if CI passes)
   - Automatic deployment via Koyeb-GitHub integration
   - Builds Docker image from `backend/Dockerfile`

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Scaling to 1M+ Users](#scaling-to-1m-users)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Prediction Algorithm](#prediction-algorithm)
- [Project Structure](#project-structure)

## Features

### Core Features
- **Period Logging**: Track start/end dates and flow intensity
- **Smart Predictions**: AI-powered next period predictions with confidence scores
- **Ovulation Tracking**: Calculate fertile windows
- **Cycle Analytics**: View average cycle length, period duration, and regularity
- **Historical Data**: Complete period history with visualization
- **User Authentication**: Secure login and registration

### Prediction Algorithm Highlights
- Weighted moving average calculation (recent cycles weighted more)
- Statistical analysis for cycle regularity
- Confidence scoring based on data quality
- Handles irregular cycles gracefully
- Minimum 3 cycles required for accurate predictions

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Validation**: Zod
- **Authentication**: JWT with bcrypt

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks

## Architecture

For detailed architecture, database schema, API specifications, and prediction algorithm documentation, see [Documentation.md](./Documentation.md).

## Scaling to 1M+ Users

### Current Architecture Limitations
- **Single Database**: PostgreSQL on Neon (shared CPU, limited connections)
- **Single Region**: Backend deployed in Frankfurt (EU), Frontend on Vercel Edge
- **Monolithic Backend**: Single Node.js instance with limited horizontal scaling
- **No Caching**: Direct database queries for every request

### Scalability Strategy for 1M+ Users

#### Phase 1: Immediate Optimizations (0-10K Users)
**Infrastructure:**
- ✅ **Upgrade Database**: Move to dedicated Neon instance or managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- ✅ **Connection Pooling**: Implement PgBouncer for efficient connection management
- ✅ **CDN**: Leverage Vercel Edge Network for global frontend delivery (already enabled)

**Backend:**
- 🔄 **Add Redis Cache**: Cache predictions, cycle stats, and user sessions
  ```typescript
  // Cache predictions for 24 hours
  Redis.setex(`prediction:${userId}`, 86400, predictionData);
  ```
- 🔄 **Database Indexing**: Add indexes on `user_id`, `start_date`, `created_at`
  ```sql
  CREATE INDEX idx_periods_user_date ON periods(user_id, start_date DESC);
  CREATE INDEX idx_users_email ON users(email);
  ```

**Monitoring:**
- Add APM (Application Performance Monitoring) - Datadog, New Relic, or Sentry
- Set up alerts for CPU, memory, response time, error rates

**Expected Capacity:** ~10K DAU (Daily Active Users)

---

#### Phase 2: Horizontal Scaling (10K-100K Users)
**Infrastructure:**
- 🚀 **Multi-Region Deployment**: Deploy backend in US-East, EU-West, Asia-Pacific
- 🚀 **Load Balancer**: Use AWS ALB or Cloudflare Load Balancing
- 🚀 **Auto-Scaling**: Configure Kubernetes (EKS, GKE) or serverless functions

**Database:**
- 🗄️ **Read Replicas**: Create 2-3 read replicas for GET requests
  - Write to primary: Period creation, user updates
  - Read from replicas: Predictions, history, analytics
- 🗄️ **Database Sharding** (by user_id hash):
  ```
  Shard 0: users with user_id % 4 = 0
  Shard 1: users with user_id % 4 = 1
  Shard 2: users with user_id % 4 = 2
  Shard 3: users with user_id % 4 = 3
  ```

**Caching Layer:**
- 💾 **Redis Cluster**: Separate caches for:
  - Session data (TTL: 7 days)
  - Predictions (TTL: 24 hours)
  - User profiles (TTL: 1 hour)
  - Cycle statistics (TTL: 6 hours)
- 💾 **Cache-Aside Pattern**:
  ```typescript
  async getPrediction(userId: string) {
    // Check cache first
    const cached = await redis.get(`pred:${userId}`);
    if (cached) return JSON.parse(cached);
    
    // Calculate and cache
    const prediction = await calculatePrediction(userId);
    await redis.setex(`pred:${userId}`, 86400, JSON.stringify(prediction));
    return prediction;
  }
  ```

**API Optimization:**
- 📊 **Batch Processing**: Process multiple period logs in bulk
- 📊 **Async Jobs**: Use Bull/BullMQ for background prediction calculations
- 📊 **Rate Limiting**: 100 requests/minute per user (using Redis)

**Expected Capacity:** ~100K DAU

---

#### Phase 3: Microservices Architecture (100K-1M+ Users)
**Architecture Redesign:**
```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Kong/AWS API Gateway)    │
└────────────┬───────────────┬──────────────┬─────────────┘
             │               │              │
    ┌────────▼───────┐ ┌────▼─────┐ ┌──────▼────────┐
    │ Auth Service   │ │Period Svc │ │Prediction Svc │
    │ (Node.js)      │ │(Node.js)  │ │(Python/Go)    │
    └────────┬───────┘ └────┬─────┘ └──────┬────────┘
             │               │              │
    ┌────────▼───────────────▼──────────────▼────────┐
    │         Message Queue (RabbitMQ/Kafka)         │
    └────────────────────────────────────────────────┘
```

**Service Breakdown:**
1. **Authentication Service**:
   - JWT validation, user management
   - Separate PostgreSQL database for users
   - Redis for session management

2. **Period Management Service**:
   - CRUD operations for periods
   - Sharded PostgreSQL (by user_id)
   - Write-heavy, needs optimized writes

3. **Prediction Service**:
   - ML-powered predictions (Python + TensorFlow/PyTorch)
   - Read-heavy, aggressive caching
   - Pre-computed predictions updated daily via cron jobs

4. **Analytics Service** (NEW):
   - Aggregated statistics
   - Time-series database (InfluxDB/TimescaleDB)
   - Real-time dashboards

**Database Strategy:**
- 🗄️ **Primary-Replica Setup** (per shard):
  - 1 Primary (writes)
  - 3-5 Replicas (reads)
  - Automatic failover with Patroni

- 🗄️ **Data Partitioning** (by date):
  ```sql
  -- Partition periods table by year
  CREATE TABLE periods_2026 PARTITION OF periods
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
  ```

- 🗄️ **Cold Storage**: Move periods older than 2 years to S3 (via pg_archivecleanup)

**Advanced Caching:**
- 💾 **Multi-Layer Cache**:
  - **L1**: Application memory (LRU cache, 1000 entries)
  - **L2**: Redis (hot data, 1M entries)
  - **L3**: Database (cold data)

- 💾 **Cache Warming**: Pre-compute predictions at 2 AM daily
  ```typescript
  // Cron job runs at 2 AM
  async function warmCache() {
    const activeUsers = await getActiveUsers(); // Users active in last 7 days
    for (const user of activeUsers) {
      await calculateAndCachePrediction(user.id);
    }
  }
  ```

**Performance Optimizations:**
- ⚡ **GraphQL** (instead of REST): Reduce over-fetching
- ⚡ **gRPC**: For internal service-to-service communication (faster than REST)
- ⚡ **WebSocket**: Real-time updates for notifications
- ⚡ **Background Jobs**: Offload heavy computations
  ```
  User logs period → Queue job → Worker calculates prediction → Cache result
  ```

**Observability:**
- 📊 **Distributed Tracing**: Jaeger or OpenTelemetry
- 📊 **Centralized Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- 📊 **Metrics**: Prometheus + Grafana
- 📊 **Alerts**: PagerDuty for critical issues

**Expected Capacity:** 1M+ DAU

---

#### Phase 4: Advanced Optimizations (1M+ Users)

**Machine Learning Pipeline:**
- 🤖 **Model Training**: Train personalized ML models per user
  ```python
  # Train LSTM model for cycle prediction
  model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(12, 3)),
    LSTM(50),
    Dense(1)
  ])
  ```
- 🤖 **Feature Store**: Cache user features (avg cycle, std dev) in Redis
- 🤖 **Batch Inference**: Run predictions for all users overnight

**Database Optimizations:**
- 🗄️ **CQRS Pattern**: Separate read/write databases
  - Write DB: PostgreSQL (normalized, ACID)
  - Read DB: MongoDB (denormalized, fast reads)
  - Sync via Change Data Capture (CDC) with Debezium

- 🗄️ **Time-Series Database**: Use TimescaleDB for cycle analytics
  ```sql
  -- Hypertable for fast time-series queries
  SELECT time_bucket('1 month', start_date) as month,
         AVG(cycle_length) as avg_cycle
  FROM periods
  WHERE user_id = ?
  GROUP BY month;
  ```

**Global Edge Network:**
- 🌍 **Multi-Region Active-Active**:
  - US-East, US-West (Americas)
  - EU-West, EU-Central (Europe)
  - AP-Southeast, AP-Northeast (Asia-Pacific)
  
- 🌍 **Geo-Routing**: Route users to nearest region (reduce latency from 200ms to 20ms)

- 🌍 **Data Residency**: Comply with GDPR/HIPAA by storing EU user data in EU

**Cost Optimization:**
- 💰 **Serverless for Spiky Workloads**: AWS Lambda for notifications
- 💰 **Spot Instances**: Use EC2 Spot for batch jobs (70% cost savings)
- 💰 **Database Query Optimization**: Reduce query time from 100ms to 10ms
- 💰 **Compression**: Use Brotli for API responses (reduce bandwidth by 50%)

**Expected Capacity:** 5M+ DAU

---

### Estimated Infrastructure Cost Breakdown (1M DAU)

| Component | Service | Specs | Monthly Cost |
|-----------|---------|-------|--------------|
| **Backend** | AWS ECS (Fargate) | 10x 2vCPU, 4GB RAM | $700 |
| **Database** | AWS RDS PostgreSQL | db.r5.2xlarge (8vCPU, 64GB) + 3 replicas | $2,500 |
| **Cache** | AWS ElastiCache Redis | cache.r5.xlarge (4vCPU, 26GB) cluster | $500 |
| **CDN** | Vercel/Cloudflare | Unlimited bandwidth | $200 |
| **Load Balancer** | AWS ALB | 2 LBs (multi-region) | $50 |
| **Message Queue** | AWS SQS/SNS | ~100M requests/month | $50 |
| **Monitoring** | Datadog | Infrastructure + APM | $300 |
| **Storage** | S3 | 10TB (cold storage) | $240 |
| **Total** | | | **~$4,540/month** |

**Revenue to Break Even:** ~$0.005 per user/month (freemium + premium features)

---

### Key Takeaways

1. **Caching is King**: Implement aggressive caching (Redis) to reduce DB load by 80%
2. **Horizontal Scaling**: Use Kubernetes or serverless to scale out, not up
3. **Database Sharding**: Shard by user_id to distribute load across multiple DBs
4. **Microservices**: Break monolith into independent services for better scaling
5. **Async Processing**: Use message queues for non-critical operations
6. **Global CDN**: Serve frontend from edge locations (Vercel/Cloudflare)
7. **Monitoring**: Invest in observability early to catch issues before users do

**Current Status:** ✅ Ready for Phase 1 (0-10K users)  
**Next Steps:** Implement Redis caching and database indexing

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
cd period_tracker
```

### 2. Database Setup

#### Install PostgreSQL (if not already installed)

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE period_tracker;

# Create user (optional)
CREATE USER tracker_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE period_tracker TO tracker_user;

# Exit
\q
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your database credentials
# DB_USER=ruchidavda
# DB_PASSWORD=
# DB_NAME=period_tracker
# DB_HOST=localhost
# DB_PORT=5432
# JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Start backend server
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5000`

### 5. Access the Application

1. Open your browser and navigate to `http://localhost:5000`
2. Create a new account by clicking "Sign Up"
3. Login with your credentials

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Periods

**POST /api/periods** - Log a new period
```json
{
  "start_date": "2026-01-15",
  "end_date": "2026-01-20",
  "flow_intensity": "moderate",
  "notes": "Normal cycle"
}
```

**GET /api/periods** - Get all periods
- Query params: `limit`, `offset`

**GET /api/periods/:id** - Get specific period with symptoms

**PUT /api/periods/:id** - Update period

**DELETE /api/periods/:id** - Delete period

#### Predictions (Core Feature)

**GET /api/predictions/next-period** - Get next period prediction

Response:
```json
{
  "success": true,
  "data": {
    "next_period": {
      "predicted_start_date": "2026-02-12",
      "predicted_end_date": "2026-02-17",
      "confidence_score": 0.85
    },
    "ovulation": {
      "predicted_start_date": "2026-01-29",
      "predicted_end_date": "2026-02-02"
    },
    "cycle_stats": {
      "avg_cycle_length": 28,
      "avg_period_length": 5,
      "cycle_regularity": "regular",
      "cycles_tracked": 7
    }
  }
}
```

**GET /api/predictions/calendar?months=3** - Get predictions for next N cycles

## Prediction Algorithm

### Overview

The prediction algorithm uses a **weighted moving average** approach combined with statistical analysis to predict menstrual cycles.

### Key Components

1. **Historical Data Collection**
   - Retrieves last 6-12 completed cycles
   - Validates data quality (filters unrealistic cycle lengths)

2. **Weighted Average Calculation**
   ```
   Predicted Cycle Length = 
     (recent_3_cycles * 0.5) + 
     (middle_3_cycles * 0.3) + 
     (older_cycles * 0.2)
   ```
   Recent cycles are weighted more heavily as they better represent current patterns.

3. **Regularity Assessment**
   - Calculates standard deviation of cycle lengths
   - Classification:
     - σ < 2 days: "Very Regular" (90-95% confidence)
     - 2 ≤ σ < 4: "Regular" (75-89% confidence)
     - 4 ≤ σ < 7: "Somewhat Irregular" (60-74% confidence)
     - σ ≥ 7: "Irregular" (40-59% confidence)

4. **Ovulation Prediction**
   - Ovulation typically occurs 14 days before next period
   - Fertile window: 5 days before to 1 day after ovulation

5. **Confidence Score**
   - Based on cycle regularity (standard deviation)
   - Number of data points (more cycles = higher confidence)
   - Recency of data (recent data weighted more)

### Algorithm Implementation

Located in `backend/src/services/predictionService.ts`

Key methods:
- `predictNextPeriod()` - Main prediction function
- `calculateWeightedCycleLength()` - Weighted average calculation
- `calculateConfidence()` - Confidence score computation
- `calculateCycleStats()` - Statistical analysis

### Edge Cases Handled

- Insufficient data (< 3 cycles): Uses default predictions with low confidence
- Irregular cycles: Adjusted confidence scores
- Unrealistic data: Filters cycle lengths outside 21-45 day range
- Missing end dates: Excluded from calculations

## Project Structure

```
period_tracker/
├── ARCHITECTURE.md          # Detailed architecture documentation
├── README.md               # This file
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts # Sequelize configuration
│   │   ├── models/
│   │   │   ├── User.ts    # User model
│   │   │   ├── UserSettings.ts
│   │   │   ├── Period.ts  # Period model
│   │   │   ├── Symptom.ts
│   │   │   ├── Prediction.ts
│   │   │   └── index.ts   # Model exports
│   │   ├── middleware/
│   │   │   └── auth.ts    # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts    # Authentication routes
│   │   │   ├── periods.ts # Period management routes
│   │   │   └── predictions.ts # Prediction routes
│   │   ├── services/
│   │   │   └── predictionService.ts # Prediction algorithm
│   │   └── index.ts       # Express server setup
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AddPeriodForm.tsx
    │   │   ├── Login.tsx
    │   │   ├── PeriodList.tsx
    │   │   └── PredictionCard.tsx
    │   ├── api.ts         # API client
    │   ├── App.tsx        # Main app component
    │   ├── index.css      # Global styles
    │   └── main.tsx       # React entry point
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## Testing the Application

### Test Prediction Algorithm

1. Login with demo account
2. View the prediction card showing next period and ovulation
3. Add new periods to see how predictions update
4. Check confidence scores based on cycle regularity

### Adding Data

Start by logging your periods:
- Click "+ Log Period" button
- Enter start date and end date
- Select flow intensity
- Add optional notes
- Minimum 3 periods needed for predictions

### Testing Different Scenarios

**Regular Cycles:**
- Add periods with consistent 28-day cycles
- Observe high confidence scores (85-95%)

**Irregular Cycles:**
- Add periods with varying cycle lengths (25, 32, 27, 35 days)
- Observe lower confidence scores (40-70%)

**Insufficient Data:**
- Delete periods until less than 3 remain
- Observe default predictions with low confidence

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based authentication
- Protected API endpoints
- Input validation with Zod
- SQL injection prevention via Sequelize ORM
- CORS enabled for frontend-backend communication

## Future Enhancements

### Short-term
- Symptom tracking and pattern analysis
- Period reminders and notifications
- Data export (CSV/PDF)
- Dark mode support

### Long-term
- Machine learning models for improved predictions
- Integration with health apps (Apple Health, Google Fit)
- Community features and health articles
- Multi-language support
- Mobile app (React Native)

## Scalability Considerations

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed scalability strategies including:

- Database sharding by user_id
- Redis caching layer
- Read replicas for analytics
- Horizontal API scaling
- Pre-computed predictions
- CDN for static assets

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Check connection
psql -U postgres -d period_tracker
```

### Port Already in Use

```bash
# Find process using port 3000 (backend)
lsof -ti:3000

# Kill process
kill -9 <PID>

# Or use different port in backend/.env
PORT=3001
```

### Database Issues

```bash
# Check database connection
psql -d period_tracker -U ruchidavda

# Restart backend server
cd backend
npm run dev
```

## Getting Started

1. Sign up with your email and password (minimum 8 characters)
2. Log your first period entry
3. Add at least 3 periods to see accurate predictions

## Acknowledgments

- Prediction algorithm inspired by research on menstrual cycle tracking
- UI design influenced by popular health tracking apps
- Built with modern web technologies and best practices
