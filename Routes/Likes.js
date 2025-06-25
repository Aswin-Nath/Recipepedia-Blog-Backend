const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

router.post("/add/blogs/likes/",async (req,res)=>{
  console.log("LLIKE DATA",req.body);
  const {userId,blog_id}=req.body;
  console.log("LLIKE DATA",req.body);
  try{
    await pool.query("insert into likes(user_id,blog_id,status) values($1,$2,1)",[userId,blog_id]);
    await pool.query("update blogs set likes=likes+1 where blog_id=$1",[blog_id]);
    return res.status(200).json({message:"Like added succesfully"});
  }
  catch(error){
    return res.status(400).json({message:"Error occured while liking",error:error.message})
  }
})


router.post("/get/blogs/likes/",async (req,res)=>{
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


router.put("/edit/blogs/likes",async (req,res)=>{
  const {userId,blog_id,newLikeStatus}=req.body;
  try{
    const query=await pool.query(`update likes set status=1-status where user_id=$1 and blog_id=$2 RETURNING status`,[userId,blog_id]);
    var val;
    if(newLikeStatus==0){
      val=-1
    }
    else{
      val=1;
    }
    await pool.query("update blogs set likes=likes+$1 where blog_id=$2",[val,blog_id]);
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

module.exports=router