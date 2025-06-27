const {Server}=require("socket.io");
const {server}=require("../Servers/CreateHTTPServer");


const io = new Server(server, {
  cors: {
    origin: "*", // Or your frontend URL
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

module.exports={io};