const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");


const {postBlogLimiter}=require("../Middleware/rateLimiters");
const {AuthVerify}=require("../Middleware/auth");
router.post("/blogs/images",async (req,res) => {
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

router.post("/blogs/videos",async (req,res)=>{
  const {blog_id,video_url}=req.body;
  console.log({blog_id,video_url});
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

router.post("/blogs",postBlogLimiter,AuthVerify, async (req,res) => {
    const { title, content, user_id, difficulty, ingredients, categories,type } = req.body;
    console.log({ title, content, user_id, difficulty, ingredients, categories,type });
    try {
        const result = await pool.query(
            `INSERT INTO blogs (title, content, user_id, difficulty, ingredients, categories, createdat, likes,status) 
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 0,$7) 
             RETURNING blog_id`,
            [title, content, user_id, difficulty, ingredients, categories,type]
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

module.exports=router;