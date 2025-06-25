const rateLimit = require('express-rate-limit');

// 1. Blog posting limiter
const postBlogLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2,
  message: 'Too many blog posts from this IP, please try again in a minute',
});

// 2. Comment posting limiter
const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: 'Too many comments, please wait before commenting again',
});

// 3. Login/Logout limiter
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  message: 'Too many login/logout attempts, please try again later',
});

module.exports={
    authLimiter,commentLimiter,postBlogLimiter
}