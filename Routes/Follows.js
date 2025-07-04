const express = require("express");
const router = express.Router();
const { UserSockets } = require("../Sockets/Sockets");
const pool = require("../Configs/db");

// 1. Get people you may want to follow
router.get("/suggestions/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT *
       FROM users
       WHERE user_id != $1
         AND user_id NOT IN (
           SELECT following_id FROM follows WHERE follower_id = $1
         )`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// 2. Connect (follow someone)
router.post("/connect", async (req, res) => {
  const { follower_id, following_id } = req.body;

  if (!follower_id || !following_id || follower_id === following_id) {
    return res.status(400).json({ error: "Invalid user IDs" });
  }

  try {
    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [follower_id, following_id]
    );
    // Send socket notification if online
    // Insert into new notifications table
    await pool.query(
      "INSERT INTO notifications (user_id, type, follower_id) VALUES ($1, 'follow', $2)",
      [following_id, follower_id]
    );
    const ownerSocket = UserSockets.get(following_id);
    if (ownerSocket) {
      ownerSocket.emit("notify", {
        message: `someone has followed you with the id ${follower_id}`
      });
    }
    res.json({ message: "Connected successfully" });
  } catch (err) {
    console.error("Error connecting:", err);
    res.status(500).json({ error: "Connection failed" });
  }
});

// 3. Get followers of a user
router.get("/followers/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT *
       FROM follows f
       JOIN users u ON f.follower_id = u.user_id
       WHERE f.following_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// 4. Get people the user is following
router.get("/following/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT *
       FROM follows f
       JOIN users u ON f.following_id = u.user_id
       WHERE f.follower_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ error: "Failed to get following" });
  }
});

// 5. Remove a follower (they followed you)
router.post("/remove-follower", async (req, res) => {
  const { follower_id, user_id } = req.body;

  if (!follower_id || !user_id) {
    return res.status(400).json({ error: "Missing follower_id or user_id" });
  }

  try {
    // Remove from follows
    await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [follower_id, user_id]
    );
    // Remove follow notification from new notifications table
    await pool.query(
      `DELETE FROM notifications WHERE type = 'follow' AND user_id = $1 AND follower_id = $2`,
      [user_id, follower_id]
    );
    res.json({ message: "Follower removed and notification deleted" });
  } catch (err) {
    console.error("Error removing follower:", err);
    res.status(500).json({ error: "Failed to remove follower" });
  }
});

// 6. You unfollow someone
router.post("/unfollow", async (req, res) => {
  const { follower_id, following_id } = req.body;

  try {
    // Remove from follows
    await pool.query(
      `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
      [follower_id, following_id]
    );
    // Remove follow notification from new notifications table
    await pool.query(
      `DELETE FROM notifications WHERE type = 'follow' AND user_id = $1 AND follower_id = $2`,
      [following_id, follower_id]
    );
    res.json({ message: "Unfollowed and notification deleted" });
  } catch (err) {
    console.error("Error unfollowing:", err);
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

module.exports = router;