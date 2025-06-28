const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

router.get("/bookmarks", async (req, res) => {
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

router.get("/bookmark-checker", async (req,res)=>{
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


router.post("/add/bookmark",async (req,res)=>{
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

module.exports=router