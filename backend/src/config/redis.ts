import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  
  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });
  
  redis.on('error', (err) => {
    console.error('Redis error:', err);
  });
} else {
  console.log('Redis not configured - caching disabled');
}

export const redisClient = redis;

export const cacheHelpers = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  async delete(pattern: string): Promise<void> {
    if (!redis) return;
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis DELETE error:', error);
    }
  },

  isAvailable(): boolean {
    return redis !== null && redis.status === 'ready';
  }
};
