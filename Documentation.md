# Period Tracker Application - Complete Technical Documentation

## Table of Contents

### Part 1: Architecture & Design
1. [Tech Stack Selection](#tech-stack-selection)
2. [High-Level Design](#high-level-design)
3. [Database Design](#database-design)
4. [API Specifications](#api-specifications)
5. [Features](#features)
6. [Scalability & Challenges](#scalability--challenges)
7. [Security Considerations](#security-considerations)
8. [Deployment Architecture](#deployment-architecture)

### Part 2: Prediction Algorithm Deep Dive
9. [Algorithm Overview](#algorithm-overview)
10. [Mathematical Foundation](#mathematical-foundation)
11. [Algorithm Flow](#algorithm-flow)
12. [Implementation Details](#implementation-details)
13. [Real-World Examples](#real-world-examples)
14. [Algorithm Limitations & Future Enhancements](#algorithm-limitations--future-enhancements)

---

# Part 1: Architecture & Design

## Tech Stack Selection

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js (lightweight, flexible, widely adopted)
- **Database**: PostgreSQL (ACID compliance, JSON support, mature ecosystem)
- **ORM**: Sequelize (type-safe, battle-tested, excellent DX)
- **Validation**: Zod (TypeScript-first schema validation)

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (rapid UI development)
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect)

### Rationale
- **TypeScript**: Type safety reduces bugs, better developer experience
- **PostgreSQL**: Handles complex queries for analytics, supports JSON for flexible data
- **Express**: Minimal overhead, easy to scale horizontally
- **React**: Component reusability, large ecosystem
- **Sequelize**: Type-safe database access, auto-generated types

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
│  │                  Sequelize ORM                       │   │
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
http://localhost:3000/api
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

##### PUT /periods/:id
Update an existing period entry.

##### DELETE /periods/:id
Delete a period entry.

---

#### 3. Predictions (Core Feature)

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
      "cycle_regularity": "regular",
      "cycles_tracked": 7
    }
  }
}
```

##### GET /predictions/calendar
Get predictions for next N cycles.

**Query Parameters:**
- `months` (optional): Number of months ahead (default: 3)

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

# Part 2: Prediction Algorithm Deep Dive

## Algorithm Overview

The period prediction algorithm is the core feature of this application. It uses statistical analysis and weighted moving averages to predict menstrual cycles with high accuracy for regular cycles and reasonable accuracy for irregular cycles.

### Algorithm Design Philosophy

#### Goals
1. **Accuracy**: Provide reliable predictions for regular cycles
2. **Adaptability**: Handle irregular cycles gracefully
3. **Transparency**: Communicate confidence levels clearly
4. **Personalization**: Learn from individual patterns

#### Challenges Addressed
1. **Cold Start Problem**: Limited or no historical data
2. **Cycle Variability**: Natural fluctuations in cycle length
3. **Data Quality**: Incomplete or inconsistent user input
4. **Edge Cases**: Pregnancy, medical conditions, etc.

---

## Mathematical Foundation

### 1. Cycle Length Calculation

**Definition**: Days between the start of one period and the start of the next.

```
Cycle Length = Days(Period[n].start_date - Period[n-1].start_date)
```

**Data Validation**:
- Only cycles between 21-45 days are considered valid
- This filters out data entry errors and unusual medical situations

### 2. Weighted Moving Average

The algorithm uses a **weighted moving average** where recent data has more influence on predictions.

```
Weighted Cycle Length = (R × 0.5) + (M × 0.3) + (O × 0.2)

Where:
  R = Average of most recent 3 cycles
  M = Average of middle 3 cycles (cycles 4-6)
  O = Average of older cycles (cycles 7+)
```

**Why Weighted?**
- Recent cycles better reflect current patterns
- Accounts for gradual changes in cycle regularity
- More responsive to pattern shifts (e.g., stress, lifestyle changes)

**Example Calculation**:
```
Cycle History: [28, 29, 27, 28, 30, 28, 29, 27] days

Recent (last 3): [28, 29, 27] → Average = 28.0
Middle (next 3): [28, 30, 28] → Average = 28.7
Older (rest):    [29, 27]     → Average = 28.0

Weighted = (28.0 × 0.5) + (28.7 × 0.3) + (28.0 × 0.2)
        = 14.0 + 8.61 + 5.6
        = 28.21 days
```

### 3. Statistical Analysis - Standard Deviation

Standard deviation (σ) measures cycle variability:

```
σ = √(Σ(xi - μ)² / n)

Where:
  xi = individual cycle length
  μ = mean cycle length
  n = number of cycles
```

**Regularity Classification**:

| σ (days) | Classification | Description |
|----------|---------------|-------------|
| < 2 | Very Regular | Cycle varies by ±1 day |
| 2-4 | Regular | Cycle varies by 2-3 days |
| 4-7 | Somewhat Irregular | Cycle varies by 4-6 days |
| ≥ 7 | Irregular | High unpredictability |

**Example**:
```
Cycles: [28, 29, 28, 27, 28]
Mean (μ) = 28.0
Deviations: [0, 1, 0, -1, 0]
Squared: [0, 1, 0, 1, 0]
Sum = 2
σ = √(2/5) = 0.63 → Very Regular
```

### 4. Confidence Score Calculation

The confidence score (0.40 - 0.95) combines multiple factors:

```
Confidence = Base_Confidence + Data_Boost + Cycle_Adjustment

Where:
  Base_Confidence = f(standard_deviation)
  Data_Boost = min(cycles_tracked / 12, 1.0) × 0.08
  Cycle_Adjustment = cycle_length_penalty
```

**Base Confidence by Regularity**:
- σ < 2: Base = 0.92 (very predictable)
- σ 2-4: Base = 0.82 (predictable)
- σ 4-7: Base = 0.67 (moderately predictable)
- σ ≥ 7: Base = 0.50 (unpredictable)

**Data Quality Boost**:
- More tracked cycles → higher confidence
- Maximum boost: +0.08 at 12+ cycles
- Linear scaling: each cycle adds ~0.67% confidence

**Cycle Length Adjustment**:
- Typical cycles (26-32 days): No penalty
- Atypical cycles: -0.05 penalty
- Rationale: Unusual cycles are harder to predict

**Example Calculation**:
```
Scenario: 8 cycles tracked, σ = 3.2, avg_cycle = 28 days

Base_Confidence = 0.82 (σ between 2-4)
Data_Boost = (8/12) × 0.08 = 0.053
Cycle_Adjustment = 0 (typical cycle)

Confidence = 0.82 + 0.053 + 0 = 0.873 → 87.3%
```

### 5. Ovulation Prediction

Based on biological principles:

```
Ovulation_Day = Next_Period_Start - 14 days
Fertile_Window_Start = Ovulation_Day - 5 days
Fertile_Window_End = Ovulation_Day + 1 day
```

**Biological Basis**:
- Luteal phase (post-ovulation) is consistently ~14 days
- Sperm can survive up to 5 days
- Egg viable for ~24 hours after ovulation

**7-day fertile window** = 5 days before + ovulation day + 1 day after

---

## Algorithm Flow

### High-Level Flow

```
START
  ↓
Get User's Last 12 Periods
  ↓
Sufficient Data? (≥3 cycles)
  ↓ Yes              ↓ No
  ↓                  ↓
Calculate          Use Default
Statistics         Prediction
  ↓                  ↓
Weighted           ↓
Average            ↓
  ↓                  ↓
Predict           Predict
Next Period       Next Period
  ↓                  ↓
Calculate         Calculate
Ovulation         Ovulation
  ↓                  ↓
Compute           Low
Confidence        Confidence
  ↓                  ↓
Save              Save
Prediction        Prediction
  ↓
RETURN RESULT
```

### Detailed Pseudocode

```python
function predictNextPeriod(userId):
    # Step 1: Fetch historical data
    periods = getLastNPeriods(userId, 12, whereComplete=True)
    
    # Step 2: Check data sufficiency
    if len(periods) < 3:
        return useDefaultPrediction(userId, periods)
    
    # Step 3: Calculate cycle lengths with validation
    cycleLengths = []
    for i in range(len(periods) - 1):
        cycleLength = daysBetween(periods[i+1].start, periods[i].start)
        if 21 <= cycleLength <= 45:  # Validate
            cycleLengths.append(cycleLength)
    
    # Step 4: Calculate statistics
    avgCycleLength = mean(cycleLengths)
    stdDev = standardDeviation(cycleLengths)
    
    # Step 5: Weighted average for prediction
    recent = mean(cycleLengths[0:3])
    middle = mean(cycleLengths[3:6]) if len(cycleLengths) >= 6 else recent
    older = mean(cycleLengths[6:]) if len(cycleLengths) > 6 else middle
    
    if len(cycleLengths) <= 3:
        predictedLength = recent
    elif len(cycleLengths) <= 6:
        predictedLength = recent * 0.7 + middle * 0.3
    else:
        predictedLength = recent * 0.5 + middle * 0.3 + older * 0.2
    
    # Step 6: Predict dates
    lastPeriodStart = periods[0].start_date
    predictedStart = addDays(lastPeriodStart, round(predictedLength))
    
    # Calculate period duration
    periodLengths = [daysBetween(p.start, p.end) + 1 for p in periods if p.end]
    avgPeriodLength = mean(periodLengths) or 5
    predictedEnd = addDays(predictedStart, round(avgPeriodLength) - 1)
    
    # Step 7: Ovulation calculation
    ovulationDay = addDays(predictedStart, -14)
    fertileStart = addDays(ovulationDay, -5)
    fertileEnd = addDays(ovulationDay, 1)
    
    # Step 8: Confidence score
    confidence = calculateConfidence(stdDev, len(cycleLengths), avgCycleLength)
    
    # Step 9: Save and return
    savePrediction(userId, predictedStart, predictedEnd, fertileStart, fertileEnd, confidence)
    
    return {
        predicted_start: predictedStart,
        predicted_end: predictedEnd,
        ovulation_start: fertileStart,
        ovulation_end: fertileEnd,
        confidence: confidence,
        stats: {
            avg_cycle: avgCycleLength,
            avg_period: avgPeriodLength,
            regularity: classifyRegularity(stdDev),
            cycles_tracked: len(cycleLengths)
        }
    }
```

---

## Implementation Details

### Code Location
`backend/src/services/predictionService.ts`

### Key Methods

1. **`predictNextPeriod(userId)`**
   - Main entry point
   - Returns single prediction with statistics

2. **`predictMultipleCycles(userId, n)`**
   - Predicts next N cycles
   - Uses recursive application of average cycle length
   - Confidence decreases by 5% per cycle

3. **`calculateCycleStats(periods)`**
   - Computes all statistical measures
   - Returns structured stats object

4. **`calculateWeightedCycleLength(periods)`**
   - Implements weighted moving average
   - Handles variable data availability

5. **`calculateConfidence(stdDev, dataPoints, avgCycle)`**
   - Multi-factor confidence calculation
   - Returns score between 0.40 and 0.95

### Edge Cases Handled

1. **Insufficient Data**
   - < 3 cycles: Uses user settings or defaults
   - Confidence capped at 0.40 + (cycles × 0.1)

2. **Irregular Cycles**
   - High standard deviation → lower confidence
   - Still provides prediction with clear uncertainty

3. **Data Quality Issues**
   - Filters unrealistic cycle lengths (< 21 or > 45 days)
   - Excludes incomplete periods (no end date)

4. **First-Time Users**
   - Uses default values (28-day cycle, 5-day period)
   - Prompts for data entry to improve accuracy

---

## Real-World Examples

### Example 1: Very Regular Cycle

**Data**:
```
Cycles: [28, 28, 29, 28, 28, 27, 28, 29]
```

**Calculation**:
```
Recent 3: [28, 28, 29] → 28.33
Middle 3: [28, 28, 27] → 27.67
Older 2: [28, 29] → 28.5

Weighted = 28.33×0.5 + 27.67×0.3 + 28.5×0.2
        = 14.17 + 8.30 + 5.70
        = 28.17 days

Standard Deviation = 0.64 days
Regularity: Very Regular
Confidence: 92%

Prediction: Next period in 28 days
```

### Example 2: Somewhat Irregular Cycle

**Data**:
```
Cycles: [26, 31, 28, 29, 27, 33, 26]
```

**Calculation**:
```
Recent 3: [26, 31, 28] → 28.33
Middle 3: [29, 27, 33] → 29.67
Older 1: [26] → 26.0

Weighted = 28.33×0.5 + 29.67×0.3 + 26.0×0.2
        = 14.17 + 8.90 + 5.20
        = 28.27 days

Standard Deviation = 2.60 days
Regularity: Regular
Confidence: 78%

Prediction: Next period in 28 days (±3 days)
```

### Example 3: Insufficient Data

**Data**:
```
Cycles: [29, 27]
```

**Calculation**:
```
Only 2 cycles → Insufficient data

Uses default or user settings:
- Cycle length: 28 days
- Period length: 5 days

Confidence: 40% (low due to limited data)

Prediction: Next period in 28 days
Note: "Add more cycles for accurate predictions"
```

---

## Algorithm Limitations & Future Enhancements

### Current Limitations

1. **Linear Assumptions**
   - Assumes cycle patterns continue linearly
   - Doesn't detect trend changes (lengthening/shortening)

2. **Biological Simplifications**
   - Fixed 14-day luteal phase assumption
   - Doesn't account for anovulatory cycles

3. **External Factors**
   - No consideration for stress, travel, illness
   - Doesn't integrate with other health metrics

4. **Data Requirements**
   - Requires 3+ cycles for reasonable accuracy
   - Best with 6-12 cycles of data

### Future Enhancements

1. **Machine Learning**
   - LSTM networks for pattern recognition
   - Feature engineering (age, season, etc.)
   - Personalized models per user

2. **Advanced Statistics**
   - Time series analysis (ARIMA)
   - Trend detection algorithms
   - Anomaly detection for unusual cycles

3. **Multi-Factor Integration**
   - Basal body temperature
   - Cervical mucus observations
   - LH surge detection

4. **Adaptive Learning**
   - User feedback loop
   - Correction-based model updates
   - Dynamic weight adjustment

---

## References & Research

### Scientific Basis

1. **Cycle Length Variability**
   - Mihm et al. (2011): "The normal menstrual cycle"
   - Average cycle: 28±7 days
   - Luteal phase: 14±2 days (more consistent)

2. **Prediction Methods**
   - Bull et al. (2019): "Real-world menstrual cycle characteristics"
   - Statistical approaches for cycle prediction
   - Weighted averages outperform simple averages

3. **Ovulation Timing**
   - Wilcox et al. (2000): "Timing of sexual intercourse"
   - Fertile window: 6 days ending on ovulation day
   - Highest probability: 2 days before ovulation

### Algorithm Design Inspirations

- Moving Average Convergence Divergence (MACD) from finance
- Time series forecasting techniques
- Bayesian updating for confidence scores
- Apps: Flo, Clue, Natural Cycles

---

## Conclusion

This comprehensive documentation provides:

**Architecture**:
- Scalable, modular design
- Clear separation of concerns
- Production-ready deployment strategies

**Algorithm**:
- Mathematically sound prediction methodology
- Transparent confidence scoring
- Robust handling of edge cases

The system balances **simplicity**, **accuracy**, **robustness**, and **transparency** to provide reliable predictions while remaining computationally efficient and scalable.
