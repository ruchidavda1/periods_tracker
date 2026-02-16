# Low-Level Design - Period Tracker

Implementation specs and technical details for the Period Tracker application.

## Database Schema

### Tables Overview

**User Table**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Period Table**

```sql
CREATE TABLE periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    flow_intensity VARCHAR(20) CHECK (flow_intensity IN ('light', 'moderate', 'heavy')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Symptom Table**

```sql
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    symptom_type VARCHAR(100) NOT NULL,
    severity INTEGER CHECK (severity BETWEEN 1 AND 5),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Prediction Table**

```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    predicted_start_date DATE NOT NULL,
    predicted_end_date DATE NOT NULL,
    ovulation_start DATE NOT NULL,
    ovulation_end DATE NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    predicted_flow_intensity VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

```

**UserSettings Table**

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avg_cycle_length INTEGER DEFAULT 28,
    avg_period_length INTEGER DEFAULT 5,
    notifications_enabled BOOLEAN DEFAULT true,
    last_calculated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationships

```
User (1) --> (many) Period
User (1) --> (many) Prediction  
User (1) --> (1) UserSettings
Period (1) --> (many) Symptom
```

---

## Prediction Algorithm Implementation

### Core Logic Flow

```
1. Fetch user's last 12 periods (ordered by date DESC)
2. Check if user has >= 3 completed periods
   - If NO: Use default prediction (settings-based) i.e. 28 days cycle length and 5 days period length
   - If YES: Continue to statistical prediction
3. Calculate cycle lengths (days between period start dates) for all periods
4. Filter out invalid cycles (<21 or >45 days) i.e. not realistic cycle lengths (data entry errors)
5. Calculate statistics:
    - Cycle lengths for each period for the given number of periods
    - Weighted moving average for prediction 
        - if number of periods <= 3: use recent average only (100%)
        - if number of periods 4-6: recent 3 cycles * 0.7 + middle 3 cycles * 0.3
        - if number of periods >= 7: recent 3 cycles * 0.5 + middle 3 cycles * 0.3 + older cycles * 0.2
    - Standard deviation i.e. measure of cycle variability
        - formula: √(Σ(xi - μ)² / n)
        - where xi is the individual cycle length and μ is the mean cycle length
        - n is the number of cycles
        - if standard deviation < 2 days: very regular
        - if standard deviation 2-4 days: regular
        - if standard deviation 4-7 days: somewhat irregular
        - if standard deviation >= 7 days: irregular
        - Regularity classification i.e. very regular, regular, somewhat irregular, irregular based on standard deviation
6. Calculate confidence score i.e. base confidence + data boost + cycle adjustment
    - Base confidence: based on cycle regularity
        - if very regular: 0.92
        - if regular: 0.82
        - if somewhat irregular: 0.67
        - if irregular: 0.50
    - Data boost: based on number of periods
       formula: min(number of periods / 12, 1.0) * 0.08 i.e. max boost is 8% when user has 12+ periods tracked
    - Cycle adjustment: based on cycle length
        - if average cycle length between 26-32 days: 0.00 else -0.05
    - Final confidence: base confidence + data boost + cycle adjustment
        - formula: Math.max(0.40, Math.min(0.95, confidence)) i.e. cap between 40-95%
7. Predict next period dates i.e. add the predicted cycle length to the last period start date
8. Predict flow intensity (if data available) i.e. light, moderate, heavy based on the last 6 periods
9. Save prediction to DB
10. Cache prediction in Redis (1 hour TTL)
```

### Example Calculation

User stats (My actual period history):

- Number of periods tracked: 10 i.e. the user has tracked 10 periods
- Cycle Lengths: [22, 25, 24, 26, 22, 27, 21, 25, 22, 35]
- weighted moving average: 24.49 days (recent 3 cycles *0.5 + middle 3 cycles* 0.3 + older cycles * 0.2)
  - recent 3 cycles: [22, 25, 24] -> 23.67
  - middle 3 cycles: [26, 22, 27] -> 25.0
  - older 4 cycles: [21, 25, 22, 35] -> 25.75
  - weighted moving average: 23.67 * 0.5 + 25.0 * 0.3 + 25.75 * 0.2 = 24.49 days
- Standard Deviation: 3.86 days
  - formula: √(Σ(xi - μ)² / n)
        - Mean: (22 + 25 + 24 + 26 + 22 + 27 + 21 + 25 + 22 + 35) / 10 = 24.9
        - Deviations: [-2.9, 0.1, -0.9, 1.1, -2.9, 2.1, -3.9, 0.1, -2.9, 10.1]
        - Squared deviations: [8.41, 0.01, 0.81, 1.21, 8.41, 4.41, 15.21, 0.01, 8.41, 102.01]
        - Sum of squared deviations: 148.9
        - Standard Deviation: √(148.9 / 10) = 3.86 days i.e falls in "Regular" category (2-4 days)
- Confidence Score Calculation:
  - Base Confidence: 0.82 (SD = 3.86, falls in "Regular" category)
    - Data Boost: (10/12) * 0.08 = 0.067
    - Cycle Adjustment: -0.05  (24.49 days is outside typical 26-32 range)
    - Final Confidence: 0.82 + 0.067 - 0.05 = 0.837 = 83.7% confidence score
- Next Period Prediction:
  - Last period start date: 2026-02-12 i.e. the most recent period in the user's period history
    - Next period start date: 2026-02-12 + 24.49 days (rounded to 25) = 2026-03-09
    - Next period end date: 2026-03-09 + 2 days = 2026-03-11
- Ovulation Prediction:
  - Ovulation day: 2026-03-09 - 14 days = 2026-02-23
    - Fertile window start date: 2026-02-23 - 5 days = 2026-02-18
    - Fertile window end date: 2026-02-23 + 1 day = 2026-02-24

### Flow Intensity Prediction

Uses weighted frequency analysis on last 6 periods:
// Step 1: Count each flow intensity

```javascript
intensityCounts = { light: 0, moderate: 0, heavy: 0 }

periodsWithFlow.forEach(period => {
  intensityCounts[period.flow_intensity]++
})

// Step 2: Add bonus weight for recent 3 periods
recentPeriods.slice(0, 3).forEach(period => {
  intensityCounts[period.flow_intensity] += 0.5
})

// Step 3: Return most common
return mostCommonIntensity || 'moderate'
```

---

## Caching Strategy

### Redis Cache Implementation

**Cache Keys Format**:

```
predictions:{userId}     // Next period prediction (TTL: 1hr)
```

We cache the entire prediction object to avoid recalculating it every time.It includes next period prediction, ovulation prediction, and cycle stats(average cycle length, average period length, cycle regularity, cycle variation, cycles tracked, standard deviation).

**Cache Flow**:

```
1. Check Redis: GET predictions:{userId}
2. If found -> Return cached data
3. If not found:
   - Calculate prediction
   - Save to Redis: SETEX predictions:{userId} 3600 <data>
   - Save to database
   - Return fresh data
```

**Cache Invalidation**:

- Automatic: TTL expires after 1 hour
- Manual: When user adds/updates/deletes period data
  - DELETE predictions:*:{userId}

**Why 1 hour TTL?**
Predictions don't change frequently. 1 hour is a good balance to avoid database load

## API Endpoints

### Overview

**Authentication**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

**Period Management**

- `POST /api/periods` - Create period entry
- `GET /api/periods` - Get user's period history
- `GET /api/periods/:id` - Get specific period
- `PUT /api/periods/:id` - Update period data
- `DELETE /api/periods/:id` - Remove period

**Symptom Tracking**

- `POST /api/periods/:id/symptoms` - Add symptom to period
- `GET /api/periods/:id/symptoms` - Get period symptoms
- `DELETE /api/symptoms/:id` - Remove symptom

**Predictions** (Core Implementation)

- `GET /api/predictions/next-period` - Next cycle prediction
- `GET /api/predictions/calendar` - Multi-cycle calendar view

---

## Detailed API Specifications

### Prediction APIs

**GET /api/predictions/next-period**

The main prediction endpoint - returns statistical analysis and next period forecast.

Headers:

```
Authorization: Bearer <jwt-token>
```

Response (200):

```json
{
  "success": true,
  "data": {
    "next_period": {
      "predicted_start_date": "2026-02-14",
      "predicted_end_date": "2026-02-15",
      "confidence_score": 0.83,
      "predicted_flow_intensity": "moderate"
    },
    "ovulation": {
      "predicted_start_date": "2026-01-26",
      "predicted_end_date": "2026-02-01"
    },
    "cycle_stats": {
      "avg_cycle_length": 24.9,
      "avg_period_length": 2,
      "cycle_regularity": "regular",
      "cycle_variation": "3.86",
      "cycles_tracked": 10
    }
  },
  "cached": false
}
```

Notes:

- Response is cached in Redis for 1 hour
- Requires minimum 3 periods for statistical prediction
- Falls back to default prediction if insufficient data

---

**GET /api/predictions/calendar?months=3**

Returns multiple cycle predictions for calendar view.

Query Parameters:

- `months` (optional): Number of cycles to predict (default: 3, max: 6)

Response (200):

```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "cycle_number": 1,
        "predicted_start_date": "2026-02-14",
        "predicted_end_date": "2026-02-15",
        "confidence_score": 0.83,
        "predicted_flow_intensity": "moderate",
        "ovulation_start": "2026-01-26",
        "ovulation_end": "2026-02-01"
      },
      {
        "cycle_number": 2,
        "predicted_start_date": "2026-03-10",
        "predicted_end_date": "2026-03-11",
        "confidence_score": 0.79,
        "predicted_flow_intensity": "moderate",
        "ovulation_start": "2026-02-19",
        "ovulation_end": "2026-02-25"
      }
    ],
    "cycle_stats": {
      "avg_cycle_length": 24.9,
      "avg_period_length": 2,
      "cycle_regularity": "regular",
      "cycle_variation": "3.86",
      "cycles_tracked": 10
    }
  }
}
```

Notes:

- Confidence decreases by ~5% per future cycle
- Uses same cycle stats for all predictions
