const {app}=require("../App/AppInstance");
const http=require("http");
const {Server}=require("socket.io");
const server=http.createServer(app);
module.exports={server}