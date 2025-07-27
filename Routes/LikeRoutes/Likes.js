const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");
const Redisclient = require("../../Redis/RedisClient");


router.get("/get/blogs/like_status/", async (req, res) => {
  const { userId, blog_id } = req.query;

  try {
    const query = await sql`
      SELECT status FROM likes WHERE user_id = ${userId} AND blog_id = ${blog_id}
    `;

    if (query.length === 0) {
      return res.status(200).json({ status: 0 });
    } 

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

router.get("/get/blogs/likes_count", async (req, res) => {
  const { blog_id } = req.query;
  const Key = `likes#${blog_id}`;
  try {
    const cachedData = await Redisclient.get(Key);
    if (cachedData !== null) {
      return res.status(200).json({ count: parseInt(cachedData) });
    }
    const result = await sql`
      SELECT COUNT(*) AS count 
      FROM likes 
      WHERE status = 1 AND blog_id = ${blog_id}
    `;
    const count = result[0]?.count || 0;
    await Redisclient.set(Key, count);
    return res.status(200).json({ count: parseInt(count) });
  } catch (error) {
    console.log("Error fetching likes count:", error);
    return res.status(400).json({ message: error.message, count: 0 });
  }
});

router.post("/blogs/likes", async (req, res) => {
  const { userId, blog_id } = req.body;
  const Key = `likes#${blog_id}`;

  try {
    // Check if a like record exists
    const existingLike = await sql`
      SELECT status FROM likes WHERE user_id = ${userId} AND blog_id = ${blog_id}
    `;

    if (existingLike.length > 0) {
      // If exists, toggle the status
      const updated = await sql`
        UPDATE likes 
        SET status = 1 - status 
        WHERE user_id = ${userId} AND blog_id = ${blog_id}
        RETURNING status
      `;
      await Redisclient.del(Key);
      return res.status(200).json({
        message: "Like status toggled",
        status: updated[0].status
      });
    } else {
      // If not exists, insert new like with status = 1
      await sql`
        INSERT INTO likes(user_id, blog_id, status) 
        VALUES (${userId}, ${blog_id}, 1)
      `;
      await Redisclient.del(Key);
      return res.status(200).json({ message: "Like added successfully", status: 1 });
    }
  } catch (error) {
    return res.status(400).json({
      message: "Error occurred while processing like",
      error: error.message
    });
  }
});


module.exports =router;