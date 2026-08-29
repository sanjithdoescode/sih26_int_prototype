import { createClient } from 'redis';
import { config } from '../config.js';

class LiveStore {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryBuses = new Map();
  }

  async connect() {
    try {
      this.client = createClient({
        url: config.redisUrl,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: (retries) => (retries > 3 ? false : 1000),
        },
      });

      this.client.on('error', (err) => {
        // Suppress repeated logs if connection fails
        if (this.isConnected) {
          console.warn('Redis error:', err.message);
        }
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Connected to Redis at', config.redisUrl);
    } catch (err) {
      console.warn('⚠️ Redis connection failed, falling back to In-Memory live store:', err.message);
      this.isConnected = false;
    }
  }

  async setBus(busId, state) {
    const serialized = JSON.stringify(state);
    this.memoryBuses.set(busId, state);

    if (this.isConnected && this.client) {
      try {
        await this.client.set(`bus:${busId}`, serialized, { EX: 60 * 60 });
      } catch (err) {
        console.error('Redis set error:', err.message);
      }
    }
  }

  async getBus(busId) {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(`bus:${busId}`);
        if (raw) return JSON.parse(raw);
      } catch (err) {
        console.error('Redis get error:', err.message);
      }
    }
    return this.memoryBuses.get(busId) || null;
  }

  async getAllBuses() {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys('bus:*');
        if (keys.length > 0) {
          const values = await this.client.mGet(keys);
          return values.filter(Boolean).map((v) => JSON.parse(v));
        }
      } catch (err) {
        console.error('Redis mGet error:', err.message);
      }
    }
    return Array.from(this.memoryBuses.values());
  }

  async clearAll() {
    this.memoryBuses.clear();
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys('bus:*');
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (err) {
        console.error('Redis clear error:', err.message);
      }
    }
  }
}

export const liveStore = new LiveStore();
