const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");

router.post("/add/blogs/likes/", async (req, res) => {
  const { userId, blog_id } = req.body;
  try {
    await sql`
      INSERT INTO likes(user_id, blog_id, status) VALUES (${userId}, ${blog_id}, 1)
    `;
    await sql`
      UPDATE blogs SET likes = likes + 1 WHERE blog_id = ${blog_id}
    `;
    return res.status(200).json({ message: "Like added succesfully" });
  }
  catch (error) {
    return res.status(400).json({ message: "Error occured while liking", error: error.message });
  }
});

router.post("/get/blogs/likes/", async (req, res) => {
  const { userId, blog_id } = req.body;
  try {
    const query = await sql`
      SELECT * FROM likes WHERE user_id = ${userId} AND blog_id = ${blog_id}
    `;
    var status = 0;
    if (query?.length > 0) {
      status = query[0].status;
    }
    if (query.length === 0) {
      return res.status(200).json({ status: -1 });
    }
    return res.status(200).json({ message: "Successfully got like status", status: status });
  }
  catch (error) {
    return res.status(400).json({ message: "Error occured while getting the like status", error: error.message });
  }
});

router.put("/edit/blogs/likes", async (req, res) => {
  const { userId, blog_id, newLikeStatus } = req.body;
  try {
    const query = await sql`
      UPDATE likes SET status = 1 - status WHERE user_id = ${userId} AND blog_id = ${blog_id} RETURNING status
    `;
    var val;
    if (newLikeStatus == 0) {
      val = -1;
    }
    else {
      val = 1;
    }
    await sql`
      UPDATE blogs SET likes = likes + ${val} WHERE blog_id = ${blog_id}
    `;
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