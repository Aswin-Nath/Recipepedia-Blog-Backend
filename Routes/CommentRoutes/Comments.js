const express = require("express");

const router = express.Router();

const { UserSockets } = require("../../Sockets/Sockets");
const sql = require("../../Configs/db");

const { commentLimiter } = require("../../Middleware/rateLimiters");
const Redisclient = require("../../Redis/RedisClient");
//  Cached
router.get("/get/:blog_id/comment", async (req, res) => {
  try {
    const { blog_id } = req.params;
    const Key = `comments#${blog_id}`;
    const cachedData = await Redisclient.get(Key);
    if (cachedData !== null) {
      return res.status(201).json({ message: JSON.parse(cachedData) }); 
    }

    const result = await sql`
      SELECT * FROM comments WHERE blog_id = ${blog_id}
    `;
    await Redisclient.set(Key, JSON.stringify(result));
    return res.status(201).json({ message: result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/add/comment", commentLimiter, async (req, res) => {
  const { blog_id, userId, content, parent_id,ownderId } = req.body;

  try {
    const result = await sql`
      INSERT INTO comments (blog_id, user_id, content, parent_id)
      VALUES (${blog_id}, ${userId}, ${content}, ${parent_id || null})
      RETURNING *
    `;

    const newComment = result[0];

    const blogQuery = await sql`
      SELECT user_id FROM blogs WHERE blog_id = ${blog_id}
    `;
    if (blogQuery.length > 0) {
      const blogOwnerId = blogQuery[0].user_id;

      if (blogOwnerId) {
        // 1️⃣ Save to comment_notifications
        await sql`
          INSERT INTO notifications (user_id, type, blog_id, comment_id)
          VALUES (${blogOwnerId}, 'comment', ${blog_id}, ${newComment.comment_id})
        `;

        // 2️⃣ Emit to blog owner via socket
        const ownerSocket = UserSockets.get(blogOwnerId);

        await Redisclient.del(`notifications#${ownderId}`)
        await Redisclient.del(`comments#${blog_id}`);
        if (ownerSocket) {
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

module.exports = router;