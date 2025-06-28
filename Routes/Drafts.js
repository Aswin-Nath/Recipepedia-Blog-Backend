const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");


router.get("/users/drafts",async (req,res)=>{
  const {userId}=req.query;
  try{
    const query=await pool.query("select * from blogs where status='Draft' and user_id=$1",[userId]);
    return res.status(200).json({drafts:query.rows});
  }
  catch(error){
    console.log(error);
    return res.status(400).json({message:error.message})
  }
})

module.exports=router;