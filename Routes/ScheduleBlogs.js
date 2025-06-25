const express=require("express");

const router=express.Router();


const pool=require("../Configs/db");

router.get("/get/scheduled_blogs/",async (req,res)=>{
  try{
    const {userId}=req.query;
    console.log(userId);
    const query1=await pool.query("select * from blogs where status='Hold' and user_id=$1",[userId]);
    const rows=query1.rows;
    const blog_ids=[];
    for(var i=0;i<rows.length;i++){
      blog_ids.push(rows[i].blog_id);
    }
    const query2=await pool.query("select * from scheduled_blogs where blog_id=ANY($1)",[blog_ids]);
    const rows2=query2.rows;
    const scheduleMap = new Map();
    for (const s of rows2) {
      scheduleMap.set(s.blog_id, { date: s.date, time: s.time });
    }

    const process = [];
    for (const b of rows) {
      if (scheduleMap.has(b.blog_id)) {
        process.push({
          ...b,
          date: scheduleMap.get(b.blog_id).date,
          time: scheduleMap.get(b.blog_id).time
        });
      }
    }

    return res.status(200).json({message:"success",schedule_blogs:process})
  }
  catch(error){
    res.status(400).json({message:error.message});
  }
})

router.get("/get/scheduled_blog/", async (req, res) => {
  try {
    const { blog_id } = req.query;
    console.log(blog_id);

    const query1 = await pool.query("SELECT * FROM blogs WHERE blog_id = $1", [blog_id]);
    const blog = query1.rows[0];
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const query2 = await pool.query("SELECT * FROM scheduled_blogs WHERE blog_id = $1", [blog_id]);
    const schedule = query2.rows[0];

    if (schedule) {
      blog.date = schedule.date;
      blog.time = schedule.time;
    }

    return res.status(200).json({ message: "success", scheduled_blog: blog });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/get/scheduled_time",async (req,res)=>{
  try{
    const {blog_id}=req.query;
    console.log({blog_id});
    const query=await pool.query("select * from scheduled_blogs where blog_id=$1",[blog_id]);
    console.log(query);
    const result=query.rows[0];
    const blog_date=result.date;
    const blog_time=result.time;
    console.log({blog_date,blog_time});
    return res.status(200).json({time:blog_time,date:blog_date});
  }
  catch(error){
    console.log(error);
    return res.status(400).json({message:error.message})
  }
})

router.post("/post/schedule_blog", async (req, res) => {
  const { blog_id, date, time } = req.body;
  console.log({ blog_id, date, time });

  if (!blog_id || !date || !time) {
    return res.status(400).json({ message: "blog_id, date, and time are required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO scheduled_blogs (blog_id, date, time)
      VALUES ($1, $2, $3)
      ON CONFLICT (blog_id)
      DO UPDATE SET date = EXCLUDED.date, time = EXCLUDED.time
      RETURNING schedule_id;
      `,
      [blog_id, date, time]
    );

    return res.status(201).json({
      message: "Blog scheduled successfully",
      schedule_id: result.rows[0].schedule_id
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to schedule blog",
      error: error.message
    });
  }
});


module.exports=router;