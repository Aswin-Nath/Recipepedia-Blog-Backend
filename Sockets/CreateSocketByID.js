const {UserSockets}=require("./Sockets");
const jwt=require("jsonwebtoken");
const {io}=require("./CreateIO");

io.use((socket,next)=>{
    const token=socket.handshake.auth.token;
    if(!token){
        return next(new Error("no token"));
    }
    try{
        const user_details=jwt.verify(token,process.env.SECRET_KEY);
        socket.user=user_details;
        next();
    }
    catch(error){
        console.log(error);
        return next(new Error("Invalid token"));
    }
})


io.on("connection",(socket)=>{
    const userId=socket.user.user_id;
    UserSockets.set(userId,socket);

    console.log(`successfully backend socket connected for used ${userId}`)

    io.on("disconnect",()=>{
        UserSockets.delete(userId);
        console.log(`user ${userId} disconnected `);
    })
})
module.exports={io};