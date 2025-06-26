const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

router.get("/get/blogs/videos/:blog_id", async (req, res) => {
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

router.get("/get/blogs/images/:blog_id",async (req,res)=>{
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

router.get("/users/blogs",async (req,res)=>{
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

router.get("/get/blogs", async (req, res) => {
  const { search } = req.query;

  try {
    let query;
    let values;

    if (search && search.trim().length > 0) {
      query = "SELECT * FROM blogs WHERE status='Publish' AND LOWER(title) LIKE $1";
      values = [`%${search.toLowerCase()}%`];
    } else {
      query = "SELECT * FROM blogs WHERE status='Publish'";
      values = [];
    }

    const result = await pool.query(query, values);
    return res.status(200).json({ message: result.rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/blogs/:blog_id",async (req,res)=>{
  const {blog_id}=req.params;
  // console.log("ID",blog_id);
  try{
    const query=await pool.query(`select * from blogs where blog_id=$1`,[blog_id]);
    console.log("ROW",query.rows)
    return res.status(200).json({message:"Successfully retreived blog",blog:query.rows});
  }
  catch(error){
    console.log(error);
    return res.status(400).json({message:"Error occured while getting the blog"});
  }
})


module.exports=router;