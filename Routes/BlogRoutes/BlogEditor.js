const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");
const Redisclient = require("../../Redis/RedisClient");

router.put("/edit/blogs/images/", async (req, res) => {
  const { delete_image_id } = req.body;
  try {
    for (let i = 0; i < delete_image_id.length; i++) {
      try {
        await sql`
          DELETE FROM blog_images WHERE image_id = ${delete_image_id[i]}
        `;
      } catch (error) {
        return res.status(400).json({
          message: "Failed Updating Image",
          error: error.message
        });
      }
    }
    return res.status(201).json({
      message: "Updated Image successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed Updating Image",
      error: error.message
    });
  }
});

router.put("/edit/blogs/videos", async (req, res) => {
  const { blog_id } = req.body;
  try {
    await sql`
      DELETE FROM blog_videos WHERE blog_id = ${blog_id}
    `;
    return res.status(201).json({
      message: "Updated Video successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed Updating Video",
      error: error.message
    });
  }
});

router.put("/blogs/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  const {
    title,
    content,
    difficulty,
    ingredients,
    categories,
    status,
    userId,
    mentions = []
  } = req.body;

  try {
    const blogCheck = await sql`SELECT * FROM blogs WHERE blog_id = ${blog_id}`;
    if (!blogCheck?.length) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Invalidate cache
    const keyUserBlogs = `user_blogs#${userId}`;
    const keyBlog = `blog#${blog_id}`;
    await Redisclient.del(keyUserBlogs);
    await Redisclient.del(keyBlog);

    // Update blog content
    const result = await sql`
      UPDATE blogs
      SET title = ${title},
          content = ${content},
          difficulty = ${difficulty},
          ingredients = ${ingredients},
          categories = ${categories},
          status = ${status}
      WHERE blog_id = ${blog_id}
      RETURNING *
    `;

    // === Mentions Sync ===
    // Get current mentions in DB
    const existing = await sql`
      SELECT mention_id, mentioned_by, being_mentioned_id
      FROM mentions
      WHERE blog_id = ${blog_id}
    `;

    // Create a Set of stringified current mentions in DB
    const existingSet = new Set(
      existing.map(m => `${m.mentioned_by}-${m.being_mentioned_id}`)
    );

    // Create a Set of incoming mentions from client
    const incomingSet = new Set(
      mentions.map(m => `${m.mentioned_by}-${m.being_mentioned_id}`)
    );

    // Determine mentions to insert (in request but not in DB)
    const toInsert = mentions.filter(m =>
      !existingSet.has(`${m.mentioned_by}-${m.being_mentioned_id}`)
    );

    // Determine mentions to delete (in DB but not in request)
    const toDelete = existing.filter(m =>
      !incomingSet.has(`${m.mentioned_by}-${m.being_mentioned_id}`)
    );
    console.log("DELINSERT",toInsert,toDelete);
    // Delete removed mentions
    for (const m of toDelete) {
      await sql`
        DELETE FROM mentions
        WHERE mention_id = ${m.mention_id}
      `;
    }

    // Insert new mentions
    for (const m of toInsert) {
      await sql`
        INSERT INTO mentions (mentioned_by, being_mentioned_id, type, blog_id)
        VALUES (${userId}, ${m.id}, 'blogs', ${blog_id})
      `;
    }

    // === Done ===

    return res.status(200).json({
      message: "Blog updated successfully",
      blog: result[0]
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({
      message: "Failed to update blog",
      error: error.message
    });
  }
});

router.delete("/blogs/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  const userId=req.body.userId;
  try {
    const result = await sql`
      DELETE FROM blogs WHERE blog_id = ${blog_id} RETURNING *
    `;


    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }
    const Key1=`user_blogs#${userId}`
    const key2=`blog#${blog_id}`
    await Redisclient.del(key2);
    await Redisclient.del(Key1);
    console.log("deleted",Key1,key2);
    res.json({
      message: "Blog and all related content deleted successfully",
      deletedBlog: result[0]
    });

  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

module.exports = router;