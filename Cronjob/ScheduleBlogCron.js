const express = require("express");

const router = express.Router();

const pool = require("../Configs/db");

// Get scheduled blogs to publish now (IST time window)
router.get("/scheduler/now", async (req, res) => {
  try {
    // Convert current UTC time to IST (UTC+5:30)
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);

    const dateStr = istNow.toISOString().split("T")[0]; // YYYY-MM-DD
    const hour = istNow.getHours().toString().padStart(2, "0");
    const minute = istNow.getMinutes().toString().padStart(2, "0");
    const nextMinute = ((istNow.getMinutes() + 1) % 60).toString().padStart(2, "0");

    const timeStart = `${hour}:${minute}:00`;
    const timeEnd = `${hour}:${nextMinute}:00`;

    console.log(`🕒 IST Time Range: ${dateStr} ${timeStart} to ${timeEnd}`);

    // Step 1: Fetch scheduled blogs in the current IST time window
    const scheduledQuery = await pool.query(
      "SELECT * FROM scheduled_blogs WHERE date = $1 AND time >= $2 AND time < $3",
      [dateStr, timeStart, timeEnd]
    );
    const scheduled = scheduledQuery.rows;

    if (!scheduled || scheduled.length === 0) {
      return res.json({ scheduled: [], message: "No blogs to schedule at this time." });
    }

    // Step 2: Extract blog_ids
    const blogIds = scheduled.map((row) => row.blog_id);
    console.log("📦 Scheduled Blog IDs to publish:", blogIds);

    // Step 3: Update status to 'Publish' in blogs table
    await pool.query(
      "UPDATE blogs SET status = 'Publish' WHERE blog_id = ANY($1::int[])",
      [blogIds]
    );

    // Step 4: Delete corresponding entries from scheduled_blogs
    await pool.query(
      "DELETE FROM scheduled_blogs WHERE blog_id = ANY($1::int[])",
      [blogIds]
    );

    res.json({
      message: `✅ ${blogIds.length} blog(s) published and schedule(s) cleared.`,
      scheduled: blogIds,
    });
  } catch (err) {
    console.error("❌ Error in scheduler:", err);
    res.status(500).json({
      error: "Failed to process scheduled blogs",
      details: err.message,
    });
  }
});

module.exports = router;