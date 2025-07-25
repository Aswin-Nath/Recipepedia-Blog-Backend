const express = require("express");

const router = express.Router();

const sql = require("../../Configs/db");

// Can Cache
router.get("/users/drafts", async (req, res) => {
  const { userId } = req.query;
  try {
    const query = await sql`
      SELECT * FROM blogs WHERE status = 'Draft' AND user_id = ${userId}
    `;
    return res.status(200).json({ drafts: query });
  }
  catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports =router;