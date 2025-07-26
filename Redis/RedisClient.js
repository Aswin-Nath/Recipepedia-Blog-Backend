const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true
  },
  legacyMode: true
});

redisClient.connect()
  .then(() => console.log('✅ Connected to Upstash Redis'))
  .catch(err => console.error('❌ Redis connection error:', err));

module.exports = redisClient;
