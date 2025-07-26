const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");
const Redisclient = require("../../Redis/RedisClient");

router.post("/add/blogs/likes/", async (req, res) => {
  const { userId, blog_id } = req.body;
  try {
    await sql`
      INSERT INTO likes(user_id, blog_id, status) VALUES (${userId}, ${blog_id}, 1)
    `;
    return res.status(200).json({ message: "Like added succesfully" });
  }
  catch (error) {
    return res.status(400).json({ message: "Error occured while liking", error: error.message });
  }
});

router.get("/get/blogs/like_status/", async (req, res) => {
  const { userId, blog_id } = req.query;

  try {
    const query = await sql`
      SELECT status FROM likes WHERE user_id = ${userId} AND blog_id = ${blog_id}
    `;

    // If no record exists, user hasn't interacted yet
    if (query.length === 0) {
      return res.status(200).json({ status: 0 }); // -1 → not liked yet
    } 

    // Otherwise, return the actual status (0 or 1)
    return res.status(200).json({
      message: "Successfully got like status",
      status: query[0].status,
    });

  } catch (error) {
    return res.status(400).json({
      message: "Error occurred while getting the like status",
      error: error.message,
    });
  }
});

// Cached
router.get("/get/blogs/likes_count", async (req, res) => {
  const { user_Id, blog_id } = req.query;
  const Key = `likes#${user_Id}#${blog_id}`;
  try {
    const cachedData = await Redisclient.get(Key);
    if (cachedData !== null) {
      return res.status(200).json({ count: parseInt(cachedData) });
    }
    const result = await sql`
      SELECT COUNT(*) AS count 
      FROM likes 
      WHERE status = 1 AND user_id = ${user_Id} AND blog_id = ${blog_id}
    `;
    console.log("puthusu", result[0], user_Id, blog_id);
    const count = result[0]?.count || 0;
    await Redisclient.set(Key, count);
    return res.status(200).json({ count });
  } catch (error) {
    console.log("Error fetching likes count:", error);
    return res.status(400).json({ message: error.message, count: 0 });
  }
});

router.put("/edit/blogs/likes", async (req, res) => {
  const { userId, blog_id } = req.body;
  const Key=`likes#${userId}#${blog_id}`;
  try {
    const query = await sql`
      UPDATE likes SET status = 1 - status WHERE user_id = ${userId} AND blog_id = ${blog_id} RETURNING status
    `;
    await Redisclient.del(Key);
    return res.status(200).json({
      message: "Successfully updated the like",
      status: query[0].status
    });
  }
  catch (error) {
    return res.status(400).json({
      message: "Error occured while updating like",
      error: error.message
    });
  }
});

module.exports =router;
