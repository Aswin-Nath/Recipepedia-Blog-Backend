const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt=require("jsonwebtoken");
const encrypy=require("bcryptjs");
const dotenv=require("dotenv");
dotenv.config();

const app = express();
const port = 5000;

const jwt_key = process.env.SECRET_KEY;

app.use(cors());
app.use(express.json());

const pool = new Pool({ 
  user: process.env.DB_USER, 
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Credentials Checkers

app.post("/api/signup", async   (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword=await encrypy.hash(password,10);
  try {
    const userResult = await pool.query(
      "INSERT INTO users (user_name, user_mail) VALUES ($1, $2) RETURNING user_id",
      [username, email]
    );

    const user_id = userResult.rows[0].user_id;

    const insert=await pool.query(
      "INSERT INTO auth_details (user_id, password) VALUES ($1, $2)",
      [user_id, hashedPassword]
    );
    const token=jwt.sign(
          {user_id:user_id},
          jwt_key,
          {expiresIn:"10h"}
        );
    
    return res.status(200).json({ message: "Inserted correctly",user_id:user_id,currentToken:token });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/users/check", async (req, res) => {
  const { Username,Email } = req.query;
  // console.log(Username,Email);
  try {
    const result = await pool.query("SELECT * FROM users");
    let user_name = 0, user_mail = 0;
    result.rows.forEach(user => {
      if (user.user_name === Username) user_name = 1;
      if (user.user_mail === Email) user_mail = 1;
    });
    // console.log(user_name,user_mail);
    return res.status(200).json({ mail: user_mail, name: user_name });
  } catch (err) {
    return res.status(400).json({ message: "Error ra sunni" });
  }
});

app.post("/api/login", async (req, res) => {
  const { detail, password } = req.body;
  try {
    const userQuery = await pool.query(
      "SELECT * FROM users WHERE user_name = $1 OR user_mail = $1",
      [detail]
    );
    if (userQuery.rows.length === 1) {
      const user_id = userQuery.rows[0].user_id;

      const passQuery = await pool.query(
        "SELECT password FROM auth_details WHERE user_id = $1",
        [user_id]
      );
      const db_hash=passQuery.rows[0].password;
      const checker=await encrypy.compare(password,db_hash);
      if (checker) {
        const token=jwt.sign(
          {user_id:user_id},
          jwt_key,
          {expiresIn:"10h"}
        );
        return res.status(200).json({ message: "user found",id:user_id,currentToken:token});
      }
    }
    
    return res.status(200).json({ message: "user not found",id:null,currentToken:null});
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});



// Blog Retrievers

app.get("/api/get/blogs/videos/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  console.log("VIDEO", blog_id);
  
  try {
    const query = await pool.query(
      `SELECT * FROM blog_videos WHERE blog_id = $1`, 
      [blog_id]
    );
    console.log("QUERY",query.rows)
    if (query.length === 0) {
      return res.status(404).json({
        message: `No videos found for blog_id ${blog_id}`
      });
    }

    return res.status(200).json({
      message: "success",
      video_url: query.rows.map(row => row.video_url)
    });

  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({
      message: "Error occurred while getting the video",
      error: error.message
    });
  }
});

app.get("/api/get/blogs/images/:blog_id",async (req,res)=>{
  const {blog_id}=req.params;
  // console.log(blog_id,"POST");

  try{
    const query=await pool.query(`select * from blog_images where blog_id=$1`,[blog_id]);
    console.log("IMAGES",query.rows);
    return res.status(200).json({
      message:"success",
      image_urls:query.rows
    })
  }
  catch(error){
    return res.status(400).json({
      message:"Error occurred while getting the images",
      error:error.message
    })
  }
})

app.get("/api/bookmarks", async (req, res) => {
  const { userId } = req.query;

  try {
    const result = await pool.query(
      `SELECT b.* 
       FROM bookmarks bm
       JOIN blogs b ON bm.blog_id = b.blog_id
       WHERE bm.user_id = $1`,
      [userId]
    );

    return res.status(200).json({ bookmarks: result.rows });
  } catch (error) {
    return res.status(400).json({ message: error.message, bookmarks: [] });
  }
});

app.get("/api/users/blogs",async (req,res)=>{
  const {userId}=req.query;
  // console.log(userId);
  try{
    const query=await pool.query("select * from blogs where user_id=$1",[userId]);
    const result=query.rows;
    return res.status(200).json({blogs:result});
  }
  catch(error){
    return res.status(400).json({message:error.message,blogs:[]})
  }
})

app.get("/api/get/blogs", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM blogs");
    return res.status(201).json({ message: result.rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/get/:blog_id/comment", async (req, res) => {
  try {
    const {blog_id}=req.params;
    const result = await pool.query("SELECT * FROM comments where blog_id=$1",[blog_id]);
    // console.log(result.rows);
    return res.status(201).json({ message: result.rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/api/blogs/:blog_id",async (req,res)=>{
  const {blog_id}=req.params;
  // console.log("ID",blog_id);
  try{
    const query=await pool.query(`select * from blogs where blog_id=$1`,[blog_id]);
    console.log("ROW",query.rows)
    return res.status(200).json({message:"Successfully retreived blog",blog:query.rows});
  }
  catch(error){
    return res.status(400).json({message:"Error occured while getting the blog"});
  }
})

app.get("/api/bookmark-checker", async (req,res)=>{
  const {user_id,blog_id}=req.query;
  try{
const query = await pool.query("SELECT * FROM bookmarks WHERE blog_id = $1 AND user_id = $2", [blog_id, user_id]);
  var ok=false;
  if(query.rows.length>0){
    ok=true;
  }
  return res.status(200).json({"message":ok});
  }
  catch(error){
    return res.status(400).json({"message":error.message});
  }
})

app.post("/api/get/blogs/likes/",async (req,res)=>{
  console.log("BODY da  ITHU",req.body);
   const {userId,blog_id}=req.body;
  try{
    const query=await pool.query(`select * from likes where user_id=$1 and blog_id=$2`,[userId,blog_id]);
    var status=0;
    console.log("query",query.rows);
    if(query?.rows?.length>0){
      status=query.rows[0].status;
    }
    if(query.rows.length==0){
      return res.status(200).json({status:-1});
    }
    console.log("STATUS",query.rows,status,query.rows[0],query.rows[0].status,query.length>0);
    return res.status(200).json({message:"Successfully got like status",status:status})
  }
  catch(error){
    return res.status(400).json({message:"Error occured while getting the like status",error:error.message});
  }
})




// Blog Adders

app.post("/api/blogs/images", async (req,res) => {
    const { blog_id, image_url } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO blog_images (blog_id, image_url) 
             VALUES ($1, $2) 
             RETURNING image_id`,
            [blog_id, image_url]
        );
        
        return res.status(201).json({
            message: "Image added successfully",
        });
    } catch (error) {
        return res.status(400).json({
            message: "Failed to add image",
            error: error.message
        });
    }
});

app.post("/api/blogs/videos",async (req,res)=>{
  const {blog_id,video_url}=req.body;
  try{
    const query=await pool.query(`
      insert into blog_videos(blog_id,video_url) values($1,$2) RETURNING video_id
      `,[blog_id,video_url])
    return res.status(201).json({
      message:"video added successfully",
    })
  }
  catch(error){
    return res.status(400).json({
      message:"Failed to add the video",
      error:error.message
    })
  }
})

app.post("/api/add/comment", async (req, res) => {
  const { blog_id, user_id, content, parent_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO comments (blog_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [blog_id, user_id, content, parent_id]
    );
    return res.status(201).json({ message: "Comment inserted", comment: result.rows[0]});
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/api/blogs", async (req,res) => {
    const { title, content, user_id, difficulty, ingredients, categories } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO blogs (title, content, user_id, difficulty, ingredients, categories, createdat, likes) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 0) 
             RETURNING blog_id`,
            [title, content, user_id, difficulty, ingredients, categories]
        );
        
        return res.status(201).json({ 
            message: "Blog created successfully",
            blog_id: result.rows[0].blog_id
        });
    } catch (error) {
        return res.status(400).json({ 
            message: "Failed to create blog",
            error: error.message 
        });
    }
});

app.post("/api/add/bookmark",async (req,res)=>{
  const data=req.body;
  const user_id=data.user_id;
  const blog_id=data.blog_id;
  const condition=data.condition;
  try{
  if(condition==true){
    await pool.query("insert into bookmarks(user_id,blog_id) values($1,$2)",[user_id,blog_id]);
  }
  else{
    await pool.query("delete from bookmarks where blog_id=$1 and user_id=$2",[blog_id,user_id]);
  }
  return res.status(200).json({"message":"success"});
  }
  catch(error){
    return res.status(400).json({"message":error.message});
  }
})

app.post("/api/add/blogs/likes/",async (req,res)=>{
  console.log("LLIKE DATA",req.body);
  const {userId,blog_id}=req.body;
  console.log("LLIKE DATA",req.body);
  try{
    await pool.query("insert into likes(user_id,blog_id,status) values($1,$2,1)",[userId,blog_id]);
    return res.status(200).json({message:"Like added succesfully"});
  }
  catch(error){
    return res.status(400).json({message:"Error occured while liking",error:error.message})
  }
})



// Blog Editters

app.put("/api/edit/blogs/images/",async (req,res)=>{
  const {delete_image_id}=req.body;
  console.log(delete_image_id);
  try{
    for(let i=0;i<delete_image_id.length;i++){
      try{
        await pool.query(`delete from blog_images where image_id=$1`,[delete_image_id[i]]);
      }
      catch(error){
       return res.status(400).json({
        message:"Failed Updating Image",
        error:error.message
      })
      }
    }
    return res.status(201).json({
      message:"Updated Image successfully",
    })
  }
  catch(error){
    return res.status(400).json({
      message:"Failed Updating Image",
      error:error.message
    })
  }
})

app.put("/api/edit/blogs/videos",async (req,res)=>{
  const {blog_id}=req.body;
  console.log(blog_id);
  try{
    await pool.query(`delete from blog_videos where blog_id=$1`,[blog_id]);
    return res.status(201).json({
      message:"Updated Video successfully",
    })
  }
  catch(error){
    return res.status(400).json({
      message:"Failed Updating Video",
      error:error.message
    })
  }
})

app.put("/api/blogs/:blog_id", async (req, res) => {
    const { blog_id } = req.params;
    const { title, content, difficulty, ingredients, categories } = req.body;
    
    try {
        await pool.query('BEGIN');

        const blogCheck = await pool.query(
            'SELECT * FROM blogs WHERE blog_id = $1',
            [blog_id]
        );

        if (blogCheck.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: "Blog not found" });
        }

        const result = await pool.query(
            `UPDATE blogs 
             SET title = $1, 
                 content = $2, 
                 difficulty = $3, 
                 ingredients = $4, 
                 categories = $5
             WHERE blog_id = $6 
             RETURNING *`,
            [title, content, difficulty, ingredients, categories, blog_id]
        );

        await pool.query('COMMIT');
        
        return res.status(200).json({
            message: "Blog updated successfully",
            blog: result.rows[0]
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error updating blog:", error);
        return res.status(500).json({
            message: "Failed to update blog",
            error: error.message
        });
    }
});

app.delete("/api/blogs/:blog_id", async (req, res) => {
  const { blog_id } = req.params;
  
  try {
    await pool.query('BEGIN');

    const result = await pool.query('DELETE FROM blogs WHERE blog_id = $1 RETURNING *', [blog_id]);
    
    if (result.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Blog not found" });
    }

    await pool.query('COMMIT');
    
    res.json({ 
      message: "Blog and all related content deleted successfully",
      deletedBlog: result.rows[0]
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

app.put("/api/edit/blogs/likes",async (req,res)=>{
  const {userId,blog_id}=req.body;
  try{
    const query=await pool.query(`update likes set status=1-status where user_id=$1 and blog_id=$2 RETURNING status`,[userId,blog_id]);
    return res.status(200).json({
      message:"Successfully updated the like",
      status:query.rows[0].status
    })
  }
  catch(error){
    return res.status(400).json({
      message:"Error occured while updating like",
      error:error.message
    })
  }
})









app.get("/", (req, res) => {
  res.send("Hello this is the backend");
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
