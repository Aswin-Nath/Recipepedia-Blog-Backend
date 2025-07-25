const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");

const { postBlogLimiter } = require("../../Middleware/rateLimiters");
const { AuthVerify } = require("../../Middleware/auth");
const Redisclient = require("../../Redis/RedisClient");

router.post("/blogs/images", async (req, res) => {
    const { blog_id, image_url } = req.body;
    try {
        const result = await sql`
            INSERT INTO blog_images (blog_id, image_url)
            VALUES (${blog_id}, ${image_url})
            RETURNING image_id
        `;
        return res.status(201).json({
            message: "Image added successfully",
        });
    } catch (error) {
        return res.status(400).json({
            message: "Failed to add image",
            error: error.message
        });
    }
});

router.post("/blogs/videos", async (req, res) => {
    const { blog_id, video_url } = req.body;
    try {
        const result = await sql`
            INSERT INTO blog_videos (blog_id, video_url)
            VALUES (${blog_id}, ${video_url})
            RETURNING video_id
        `;
        return res.status(201).json({
            message: "video added successfully",
        });
    } catch (error) {
        return res.status(400).json({
            message: "Failed to add the video",
            error: error.message
        });
    }
});

router.post("/blogs", postBlogLimiter, AuthVerify, async (req, res) => {
    const { title, content, user_id, difficulty, ingredients, categories, type } = req.body;

    try {
        const result = await sql`
            INSERT INTO blogs (title, content, user_id, difficulty, ingredients, categories, createdat, likes, status)
            VALUES (${title}, ${content}, ${user_id}, ${difficulty}, ${ingredients}, ${categories}, CURRENT_TIMESTAMP, 0, ${type})
            RETURNING blog_id
        `;
        await Redisclient.del(`user_blogs#${user_id}`)
        return res.status(201).json({
            message: "Blog created successfully",
            blog_id: result[0].blog_id
        });
    } catch (error) {
        return res.status(400).json({
            message: "Failed to create blog",
            error: error.message
        });
    }
});

module.exports = router;