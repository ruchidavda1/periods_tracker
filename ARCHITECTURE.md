# Period Tracker Application - Architecture & Design Document

## Table of Contents
1. [Tech Stack Selection](#tech-stack-selection)
2. [High-Level Design](#high-level-design)
3. [Database Design](#database-design)
4. [API Specifications](#api-specifications)
5. [Prediction Algorithm](#prediction-algorithm)
6. [Features](#features)
7. [Scalability & Challenges](#scalability--challenges)

---

## Tech Stack Selection

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js (lightweight, flexible, widely adopted)
- **Database**: PostgreSQL (ACID compliance, JSON support, mature ecosystem)
- **ORM**: Prisma (type-safe, modern, excellent DX)
- **Validation**: Zod (TypeScript-first schema validation)

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS (rapid UI development)
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect)

### Rationale
- **TypeScript**: Type safety reduces bugs, better developer experience
- **PostgreSQL**: Handles complex queries for analytics, supports JSON for flexible data
- **Express**: Minimal overhead, easy to scale horizontally
- **React**: Component reusability, large ecosystem
- **Prisma**: Type-safe database access, auto-generated types

---

## High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           React Frontend Application                 │   │
│  │  - Period Logging UI                                 │   │
│  │  - Calendar View                                     │   │
│  │  - Predictions Dashboard                             │   │
│  │  - Analytics & Insights                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Express.js Backend                      │   │
│  │  - Authentication Middleware                         │   │
│  │  - Request Validation                                │   │
│  │  - Rate Limiting                                     │   │
│  │  - Error Handling                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Period     │  │  Prediction  │  │  Analytics   │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │     User     │  │ Notification │                        │
│  │   Service    │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Prisma ORM                          │   │
│  │  - Type-safe queries                                 │   │
│  │  - Connection pooling                                │   │
│  │  - Transaction management                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                     │   │
│  │  - Users                                             │   │
│  │  - Periods                                           │   │
│  │  - Symptoms                                          │   │
│  │  - Predictions                                       │   │
│  │  - User Settings                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────────┐
│       Users          │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ password_hash       │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:1
          ▼
┌─────────────────────┐
│   UserSettings       │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ avg_cycle_length    │
│ avg_period_length   │
│ last_calculated_at  │
│ notifications_enabled│
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│      Periods         │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ start_date          │
│ end_date            │
│ flow_intensity      │
│ notes               │
│ created_at          │
│ updated_at          │
└─────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐
│      Symptoms        │
├─────────────────────┤
│ id (PK)             │
│ period_id (FK)      │
│ date                │
│ symptom_type        │
│ severity            │
│ notes               │
└─────────────────────┘

┌─────────────────────┐
│    Predictions       │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ predicted_start_date│
│ predicted_end_date  │
│ ovulation_start     │
│ ovulation_end       │
│ confidence_score    │
│ created_at          │
└─────────────────────┘
```

### Schema Details

#### Users Table
```sql
users:
- id: UUID (Primary Key)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
```

#### UserSettings Table
```sql
user_settings:
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- avg_cycle_length: INTEGER (default 28)
- avg_period_length: INTEGER (default 5)
- last_calculated_at: TIMESTAMP
- notifications_enabled: BOOLEAN (default true)
```

#### Periods Table
```sql
periods:
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- start_date: DATE NOT NULL
- end_date: DATE
- flow_intensity: ENUM('light', 'moderate', 'heavy')
- notes: TEXT
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

INDEXES:
- (user_id, start_date) for fast lookups
- user_id for user-specific queries
```

#### Symptoms Table
```sql
symptoms:
- id: UUID (Primary Key)
- period_id: UUID (Foreign Key -> periods.id)
- date: DATE NOT NULL
- symptom_type: ENUM('cramps', 'headache', 'mood_swings', 'fatigue', 'bloating', 'acne', 'other')
- severity: INTEGER (1-5 scale)
- notes: TEXT

INDEXES:
- period_id for symptom lookups
```

#### Predictions Table
```sql
predictions:
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key -> users.id)
- predicted_start_date: DATE NOT NULL
- predicted_end_date: DATE NOT NULL
- ovulation_start: DATE
- ovulation_end: DATE
- confidence_score: DECIMAL(3,2) (0.00 to 1.00)
- created_at: TIMESTAMP DEFAULT NOW()

INDEXES:
- (user_id, predicted_start_date) for predictions
```

---

## API Specifications

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

### API Endpoints

#### 1. User Management

##### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2026-02-02T10:00:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

##### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

---

#### 2. Period Management

##### POST /periods
Log a new period entry.

**Request Body:**
```json
{
  "start_date": "2026-01-15",
  "end_date": "2026-01-20",
  "flow_intensity": "moderate",
  "notes": "Normal cycle"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "start_date": "2026-01-15",
    "end_date": "2026-01-20",
    "flow_intensity": "moderate",
    "notes": "Normal cycle",
    "created_at": "2026-02-02T10:00:00Z"
  }
}
```

##### GET /periods
Get all period entries for the authenticated user.

**Query Parameters:**
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)
- `limit` (optional): Number of records (default: 12)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "periods": [
      {
        "id": "uuid",
        "start_date": "2026-01-15",
        "end_date": "2026-01-20",
        "flow_intensity": "moderate",
        "notes": "Normal cycle"
      }
    ],
    "pagination": {
      "total": 24,
      "limit": 12,
      "offset": 0
    }
  }
}
```

##### GET /periods/:id
Get specific period details including symptoms.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "start_date": "2026-01-15",
    "end_date": "2026-01-20",
    "flow_intensity": "moderate",
    "notes": "Normal cycle",
    "symptoms": [
      {
        "id": "uuid",
        "date": "2026-01-15",
        "symptom_type": "cramps",
        "severity": 3
      }
    ]
  }
}
```

##### PUT /periods/:id
Update an existing period entry.

**Request Body:**
```json
{
  "end_date": "2026-01-21",
  "flow_intensity": "light",
  "notes": "Updated notes"
}
```

##### DELETE /periods/:id
Delete a period entry.

**Response (200):**
```json
{
  "success": true,
  "message": "Period deleted successfully"
}
```

---

#### 3. Symptoms Management

##### POST /periods/:periodId/symptoms
Add symptom to a period.

**Request Body:**
```json
{
  "date": "2026-01-15",
  "symptom_type": "cramps",
  "severity": 4,
  "notes": "Severe cramping in the morning"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "period_id": "uuid",
    "date": "2026-01-15",
    "symptom_type": "cramps",
    "severity": 4,
    "notes": "Severe cramping in the morning"
  }
}
```

---

#### 4. Predictions (Core Feature)

##### GET /predictions/next-period
Get prediction for next period.

**Response (200):**
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
      "cycle_regularity": "regular"
    }
  }
}
```

##### GET /predictions/calendar
Get predictions for next N cycles.

**Query Parameters:**
- `months` (optional): Number of months ahead (default: 3)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "cycle_number": 1,
        "predicted_start_date": "2026-02-12",
        "predicted_end_date": "2026-02-17",
        "ovulation_start": "2026-01-29",
        "ovulation_end": "2026-02-02",
        "confidence_score": 0.85
      },
      {
        "cycle_number": 2,
        "predicted_start_date": "2026-03-12",
        "predicted_end_date": "2026-03-17",
        "ovulation_start": "2026-02-26",
        "ovulation_end": "2026-03-02",
        "confidence_score": 0.80
      }
    ]
  }
}
```

---

#### 5. Analytics

##### GET /analytics/insights
Get personalized insights based on historical data.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cycle_summary": {
      "avg_cycle_length": 28,
      "avg_period_length": 5,
      "regularity": "regular",
      "cycles_tracked": 12
    },
    "symptom_patterns": [
      {
        "symptom_type": "cramps",
        "frequency": 0.83,
        "avg_severity": 3.2
      }
    ],
    "insights": [
      "Your cycle is very regular (±2 days)",
      "You commonly experience cramps on day 1-2"
    ]
  }
}
```

---

## Prediction Algorithm

### Algorithm Overview

The prediction algorithm uses a weighted moving average approach combined with cycle regularity analysis.

### Key Components

1. **Historical Data Collection**
   - Retrieve last 6-12 cycles
   - Calculate cycle lengths (days between period starts)
   - Calculate period lengths (duration of bleeding)

2. **Cycle Length Prediction**
   ```typescript
   Weighted Average Formula:
   predictedCycleLength = (
     recent_3_cycles_avg * 0.5 +
     middle_3_cycles_avg * 0.3 +
     older_cycles_avg * 0.2
   )
   ```

3. **Regularity Assessment**
   ```typescript
   Standard Deviation Calculation:
   - σ < 2 days: "Very Regular" (confidence: 0.90-0.95)
   - 2 ≤ σ < 4 days: "Regular" (confidence: 0.75-0.89)
   - 4 ≤ σ < 7 days: "Somewhat Irregular" (confidence: 0.60-0.74)
   - σ ≥ 7 days: "Irregular" (confidence: 0.40-0.59)
   ```

4. **Ovulation Prediction**
   ```typescript
   Ovulation typically occurs 14 days before next period:
   ovulation_day = predicted_start_date - 14
   fertile_window = [ovulation_day - 5, ovulation_day + 1]
   ```

5. **Confidence Score Calculation**
   - Based on cycle regularity
   - Number of tracked cycles (more data = higher confidence)
   - Recency of data (recent data weighted more)

### Algorithm Pseudocode

```
function predictNextPeriod(userId):
  # Get historical data
  periods = getLastNPeriods(userId, 12)
  
  if periods.length < 3:
    return useDefaultPrediction(userId)
  
  # Calculate cycle lengths
  cycleLengths = []
  for i in range(1, periods.length):
    cycleLength = daysBetween(periods[i].start_date, periods[i-1].start_date)
    cycleLengths.append(cycleLength)
  
  # Weighted average calculation
  recent = average(cycleLengths[0:3]) * 0.5
  middle = average(cycleLengths[3:6]) * 0.3
  older = average(cycleLengths[6:]) * 0.2
  predictedCycleLength = recent + middle + older
  
  # Calculate regularity
  stdDev = standardDeviation(cycleLengths)
  confidence = calculateConfidence(stdDev, periods.length)
  
  # Predict next period
  lastPeriodStart = periods[0].start_date
  predictedStart = lastPeriodStart + predictedCycleLength
  
  # Calculate period length
  avgPeriodLength = average([p.end_date - p.start_date for p in periods])
  predictedEnd = predictedStart + avgPeriodLength
  
  # Predict ovulation
  ovulationDay = predictedStart - 14
  fertileWindowStart = ovulationDay - 5
  fertileWindowEnd = ovulationDay + 1
  
  return {
    predicted_start_date: predictedStart,
    predicted_end_date: predictedEnd,
    ovulation_start: fertileWindowStart,
    ovulation_end: fertileWindowEnd,
    confidence_score: confidence
  }
```

---

## Features

### Core Features (MVP)
1. **Period Logging**: Record start/end dates, flow intensity
2. **Period Prediction**: Predict next 3-6 cycles
3. **Ovulation Tracking**: Calculate fertile windows
4. **Calendar View**: Visual representation of cycles
5. **Basic Analytics**: Cycle length, regularity

### Enhanced Features
1. **Symptom Tracking**: Log and analyze patterns
2. **Cycle Insights**: Personalized health insights
3. **Reminders**: Period predictions, pill reminders
4. **Export Data**: CSV/PDF export for doctor visits
5. **Dark Mode**: User preference support
6. **Multiple Profiles**: For users tracking multiple people

### Advanced Features (Future)
1. **ML-Based Predictions**: More accurate using ML models
2. **Integration**: Apple Health, Google Fit
3. **Community**: Anonymous forums, Q&A
4. **Health Articles**: Educational content
5. **Medication Tracking**: Birth control, supplements
6. **Mood Tracking**: Correlate with cycle phases
7. **Weight/Temperature**: Additional health metrics

---

## Scalability & Challenges

### Implementation Challenges

#### 1. Prediction Accuracy
**Challenge**: Irregular cycles are hard to predict accurately.

**Solutions**:
- Require minimum data points (3+ cycles) before predictions
- Clearly communicate confidence scores to users
- Allow users to provide feedback to improve predictions
- Implement adaptive algorithms that learn from user corrections

#### 2. Data Privacy
**Challenge**: Highly sensitive health data.

**Solutions**:
- End-to-end encryption for sensitive fields
- HIPAA/GDPR compliance
- Anonymous data aggregation for analytics
- Clear privacy policy and data retention policies
- User data export and deletion capabilities

#### 3. Time Zone Handling
**Challenge**: Users traveling across time zones.

**Solutions**:
- Store dates in UTC, display in user's local timezone
- Allow users to manually adjust entries if needed
- Track timezone changes for accurate predictions

#### 4. Edge Cases
**Challenge**: Pregnancy, menopause, medical conditions.

**Solutions**:
- Allow users to pause tracking
- Special modes (pregnancy, breastfeeding, menopause)
- Medical condition flags that adjust predictions
- Integrate with healthcare providers

---

### Scalability Considerations

#### Database Scalability

**Current Design** (0-100K users):
- Single PostgreSQL instance
- Vertical scaling (increase resources)
- Read replicas for analytics queries

**Challenges at Scale** (100K-1M users):
- Database becomes bottleneck
- Query latency increases
- Backup/restore times grow

**Solutions**:
1. **Database Sharding**
   - Shard by user_id (consistent hashing)
   - Each shard handles subset of users
   - Reduces load per database

2. **Caching Layer**
   - Redis for frequently accessed data
   - Cache predictions, user settings
   - TTL-based invalidation

3. **Read Replicas**
   - Separate read and write workloads
   - Analytics queries on replicas
   - Reduces load on primary database

#### API Scalability

**Horizontal Scaling**:
- Stateless API servers
- Load balancer (Nginx, AWS ALB)
- Auto-scaling based on CPU/memory

**Rate Limiting**:
- Prevent abuse and DDoS
- Per-user rate limits
- API key management for partners

**CDN for Static Assets**:
- CloudFront, Cloudflare
- Reduce server load
- Improve global performance

#### Prediction Algorithm Optimization

**Challenge**: Real-time prediction calculations expensive at scale.

**Solutions**:
1. **Pre-compute Predictions**
   - Background jobs calculate predictions nightly
   - Store in database, serve from cache
   - Only recalculate when new data added

2. **Async Processing**
   - Queue-based architecture (Bull, RabbitMQ)
   - Process predictions asynchronously
   - Notify users when ready

3. **Batch Processing**
   - Process multiple users together
   - More efficient resource usage
   - Run during off-peak hours

#### Monitoring & Observability

**Key Metrics**:
- API response times (p50, p95, p99)
- Database query performance
- Error rates and types
- User engagement metrics
- Prediction accuracy metrics

**Tools**:
- Logging: Winston, Pino
- Monitoring: Prometheus, Grafana
- APM: New Relic, DataDog
- Error tracking: Sentry

#### Cost Optimization

**Storage Costs**:
- Implement data retention policies
- Archive old data to cheaper storage (S3 Glacier)
- Compress historical data

**Compute Costs**:
- Auto-scaling to match demand
- Spot instances for batch jobs
- Optimize database queries

---

## Security Considerations

### Authentication & Authorization
- JWT with short expiration (15 min)
- Refresh tokens with rotation
- Password hashing (bcrypt, Argon2)
- Rate limiting on auth endpoints

### Data Protection
- Encryption at rest (database-level)
- Encryption in transit (TLS 1.3)
- Regular security audits
- Penetration testing

### API Security
- Input validation (prevent SQL injection, XSS)
- CORS configuration
- CSRF protection
- API versioning for backward compatibility

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Cloud Provider                     │
│                    (AWS/GCP/Azure)                   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │           Load Balancer / CDN                │   │
│  └─────────────────────────────────────────────┘   │
│                        │                             │
│         ┌──────────────┼──────────────┐             │
│         ▼              ▼              ▼             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │ API Server│  │ API Server│  │ API Server│      │
│  │ Instance 1│  │ Instance 2│  │ Instance 3│      │
│  └───────────┘  └───────────┘  └───────────┘      │
│         │              │              │             │
│         └──────────────┼──────────────┘             │
│                        │                             │
│         ┌──────────────┼──────────────┐             │
│         ▼              ▼              ▼             │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │   Primary   │  │   Read      │                  │
│  │ PostgreSQL  │◄─┤  Replicas   │                  │
│  └─────────────┘  └─────────────┘                  │
│         │                                            │
│         ▼                                            │
│  ┌─────────────┐                                    │
│  │   Redis     │                                    │
│  │   Cache     │                                    │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

---

## Conclusion

This architecture provides:
- **Scalability**: Horizontal scaling, caching, sharding
- **Reliability**: Replication, backup strategies
- **Performance**: Caching, optimized queries, CDN
- **Security**: Encryption, authentication, validation
- **Maintainability**: Clean architecture, type safety, monitoring

The modular design allows incremental feature additions while maintaining code quality and performance.
