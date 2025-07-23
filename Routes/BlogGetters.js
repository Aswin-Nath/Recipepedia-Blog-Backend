const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");

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
  try {
    const query = await sql`
      SELECT * FROM blogs WHERE user_id = ${userId}
    `;
    return res.status(200).json({ blogs: query });
  } catch (error) {
    console.log(error);
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
  try {
    const query = await sql`
      SELECT * FROM blogs WHERE blog_id = ${blog_id}
    `;
    return res.status(200).json({ message: "Successfully retreived blog", blog: query });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Error occured while getting the blog" });
  }
});

module.exports = router;