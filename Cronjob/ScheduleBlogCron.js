const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");
const { UserSockets } = require("../Sockets/Sockets");

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

    const scheduledQuery = await sql`
      SELECT * FROM scheduled_blogs WHERE date = ${dateStr} AND time >= ${timeStart} AND time < ${timeEnd}
    `;

    const scheduled = scheduledQuery;

    if (!scheduled || scheduled.length === 0) {
      return res.json({ scheduled: [], message: "No blogs to schedule at this time." });
    }

    const blogIds = scheduled.map((row) => row.blog_id);

    const userIdQuery = await sql`
      SELECT blog_id, user_id FROM blogs WHERE blog_id = ANY(${blogIds})
    `;
    const blogOwnerRows = userIdQuery;

    for (const row of blogOwnerRows) {
      const { user_id: ownerId, blog_id } = row;

      // 1️⃣ Insert into blog_notifications
      await sql`
        INSERT INTO notifications (user_id, type, blog_id)
        VALUES (${ownerId}, 'blog', ${blog_id})
      `;

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

    await sql`
      UPDATE blogs SET status = 'Publish' WHERE blog_id = ANY(${blogIds})
    `;

    await sql`
      DELETE FROM scheduled_blogs WHERE blog_id = ANY(${blogIds})
    `;

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