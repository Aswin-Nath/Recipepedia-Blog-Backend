const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");

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
  const { title, content, difficulty, ingredients, categories, status } = req.body;

  try {
    const blogCheck = await sql`
      SELECT * FROM blogs WHERE blog_id = ${blog_id}
    `;

    if (!blogCheck || blogCheck.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

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

  try {
    const result = await sql`
      DELETE FROM blogs WHERE blog_id = ${blog_id} RETURNING *
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

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