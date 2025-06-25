const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

const {commentLimiter}=require("../Middleware/rateLimiters");

router.get("/get/:blog_id/comment", async (req, res) => {
  try {
    const {blog_id}=req.params;
    const result = await pool.query("SELECT * FROM comments where blog_id=$1",[blog_id]);
    // console.log(result.rows);
    return res.status(201).json({ message: result.rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/add/comment", commentLimiter, async (req, res) => {
  const { blog_id, userId, content, parent_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO comments (blog_id, user_id, content, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [blog_id, userId, content, parent_id || null]
    );

    return res.status(201).json({
      message: "Comment inserted",
      comment: result.rows[0]
    });
  } catch (error) {
    console.error("Error inserting comment:", error);
    return res.status(400).json({ message: error.message });
  }
});




module.exports=router;