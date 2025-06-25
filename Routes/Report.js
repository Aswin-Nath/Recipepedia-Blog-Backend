const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

  router.post("/post/report-posts",async (req,res)=>{
    try{
      const {user_id,blog_id,reportReason}=req.body;
      await pool.query("insert into Report(type,post_id,reporter_id,report_reason) values ($1,$2,$3,$4)",[1,blog_id,user_id,reportReason]);
      return res.status(200).json({message:"Success"})
    }
    catch(error){
      console.log(error);
      return res.status(400).json({message:error.message}); 
    }
  })

  router.post("/post/report-comments",async (req,res)=>{
    try{
      const {user_id,blog_id,comment_id,reportReason}=req.body;
      console.log({user_id,blog_id,comment_id,reportReason});
      await pool.query("insert into Report(type,comment_id,post_id,reporter_id,report_reason) values ($1,$2,$3,$4,$5)",[1,comment_id,blog_id,user_id,reportReason]);
      return res.status(200).json({message:"sucesss"});
    }
    catch(error){
      console.log(error);
      return res.status(400).json({message:error.message}); 
    }
  })

router.delete(" /delete/comments/:comment_id",async (req,res)=>{
  try{
  const {comment_id}=req.params;
  console.log({comment_id});
  await pool.query("delete from comments where comment_id=$1",[comment_id]);
  return res.status(200).json({message:"success"});
}
catch(error){
  console.log(error);
  return res.status(400).json({message:error.message})
}
}
)


module.exports=router;