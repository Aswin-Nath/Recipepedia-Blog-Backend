const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");

const { AuthVerify } = require("../../Middleware/auth");

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

// GET /api/users/search?q=alice
router.get('/users/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.json({ users: [] });
    }
    try {
        // For PostgreSQL (ILIKE for case-insensitive search)
        const users = await sql`
            SELECT user_id AS id, user_name AS name, profile_url AS avatar
            FROM users
            WHERE user_name ILIKE ${query + '%'}
            LIMIT 10
        `;
        res.json({
            users
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ...existing code...
router.post("/update-user-details", AuthVerify, async (req, res) => {
  const { userId, user_name, user_mail, profile_url, removePhoto } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const fields = [];
    const values = [];
    let paramIndex = 1; // For $1, $2, etc.

    if (user_name !== undefined) {
      fields.push(`user_name = $${paramIndex++}`);
      values.push(user_name);
    }

    if (user_mail !== undefined) {
      fields.push(`user_mail = $${paramIndex++}`);
      values.push(user_mail);
    }

    if (removePhoto === true) {
      fields.push(`profile_url = NULL`);
    } else if (profile_url !== undefined) {
      fields.push(`profile_url = $${paramIndex++}`);
      values.push(profile_url);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Final param is always userId
    fields.push(`user_id = $${paramIndex}`);
    values.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${fields.slice(0, -1).join(', ')}
      WHERE ${fields.slice(-1)}
    `;

    await sql.query(updateQuery, values); // ✅ Use sql.query with values

    return res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});





module.exports = router;