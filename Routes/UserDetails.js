const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");

const { AuthVerify } = require("../Middleware/auth");

router.get("/user-details", AuthVerify, async (req, res) => {
  try {
    const { userId } = req.query;
    const query = await sql`
      SELECT * FROM users WHERE user_id = ${userId}
    `;
    return res.status(200).json({ details: query, message: "success" });
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

router.post("/update-user-details", AuthVerify, async (req, res) => {
  const { userId, user_name, user_mail, profile_url, removePhoto } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    // Remove photo if requested and no new profile_url provided
    if (removePhoto === true && profile_url === undefined) {
      await sql`
        UPDATE users SET profile_url = NULL WHERE user_id = ${userId}
      `;
    }

    // Build dynamic update for other fields
    const updates = [];
    if (user_name !== undefined) updates.push(sql`user_name = ${user_name}`);
    if (user_mail !== undefined) updates.push(sql`user_mail = ${user_mail}`);
    if (profile_url !== undefined) updates.push(sql`profile_url = ${profile_url}`);

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await sql`
      UPDATE users
      SET ${sql.join(updates, sql`, `)}
      WHERE user_id = ${userId}
    `;

    return res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports =router;