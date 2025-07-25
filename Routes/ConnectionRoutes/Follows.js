const express = require("express");
const router = express.Router();
const { UserSockets } = require("../../Sockets/Sockets");
const sql = require("../../Configs/db");
const Redisclient = require("../../Redis/RedisClient");

// 1. Get people you may want to follow
router.get("/suggestions/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await sql`
      SELECT *
      FROM users
      WHERE user_id != ${userId}
        AND user_id NOT IN (
          SELECT following_id FROM follows WHERE follower_id = ${userId}
        )
    `;
    res.json(result);
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
    await sql`
      INSERT INTO follows (follower_id, following_id)
      VALUES (${follower_id}, ${following_id})
      ON CONFLICT DO NOTHING
    `;
    // Send socket notification if online
    // Insert into new notifications table
    await sql`
      INSERT INTO notifications (user_id, type, follower_id) VALUES (${following_id}, 'follow', ${follower_id})
    `;
    await Redisclient.del(`notifications#${following_id}`);
    // Invalidate followers and following cache
    await Redisclient.del(`followers#${following_id}`);
    await Redisclient.del(`following#${follower_id}`);
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
// cached
router.get("/followers/:id", async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `followers#${userId}`;
  try {
    const cached = await Redisclient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    const result = await sql`
      SELECT *
      FROM follows f
      JOIN users u ON f.follower_id = u.user_id
      WHERE f.following_id = ${userId}
    `;
    await Redisclient.set(cacheKey, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// 4. Get people the user is following
// Cached
router.get("/following/:id", async (req, res) => {
  const userId = req.params.id;
  const cacheKey = `following#${userId}`;
  try {
    const cached = await Redisclient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    const result = await sql`
      SELECT *
      FROM follows f
      JOIN users u ON f.following_id = u.user_id
      WHERE f.follower_id = ${userId}
    `;
    await Redisclient.set(cacheKey, JSON.stringify(result));
    res.json(result);
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
    await sql`
      DELETE FROM follows WHERE follower_id = ${follower_id} AND following_id = ${user_id}
    `;
    // Remove follow notification from new notifications table
    await sql`
      DELETE FROM notifications WHERE type = 'follow' AND user_id = ${user_id} AND follower_id = ${follower_id}
    `;
    // Invalidate followers and following cache
    await Redisclient.del(`followers#${user_id}`);
    await Redisclient.del(`following#${follower_id}`);
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
    await sql`
      DELETE FROM follows WHERE follower_id = ${follower_id} AND following_id = ${following_id}
    `;
    // Remove follow notification from new notifications table
    await sql`
      DELETE FROM notifications WHERE type = 'follow' AND user_id = ${following_id} AND follower_id = ${follower_id}
    `;
    // Invalidate followers and following cache
    await Redisclient.del(`followers#${following_id}`);
    await Redisclient.del(`following#${follower_id}`);
    res.json({ message: "Unfollowed and notification deleted" });
  } catch (err) {
    console.error("Error unfollowing:", err);
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

module.exports = router;