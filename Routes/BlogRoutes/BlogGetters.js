const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");
const Redisclient=require("../../Redis/RedisClient")
// Cached

router.get("/get/blogs/videos/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  try {
    const query = await sql`
      SELECT * FROM blog_videos WHERE blog_id = ${blog_id}
    `;
    if (query.length === 0) {
      return res.status(200).json({
        message: `No videos found for blog_id ${blog_id}`
      });
    }
    return res.status(200).json({
      message: "success",
      video_url: query.map(row => row.video_url)
    });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({
      message: "Error occurred while getting the video",
      error: error.message
    });
  }
});

router.get("/get/blogs/images/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  try {
    const query = await sql`
      SELECT * FROM blog_images WHERE blog_id = ${blog_id}
    `;
    return res.status(200).json({
      message: "success",
      image_urls: query
    });
  } catch (error) {
    return res.status(400).json({
      message: "Error occurred while getting the images",
      error: error.message
    });
  }
});

router.get("/users/blogs", async (req, res) => {
  const userId = parseInt(req.query.userId);
  const Key = `user_blogs#${userId}`;

  try {
    const cachedData = await Redisclient.get(Key);

    if (cachedData !== null) {
      console.log("Got cached");
      return res.status(200).json({ blogs: JSON.parse(cachedData) });
    }
    console.log("No");
    const query = await sql`
      SELECT * FROM blogs WHERE user_id = ${userId}
    `;
    await Redisclient.set(Key, JSON.stringify(query));
    return res.status(200).json({ blogs: query });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message, blogs: [] });
  }
});

router.get("/get/blogs", async (req, res) => {
  const { search } = req.query;
  try {
    let result;
    if (search && search.trim().length > 0) {
      result = await sql`
        SELECT * FROM blogs WHERE status = 'Publish' AND LOWER(title) LIKE ${'%' + search.toLowerCase() + '%'}
      `;
    } else {
      result = await sql`
        SELECT * FROM blogs WHERE status = 'Publish'
      `;
    }
    return res.status(200).json({ message: result });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/blogs/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  const key = `blog#${blog_id}`;

  try {
    const cached = await Redisclient.get(key);

    let blog;
    if (cached !== null) {
      blog = JSON.parse(cached);
      console.log("cached");
    } else {
      const query = await sql`
        SELECT * FROM blogs WHERE blog_id = ${blog_id}
      `;
      if (!query.length) {
        return res.status(404).json({ message: "Blog not found" });
      }
      blog = query[0];
      await Redisclient.set(key, JSON.stringify(blog));
    }

    // Fetch mentions for this blog
    const mentions = await sql`
      SELECT u.user_id AS id, u.user_name AS name, u.profile_url AS avatar
      FROM mentions m
      JOIN users u ON m.being_mentioned_id = u.user_id
      WHERE m.blog_id = ${blog_id}
    `;

    return res.status(200).json({
      message: cached !== null ? "Retrieved from cache" : "Retrieved from DB",
    blog,
      mentions
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error occurred while retrieving the blog" });
  }
});

module.exports=router;