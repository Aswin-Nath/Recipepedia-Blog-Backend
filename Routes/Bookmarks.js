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
  console.log("1st",req.query);
  const user_id=parseInt(req.query.user_id);
  const blog_id  = parseInt(req.query.blog_id);

  try {
    const query = await sql`
      SELECT * FROM bookmarks WHERE blog_id = ${blog_id} AND user_id = ${user_id}
    `;

    const ok = query.length > 0;

    return res.status(200).json({ message: ok });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});


router.post("/add/bookmark", async (req, res) => {
  const data = req.body;
  const user_id = parseInt(data.user_id);
  const blog_id = parseInt(data.blog_id);
  const condition = data.condition;
  console.log(user_id,blog_id);
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