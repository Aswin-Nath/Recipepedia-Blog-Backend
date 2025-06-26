const jwt=require("jsonwebtoken");
require("dotenv").config();



const jwt_key = process.env.SECRET_KEY;

const AuthVerify=(req,res,next)=>{
  const token=req.headers.authorization?.split(" ")[1];
  console.log(token);
  if(!token){
    return res.status(401).json({message:"token is not available"});
  }
  console.log("TOKEN",token,jwt.verify(token,jwt_key));
  try{
    const verified=jwt.verify(token,jwt_key);
    console.log("VERIFY",verified);
    req.user=verified;
    next();
  }
  catch(error){
    return res.status(403).json({message:"Invalid Token"});
  }
}


module.exports={AuthVerify};