// redisClient.js
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true, // Required for Upstash
  },
  legacyMode: true, // Optional, useful if you use .get/.set the old way
});

redisClient.connect()
  .then(() => console.log('✅ Connected to Upstash Redis'))
  .catch(err => console.error('❌ Redis connection error:', err));

export default redisClient;
