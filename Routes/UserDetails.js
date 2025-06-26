const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

const {AuthVerify}=require("../Middleware/auth");

router.get("/user-details",AuthVerify,async (req,res)=>{
    try{
        const {userId}=req.query;
        console.log(userId);
        const query=await pool.query("select * from users where user_id=$1",[userId]);
        return res.status(200).json({details:query.rows,message:"success"})
    }
    catch(error){
        console.log(error);
        return res.status(400).json({message:error.message});
    }
})

router.post("/update-user-details", AuthVerify, async (req, res) => {
  const { userId, user_name, user_mail, profile_url,removePhoto } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const fields = [];
    const values = [userId];

    if (user_name !== undefined) {
      fields.push(`user_name = $${values.length + 1}`);
      values.push(user_name);
    }
    if (user_mail !== undefined) {
      fields.push(`user_mail = $${values.length + 1}`);
      values.push(user_mail);
    }
    if(removePhoto===true && profile_url===undefined){
        await pool.query("update users set profile_url=null where user_id=$1",[userId]);
    }
    if (profile_url !== undefined) {
      fields.push(`profile_url = $${values.length + 1}`);
      values.push(profile_url);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE user_id = $1
    `;
    await pool.query(query, values);

    return res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
});


module.exports=router