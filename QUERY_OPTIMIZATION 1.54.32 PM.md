# Database Query Optimization

## 1. Adding Indexes on Foreign Keys

### The Problem I Faced

With large number of periods, it will taking way too long. We can run a simple query:

```sql
SELECT * FROM periods WHERE user_id = 'abc-123';
```

The database will be doing a full table scan. It will literally checking every single row in the table to find the user's periods. This was fine with 10 rows during development, but became painfully slow as more data got added.

### What we can do?

Add indexes on the columns constantly filtering by:

```sql
CREATE INDEX idx_periods_user_id ON periods(user_id);
CREATE INDEX idx_periods_start_date ON periods(start_date);
CREATE INDEX idx_symptoms_period_id ON symptoms(period_id);
```

Instead of scanning the whole table, PostgreSQL could now do a quick B-tree lookup and jump straight to the relevant rows.
It's like having a book index i.e. instead of reading every page to find something, you just look it up.
Considerable improvement in query performance
---

## 2. Preventing Duplicate Symptoms

### The Issue

We can create a composite unique index:

```sql
CREATE UNIQUE INDEX unique_period_symptom 
ON symptoms (period_id, symptom_type);
```

This does two things:

The database automatically rejects any duplicate symptom for a period - I don't need to write extra validation code

---

## 3. Only Fetching What We Need

```typescript
// Bad approach
const periods = await Period.findAll({ 
  where: { user_id: userId } 
});
```

```typescript
// Better approach 
const periods = await Period.findAll({
  where: { user_id: userId },
  attributes: ['id', 'start_date', 'end_date', 'flow_intensity'],
  order: [['start_date', 'DESC']],
  limit: 12
});
```

This will definitely make a noticeable difference in query performance:

- Less data transferred over the network
- Faster JSON serialization
- Lower memory usage on both server and client

---

## 4. Fixing the N+1 Query Problem

```typescript
// This looked innocent enough...
const periods = await Period.findAll({ where: { user_id: userId } });

for (const period of periods) {
  const symptoms = await Symptom.findAll({ where: { period_id: period.id } });
  period.symptoms = symptoms;
}
```

 Making one query to get all periods, then a separate query for each period's symptoms. This is called the "N+1 problem" - 1 query + N additional queries.

**What is actually happening:**

```
Query 1: Get all periods for user
Query 2: Get symptoms for period 1
Query 3: Get symptoms for period 2
Query 4: Get symptoms for period 3
... and so on
```

For a user with 100 periods, that's 101 database queries i.e. 1 query to get all periods and 100 queries to get the symptoms for each period.

We can use Sequelize's `include` option, which does a JOIN and fetches everything in just 2 queries:

```typescript
const periods = await Period.findAll({
  where: { user_id: userId },
  include: [{
    model: Symptom,
    as: 'symptoms',
    attributes: ['id', 'symptom_type', 'severity', 'date']
  }],
  order: [['start_date', 'DESC']]
});
```

Now the database does:

```
Query 1: Get all periods for user
Query 2: Get all symptoms for those periods in one go
```

Just 2 queries no matter how many periods the user has. The performance improvement will be dramatic

---

## 5. Limiting Query Results

Recent cycles are much more relevant than old ones. So instead of loading everything:

```typescript
// Original approach - loading everything
const periods = await Period.findAll({
  where: { user_id: userId },
  order: [['start_date', 'DESC']]
});
```

We can limited it to just the most recent cycles:

```typescript
// Smarter approach
const periods = await Period.findAll({
  where: { user_id: userId },
  order: [['start_date', 'DESC']],
  limit: 12 
});
```

---

## 6. Implementing Pagination(any server side or client side)

### Making Lists User-Friendly

Loading hundreds of records at once felt wrong i.e. it would be slow to load and overwhelming to look at. So we can implement pagination:

```typescript
const limit = parseInt(req.query.limit as string) || 20;
const page = parseInt(req.query.page as string) || 1;
const offset = (page - 1) * limit;

const { rows: periods, count } = await Period.findAndCountAll({
  where: { user_id: userId },
  limit,
  offset,
  order: [['start_date', 'DESC']],
  attributes: ['id', 'start_date', 'end_date', 'flow_intensity', 'notes']
});

return {
  periods,
  pagination: {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    hasNext: offset + limit < count,
    hasPrev: page > 1
  }
};
```

Now the frontend gets 20 periods at a time, with info about whether there are more pages. Much better user experience, and the API responses are consistently fast.

### Understanding Cursor-Based Pagination

For really large datasets, offset-based pagination can get slow. Here's why:

When you do `OFFSET 1000`, the database still has to scan through and skip those first 1000 rows before it can return your results. So if a user is on page 50 (offset 1000), the query is slower than page 1 (offset 0).

Cursor-based pagination solves this by using a "cursor" - typically the last value from the previous page - as a starting point:

```typescript
// Instead of using offset, use the last date we saw
app.get('/api/periods', async (req, res) => {
  const limit = 20;
  const lastSeenDate = req.query.cursor; // e.g., "2025-06-15"
  
  const query: any = { user_id: userId };
  
  // If we have a cursor, only fetch periods older than this date
  if (lastSeenDate) {
    query.start_date = { [Op.lt]: lastSeenDate };
  }
  
  const periods = await Period.findAll({
    where: query,
    limit: limit + 1, // Fetch one extra to know if there's a next page
    order: [['start_date', 'DESC']],
    attributes: ['id', 'start_date', 'end_date', 'flow_intensity']
  });
  
  const hasNext = periods.length > limit;
  const results = hasNext ? periods.slice(0, -1) : periods;
  const nextCursor = hasNext ? results[results.length - 1].start_date : null;
  
  return {
    periods: results,
    nextCursor,  // Frontend sends this back to get the next page
    hasNext
  };
});
```

**How this works:**

- **Page 1**: No cursor, fetch first 20 periods
- **Page 2**: Cursor is the date of the 20th period from page 1. Query becomes `WHERE start_date < '2025-06-15'`, which uses the index efficiently
- **Page 3**: Cursor is the date of the 20th period from page 2, and so on

**Why it's better for large datasets:**

```sql
-- Offset-based (slow for page 50)
SELECT * FROM periods 
WHERE user_id = $1 
ORDER BY start_date DESC 
OFFSET 1000 LIMIT 20;
-- Database scans through 1000 rows just to skip them

-- Cursor-based (fast regardless of page)
SELECT * FROM periods 
WHERE user_id = $1 AND start_date < '2025-06-15'
ORDER BY start_date DESC 
LIMIT 20;
-- Database uses index to jump straight to the right spot
``
---
  
## 7. Setting Up Connection Pooling

### Understanding Database Connections

Opening a new database connection is expensive - it takes time to establish the TCP connection, authenticate, and set up the session. 
So we can use connection pooling - maintaining a pool of open connections that can be reused:

```typescript
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  pool: {
    max: 10,        // Keep up to 10 connections open
    min: 2,         // Always maintain at least 2
    acquire: 30000, // Give up after 30s if can't get connection
    idle: 10000     // Close connection if idle for 10s
  },
  logging: false
});

```

Here's how it works:

- Request comes in → Grab an available connection from the pool
- Execute query → Return connection to pool for reuse
- If all connections are busy → Wait for one to become available (up to the acquire timeout)

This will definitely make a huge difference in response times, especially under load. Instead of spending 50ms per request just establishing a connection, we're reusing existing connections with almost no overhead.

---

## 8. Adding Redis Caching

### The Biggest Performance Win

The prediction calculation involves fetching periods, calculating cycle lengths, computing standard deviation, and generating confidence scores. It's not super expensive, but it was happening on every single request to the predictions endpoint.

Here's the thing though - predictions don't change unless the user adds a new period. So why recalculate every time?

Added Redis caching:

```typescript
app.get('/api/predictions/next-period', async (req, res) => {
  const cacheKey = `predictions:${userId}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ ...JSON.parse(cached), cached: true });
  }
  
  // Not in cache - calculate it
  const prediction = await predictionService.predictNextPeriod(userId);
  
  // Store in cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(prediction));
  
  res.json({ ...prediction, cached: false });
});
```

The key insight: **cache invalidation**. Whenever a user adds, updates, or deletes a period, I clear their prediction cache:

```typescript
app.post('/api/periods', async (req, res) => {
  const period = await Period.create(req.body);
  
  // Clear cache so next request gets fresh prediction
  await redis.del(`prediction:v4:${userId}`);
  
  res.json(period);
});
```

We can 85-90% cache hit rate, which means the vast majority of prediction requests don't even touch the database. Response times drops

---

## 9. Optimizing Date Range Queries

### Making Date Filters Fast

Endpoint that fetches periods within a date range. My first implementation worked but wasn't efficient:

```typescript
const periods = await Period.findAll({
  where: {
    user_id: userId,
    start_date: {
      [Op.between]: ['2025-01-01', '2025-12-31']
    }
  }
});
```

The query was doing a sequential scan because while we have an index on `user_id`, filtering by both user and date still required scanning through all of that user's periods.

We can add a composite index:

```sql
CREATE INDEX idx_periods_user_date ON periods(user_id, start_date);
```

The difference is that PostgreSQL can now use the index for both conditions efficiently. It finds the user's rows using the first part of the index, then uses the second part to quickly narrow down to the date range.

---

## 10. Avoiding SELECT *

We can always specify which columns we actually need:

```typescript
// Instead of this
const period = await Period.findOne({
  where: { id: periodId }
});

// I do this
const period = await Period.findOne({
  where: { id: periodId },
  attributes: ['id', 'start_date', 'end_date', 'flow_intensity']
});
```

This is especially important when fetching multiple records. If we are showing a list of 50 periods, omitting unnecessary fields can reduce the payload significantly.

---
