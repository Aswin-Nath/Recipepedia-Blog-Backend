
const dotenv = require("dotenv");
dotenv.config();

const {app}=require("./App/AppInstance");
require("./Sockets/CreateSocketByID");


// Route imports with camelCase
const authRouter = require("./Routes/authRoutes");
const followRouter = require("./Routes/Follows");
const scheduleRouter = require("./Routes/ScheduleBlogs");
const reportRouter = require("./Routes/Report");
const likeRouter = require("./Routes/Likes");
const bookmarkRouter = require("./Routes/Bookmarks");
const draftRouter = require("./Routes/Drafts");
const commentRouter = require("./Routes/Comments");
const blogAdderRouter = require("./Routes/BlogAdder");
const blogEditorRouter = require("./Routes/BlogEditor");
const blogGetterRouter = require("./Routes/BlogGetters");
const detailsRouter=require("./Routes/UserDetails");
const notificationsRouter=require("./Routes/Notifications");
const scheduleBlogRouter=require("./Cronjob/ScheduleBlogCron");
// Route usages with camelCase
app.use("/api", authRouter);  
app.use("/api", followRouter);
app.use("/api", scheduleRouter);
app.use("/api", blogAdderRouter);
app.use("/api", blogEditorRouter);
app.use("/api", blogGetterRouter);
app.use("/api", bookmarkRouter);
app.use("/api", draftRouter);
app.use("/api", commentRouter);
app.use("/api", likeRouter);
app.use("/api", reportRouter);
app.use("/api",detailsRouter);
app.use("/api",notificationsRouter);
app.use("/api",scheduleBlogRouter);
app.get("/", (req, res) => {
  res.send("Hello this is the backend");
});
const {server}=require("./Servers/CreateHTTPServer");
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
