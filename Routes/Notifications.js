const express = require("express");
const router = express.Router();
const pool = require("../Configs/db");

// Get all notifications for a user (all types, sorted by time)
router.get("/notifications/all", async (req, res) => {
  const { userId } = req.query;
  try {
    const query = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY notification_time DESC",
      [userId]
    );
    return res.status(200).json({ notifications: query.rows });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Create a blog notification
router.post("/notifications/blog", async (req, res) => {
  const { blogId, userId } = req.body;
  try {
    const query = await pool.query(
      "INSERT INTO notifications (user_id, type, blog_id) VALUES ($1, 'blog', $2) RETURNING *",
      [userId, blogId]
    );
    return res.status(201).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Create a comment notification
router.post("/notifications/comment", async (req, res) => {
  const { blogId, commentId, userId } = req.body;
  try {
    const query = await pool.query(
      "INSERT INTO notifications (user_id, type, blog_id, comment_id) VALUES ($1, 'comment', $2, $3) RETURNING *",
      [userId, blogId, commentId]
    );
    return res.status(201).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Create a follow notification
router.post("/notifications/follow", async (req, res) => {
  const { userId, followerId } = req.body; // userId = recipient, followerId = who followed
  try {
    const query = await pool.query(
      "INSERT INTO notifications (user_id, type, follower_id) VALUES ($1, 'follow', $2) RETURNING *",
      [userId, followerId]
    );
    return res.status(201).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Mark a notification as read
router.put("/notifications/read", async (req, res) => {
  const { notificationId } = req.body;
  try {
    const query = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *",
      [notificationId]
    );
    return res.status(200).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;