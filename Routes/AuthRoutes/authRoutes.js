const express = require("express");
const sql = require("../../Configs/db");

const jwt = require("jsonwebtoken");
require("dotenv").config();
const router = express.Router();
const jwt_key = process.env.SECRET_KEY;
const encrypy = require("bcryptjs");
const { authLimiter } = require("../../Middleware/rateLimiters");

router.post("/signup", authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await encrypy.hash(password, 10);
  try {
    const userResult = await sql`
      INSERT INTO users (user_name, user_mail) VALUES (${username}, ${email}) RETURNING user_id
    `;
    const user_id = userResult[0].user_id;

    await sql`
      INSERT INTO auth_details (user_id, password) VALUES (${user_id}, ${hashedPassword})
    `;
    const token = jwt.sign(
      { user_id: user_id },
      jwt_key,
      { expiresIn: "24h" }
    );

    return res.status(200).json({ message: "Inserted correctly", user_id: user_id, currentToken: token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/users/check", authLimiter, async (req, res) => {
  const { Username, Email } = req.query;
  try {
    const result = await sql`SELECT * FROM users`;
    let user_name = 0, user_mail = 0;
    result.forEach(user => {
      if (user.user_name === Username) user_name = 1;
      if (user.user_mail === Email) user_mail = 1;
    });
    return res.status(200).json({ mail: user_mail, name: user_name });
  } catch (err) {
    return res.status(400).json({ message: "Error ra sunni" });
  }
});

router.post("/login", async (req, res) => {
  const { detail, password } = req.body;
  try {
    const userQuery = await sql`
      SELECT * FROM users WHERE user_name = ${detail} OR user_mail = ${detail}
    `;
    if (userQuery.length === 1) {
      const user_id = userQuery[0].user_id;
      const type = userQuery[0].type;
      const passQuery = await sql`
        SELECT password FROM auth_details WHERE user_id = ${user_id}
      `;
      const db_hash = passQuery[0].password;
      const checker = await encrypy.compare(password, db_hash);
      if (checker) {
        const user_name=userQuery[0].user_name;
        const token = jwt.sign(
          { user_id: user_id, type: type,user_name:user_name },
          jwt_key,
          { expiresIn: "10h" }
        );
        return res.status(200).json({ message: "user found", id: user_id, currentToken: token });
      }
    }

    return res.status(200).json({ message: "user not found", id: null, currentToken: null });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;