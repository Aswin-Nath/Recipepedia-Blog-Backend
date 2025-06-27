const express = require("express");

const router = express.Router();

const pool = require("../Configs/db");
const {UserSockets}=require("../Sockets/Sockets");

router.get("/scheduler/now", async (req, res) => {
  try {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);

    const dateStr = istNow.toISOString().split("T")[0];
    const hour = istNow.getHours().toString().padStart(2, "0");
    const minute = istNow.getMinutes().toString().padStart(2, "0");
    const nextMinute = ((istNow.getMinutes() + 1) % 60).toString().padStart(2, "0");

    const timeStart = `${hour}:${minute}:00`;
    const timeEnd = `${hour}:${nextMinute}:00`;

    console.log(`🕒 IST Time Range: ${dateStr} ${timeStart} to ${timeEnd}`);

    const scheduledQuery = await pool.query(
      "SELECT * FROM scheduled_blogs WHERE date = $1 AND time >= $2 AND time < $3",
      [dateStr, timeStart, timeEnd]
    );

    const scheduled = scheduledQuery.rows;

    if (!scheduled || scheduled.length === 0) {
      return res.json({ scheduled: [], message: "No blogs to schedule at this time." });
    }

    const blogIds = scheduled.map((row) => row.blog_id);
    console.log("📦 Scheduled Blog IDs to publish:", blogIds);

    const userIdQuery = await pool.query(
      "SELECT blog_id, user_id FROM blogs WHERE blog_id = ANY($1::int[])",
      [blogIds]
    );
    const blogOwnerRows = userIdQuery.rows;

    for (const row of blogOwnerRows) {
      const { user_id: ownerId, blog_id } = row;

      // 1️⃣ Insert into blog_notifications
      await pool.query(
        `INSERT INTO blog_notifications (blog_id)
         VALUES ($1)`,
        [blog_id]
      );

      // 2️⃣ Emit real-time socket if online
      const UserSocket = UserSockets.get(ownerId);
      if (UserSocket) {
        UserSocket.emit("notify", {
          type: "publish",
          message: `✅ Your scheduled blog (ID: ${blog_id}) has been published at ${istNow}`,
          blog_id,
        });
      } else {
        console.log(`⚠️ No active socket found for user ${ownerId}`);
      }
    }

    await pool.query(
      "UPDATE blogs SET status = 'Publish' WHERE blog_id = ANY($1::int[])",
      [blogIds]
    );

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