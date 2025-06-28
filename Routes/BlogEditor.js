const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

router.put("/edit/blogs/images/",async (req,res)=>{
  const {delete_image_id}=req.body;
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

router.put("/edit/blogs/videos",async (req,res)=>{
  const {blog_id}=req.body;
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

router.put("/blogs/:blog_id", async (req, res) => {
    const { blog_id } = req.params;
    const { title, content, difficulty, ingredients, categories,status } = req.body;
    
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
                 categories = $5,
                 status=$6
             WHERE blog_id = $7 
             RETURNING *`,
            [title, content, difficulty, ingredients, categories,status, blog_id]
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

router.delete("/blogs/:blog_id", async (req, res) => {
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

module.exports=router;

