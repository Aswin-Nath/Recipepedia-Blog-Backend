const express=require("express");

const router=express.Router();

const {UserSockets} = require("../Sockets/Sockets");
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

    const newComment = result.rows[0];

    const blogQuery = await pool.query(
      `SELECT user_id FROM blogs WHERE blog_id = $1`,
      [blog_id]
    );
    console.log(blogQuery);
    if (blogQuery.rowCount > 0) {
      const blogOwnerId = blogQuery.rows[0].user_id;

      if (blogOwnerId) {
        // 1️⃣ Save to comment_notifications
        await pool.query(
          `INSERT INTO comment_notifications (blog_id, comment_id, user_id)
           VALUES ($1, $2, $3)`,
          [blog_id, newComment.comment_id, blogOwnerId]
        );

        // 2️⃣ Emit to blog owner via socket
        const ownerSocket = UserSockets.get(blogOwnerId);
        if (ownerSocket) {
          console.log(ownerSocket);
          ownerSocket.emit("notify", {
            type: "comment",
            message: `📩 New comment on your blog by user ${userId}`,
            blog_id,
            comment: newComment,
          });
        } else {
          
          console.log(`⚠️ No active socket for blog owner ${blogOwnerId}`);
        }
      }
    }

    return res.status(201).json({
      message: "Comment inserted",
      comment: newComment,
    });
  } catch (error) {
    console.error("❌ Error inserting comment:", error);
    return res.status(400).json({ message: error.message });
  }
});



module.exports=router;