# Technical Documentation

Deep dive into period tracker

## Architecture

### The Big Picture

Kept it simple - React frontend talks to Express backend, which talks to PostgreSQL. Redis sits off to the side for caching (but it's optional, app works fine without it).

```
React → Express API → PostgreSQL
           ↓
        Redis (optional)
```

### Stack Choices

**PostgreSQL** Needed relational data - periods belong to users, symptoms belong to periods. Foreign keys with CASCADE deletes made sense. Chose PostgreSQL over MySQL because of better support for date/time calculations - we are doing a lot of date arithmetic (calculating cycle lengths, adding days for predictions, finding date differences). PostgreSQL's interval types and date functions made this cleaner and more reliable.

**Redis** The prediction calculation would take 40-50ms and doesn't change unless the user adds new data. So caching made sense. Made it optional though - if Redis isn't available, the app just calculates fresh every time. Works fine for development.

**TypeScript** everywhere because date calculations are error-prone. Having the compiler catch "you're adding a string to a Date" mistakes before runtime saved us a lot of debugging.

**Sequelize** as the ORM. Not perfect, but decent. The eager loading feature huge for fixing our N+1 query problems, etc features.

## Database Schema

Five tables

```sql
-- Auth stuff
users (id, email, password_hash, timestamps)

-- Core data
periods (id, user_id, start_date, end_date, flow_intensity, notes, created_at)

-- Symptoms tied to periods
symptoms (id, period_id, symptom_type, severity, date)

-- Predictions (save these for analytics later)
predictions (id, user_id, predicted_start/end, ovulation dates, confidence, flow)

-- User defaults for fallback predictions
user_settings (id, user_id, avg_cycle_length, avg_period_length, notifications)
```

Added CASCADE deletes so when you delete a period, its symptoms go away too. Same with user accounts - delete a user, all their data is gone. Keeps things clean.


The symptom table just has an index on period_id since we're always looking up "symptoms for this period."

## The Prediction Algorithm

This is where most of the work went. The goal was to predict the next period date and give a realistic confidence score.

### Why Statistical Instead of ML?

Statistical approach (weighted moving averages, standard deviation) instead of machine learning for as it works with limited data and is easy to understand and explain.

### How It Works

1. Grab the user's last 12 periods (we don't need more than that)
2. Calculate cycle lengths - days between each period start
3. Filter out unrealistic ones (< 21 days or > 45 days, probably data entry errors)
4. Use weighted moving average - recent cycles count more
5. Calculate standard deviation to measure regularity
6. Compute confidence based on regularity + amount of data
7. Predict next period and ovulation dates
8. Guess flow intensity based on last 6 periods

### Weighted Moving Average

This was the tricky part.Could have just averaged all cycle lengths, but recent patterns matter more than old ones. If someone's cycles were 35 days for years but recently shifted to 28 days, the prediction should be closer to 28.

```javascript
if (periods.length <= 3) {
  //just average
  prediction = average(allCycles);
} 
else if (periods.length <= 6) {
  // Weight recent cycles heavier
  recent = average(last3);
  older = average(next3);
  prediction = recent * 0.7 + older * 0.3;
} 
else {
  // Full weighted approach
  recent = average(last3);
  middle = average(next3);
  older = average(remaining);
  prediction = recent * 0.5 + middle * 0.3 + older * 0.2;
}
```

The weights (0.5, 0.3, 0.2) are somewhat arbitrary.But fine for our use case.

### Confidence Scoring

This was harder than expected. How confident should be in a prediction?

Broke it down:

**Base confidence from regularity:**
- If standard deviation < 2 days: 92% (very regular)
- If 2-4 days: 82% (regular)
- If 4-7 days: 67% (somewhat irregular)
- If 7+ days: 50% (irregular)

**Data boost:**
More periods = better.Give up to 8% boost when someone has 12+ periods tracked.
```javascript
dataBoost = Math.min(periodCount / 12, 1.0) * 0.08;
```

**Cycle length penalty:**
Typical cycles (26-32 days) are easier to predict. Anything outside that range gets -5%.

Final confidence is capped between 40% and 95%. Never want to be overconfident (95% max) as its medical test can vary from person to person or completely uncertain (40% floor).

LLD for Prediction Algorithm: [LLD_For_Period_Tracker.md](./LLD_For_Period_Tracker.md)

### Example Walkthrough

Say we have 8 periods with cycle lengths: [28, 27, 27, 29, 28, 26, 28, 29]

**Weighted average:**
- Recent 3: [28, 27, 27] = 27.33 average
- Middle 3: [29, 28, 26] = 27.67 average
- Older 2: [28, 29] = 28.5 average
- Prediction: 27.33 * 0.5 + 27.67 * 0.3 + 28.5 * 0.2 = **27.625 days**

**Standard deviation:**
- Mean: 27.625
- Calculate variance, take square root
- Result: **0.97 days** → "Very Regular"

**Confidence:**
- Base: 0.92 (very regular)
- Data boost: (8/12) * 0.08 = 0.053
- Cycle penalty: 0 (27.625 is normal range)
- Total: **97.3% confidence**

**Next period:**
- Last period started Feb 1
- Add 28 days (rounded prediction)
- **Predicted start: Feb 29**

**Ovulation:**
- 14 days before predicted start (standard luteal phase)
- **Ovulation around Feb 15**
- Fertile window: 5 days before to 1 day after

### Flow Intensity

This one's simpler. Just count how often each intensity appears in the last 6 periods, with recent periods weighted more:

```javascript
counts = { light: 0, moderate: 0, heavy: 0 };

// Count all periods
last6.forEach(p => counts[p.flow_intensity]++);

// Boost recent 3 periods
last6.slice(0, 3).forEach(p => counts[p.flow_intensity] += 0.5);

// Return most common
return mostCommon(counts) || 'moderate';
```

### Edge Cases Handle

**Less than 3 periods:** Can't do statistics. Fall back to user settings (28-day cycle, 5-day period) or defaults. Confidence drops to 40%.

**Unrealistic cycles:** Filter out anything < 21 or > 45 days. Probably typos or special circumstances.

**Missing end dates:** Skip those periods when predicting flow intensity, but can still use start dates for cycle length calculations.


### AI Model for Predictions?

For future enhancements, LSTM networks are good at time series predictions.understanding patterns and predicting future periods, individual based predictions, irregular cycles prediction, etc.

If we have users with 50+ cycles tracked, we could do per-user ML models. But not worth it now.

## Caching

The prediction calculation isn't expensive (40-50ms) but it's called a lot and only changes when users log new periods. Perfect caching scenario.

### Implementation

Cache key is `predictions:{userId}`. cache the entire response - next period, ovulation, cycle stats, everything.

```javascript
// Check cache first
const cached = await redis.get(`predictions:${userId}`);
if (cached) return JSON.parse(cached);

// Calculate if not in cache
const prediction = await calculatePrediction(userId);

// Cache for 1 hour
await redis.setex(`predictions:${userId}`, 3600, JSON.stringify(prediction));
return prediction;
```

**Invalidation** happens when someone adds/updates/deletes a period:
```javascript
await redis.del(`predictions:${userId}`);
```

Simple but effective. Next request will recalculate with fresh data.

### Graceful Degradation

Redis is optional. If it's not running, just skip caching:
```javascript
if (!redis.isReady) {
  return await calculatePrediction(userId);
}
```

Makes local development easier - no need to spin up Redis just to test the app.

### Cache Hit Rate

Can can get 85-90% hit rate. Makes sense - most users check their prediction a few times without adding new data in between.

## API Design

Pretty standard REST API.

### Response Format

Consistent format for everything:
```json
{ "success": true, "data": {...} }
{ "success": false, "error": "message" }
```

### Authentication

JWT tokens with 7-day expiry. went with JWTs instead of sessions because:
- Stateless - no session storage needed
- Easy to scale horizontally
- Token contains user ID, that's all we need

The token goes in Authorization header:
```
Authorization: Bearer <token>
```

Middleware validates it on protected routes and attaches user info to the request.

### Rate Limiting

100 requests per 15 minutes per IP. Generous enough for normal use, protects against basic abuse.

```javascript
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Validation

Using Zod to validate incoming data:
```typescript
const periodSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  flow_intensity: z.enum(['light', 'moderate', 'heavy']).optional()
});
```

Catches bad input before it hits the database. Returns clear error messages.

## Performance Optimizations

See [QUERY_OPTIMIZATION.md](./QUERY_OPTIMIZATION.md) for more details.


## Testing

Jest tests for the prediction service. Not full coverage but tests the critical paths:

Tests run on every push via GitHub Actions. Helps catch regressions.

## Deployment

GitHub Actions runs tests on push. If they pass, the frontend and backend auto-deploy.

The database is serverless PostgreSQL. Free tier works fine for our scale.

### Cold Starts

One annoying thing about free tier hosting - backend goes to sleep after 15 minutes of inactivity. First request after that takes 10-30 seconds to wake up. Acceptable for a demo but we would need always-on instances for production.

## Future Improvements

If we were rebuilding this:

- Try ML models for users with lots of data(LSTM)
- Detect anomalies (missed periods, sudden pattern changes)
- Analyze symptom correlations
- Smart notifications based on user's cycle patterns
- More detailed analytics
- External factors analysis (weather, stress,diet, sleep,exercise, etc.)
- Integrate with other health apps (Google Fit, Apple Health, etc.) & devices (smartwatches, fitness trackers, rings, etc.)


**Performance:**
- Pagination from the start
- Read replicas for scaling
- Pre-compute predictions for active users (cron job at night)
- Horizontal scaling

