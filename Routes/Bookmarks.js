const express = require("express");

const router = express.Router();

const sql = require("../Configs/db");

router.get("/bookmarks", async (req, res) => {
  const { userId } = req.query;

  try {
    const result = await sql`
      SELECT b.* 
      FROM bookmarks bm
      JOIN blogs b ON bm.blog_id = b.blog_id
      WHERE bm.user_id = ${userId}
    `;

    return res.status(200).json({ bookmarks: result });
  } catch (error) {
    return res.status(400).json({ message: error.message, bookmarks: [] });
  }
});

router.get("/bookmark-checker", async (req, res) => {
  const { user_id, blog_id } = req.query;
  try {
    const query = await sql`
      SELECT * FROM bookmarks WHERE blog_id = ${blog_id} AND user_id = ${user_id}
    `;
    var ok = false;
    if (query.length > 0) {
      ok = true;
    }
    return res.status(200).json({ "message": ok });
  }
  catch (error) {
    return res.status(400).json({ "message": error.message });
  }
});

router.post("/add/bookmark", async (req, res) => {
  const data = req.body;
  const user_id = data.user_id;
  const blog_id = data.blog_id;
  const condition = data.condition;
  try {
    if (condition == true) {
      await sql`
        INSERT INTO bookmarks(user_id, blog_id) VALUES (${user_id}, ${blog_id})
      `;
    }
    else {
      await sql`
        DELETE FROM bookmarks WHERE blog_id = ${blog_id} AND user_id = ${user_id}
      `;
    }
    return res.status(200).json({ "message": "success" });
  }
  catch (error) {
    return res.status(400).json({ "message": error.message });
  }
});

module.exports=router;