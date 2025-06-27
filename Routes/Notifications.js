const express = require("express");
const router = express.Router();
const pool = require("../Configs/db");

// Get all blog notifications for a user (by user_id)
router.get("/notifications/blog", async (req, res) => {
  const { userId } = req.query;
  try {
    const query = await pool.query(
      "SELECT * FROM blog_notifications WHERE user_id = $1 ORDER BY notification_time DESC",
      [userId]
    );
    return res.status(200).json({ notifications: query.rows });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Get all comment notifications for a user (by user_id)
router.get("/notifications/comment", async (req, res) => {
  const { userId } = req.query;
  try {
    const query = await pool.query(
      "SELECT * FROM comment_notifications WHERE user_id = $1 ORDER BY notification_time DESC",
      [userId]
    );
    return res.status(200).json({ notifications: query.rows });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Post a new blog notification
router.post("/notifications/blog", async (req, res) => {
  const { blogId, userId } = req.body;
  try {
    const query = await pool.query(
      "INSERT INTO blog_notifications (blog_id, user_id) VALUES ($1, $2) RETURNING *",
      [blogId, userId]
    );
    return res.status(201).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Post a new comment notification
router.post("/notifications/comment", async (req, res) => {
  const { blogId, commentId, userId } = req.body;
  try {
    const query = await pool.query(
      "INSERT INTO comment_notifications (blog_id, comment_id, user_id) VALUES ($1, $2, $3) RETURNING *",
      [blogId, commentId, userId]
    );
    return res.status(201).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Update blog notification as read (by notification_id)
router.put("/notifications/blog/read", async (req, res) => {
  const { notificationId } = req.body;
  try {
    const query = await pool.query(
      "UPDATE blog_notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *",
      [notificationId]
    );
    return res.status(200).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

// Update comment notification as read (by notification_id)
router.put("/notifications/comment/read", async (req, res) => {
  const { notificationId } = req.body;
  try {
    const query = await pool.query(
      "UPDATE comment_notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *",
      [notificationId]
    );
    return res.status(200).json({ notification: query.rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports=router;