const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");

router.get("/get/scheduled_blogs/", async (req, res) => {
  try {
    const { userId } = req.query;
    const blogs = await sql`
      SELECT * FROM blogs WHERE status='Hold' AND user_id=${userId}
    `;
    const blog_ids = blogs.map(b => b.blog_id);
    let scheduled = [];
    if (blog_ids.length > 0) {
      scheduled = await sql`
        SELECT * FROM scheduled_blogs WHERE blog_id = ANY(${blog_ids})
      `;
    }
    const scheduleMap = new Map();
    for (const s of scheduled) {
      scheduleMap.set(s.blog_id, { date: s.date, time: s.time });
    }

    const process = [];
    for (const b of blogs) {
      if (scheduleMap.has(b.blog_id)) {
        process.push({
          ...b,
          date: scheduleMap.get(b.blog_id).date,
          time: scheduleMap.get(b.blog_id).time
        });
      }
    }

    return res.status(200).json({ message: "success", schedule_blogs: process });
  }
  catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/get/scheduled_blog/", async (req, res) => {
  try {
    const { blog_id } = req.query;

    const blogs = await sql`
      SELECT * FROM blogs WHERE blog_id = ${blog_id}
    `;
    const blog = blogs[0];
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const schedules = await sql`
      SELECT * FROM scheduled_blogs WHERE blog_id = ${blog_id}
    `;
    const schedule = schedules[0];

    if (schedule) {
      blog.date = schedule.date;
      blog.time = schedule.time;
    }

    return res.status(200).json({ message: "success", scheduled_blog: blog });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/get/scheduled_time", async (req, res) => {
  try {
    const { blog_id } = req.query;
    const result = await sql`
      SELECT * FROM scheduled_blogs WHERE blog_id = ${blog_id}
    `;
    const schedule = result[0];
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    return res.status(200).json({ time: schedule.time, date: schedule.date });
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

router.post("/post/schedule_blog", async (req, res) => {
  const { blog_id, date, time } = req.body;

  if (!blog_id || !date || !time) {
    return res.status(400).json({ message: "blog_id, date, and time are required" });
  }

  try {
    const result = await sql`
      INSERT INTO scheduled_blogs (blog_id, date, time)
      VALUES (${blog_id}, ${date}, ${time})
      ON CONFLICT (blog_id)
      DO UPDATE SET date = EXCLUDED.date, time = EXCLUDED.time
      RETURNING schedule_id
    `;

    return res.status(201).json({
      message: "Blog scheduled successfully",
      schedule_id: result[0].schedule_id
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to schedule blog",
      error: error.message
    });
  }
});

module.exports = router;