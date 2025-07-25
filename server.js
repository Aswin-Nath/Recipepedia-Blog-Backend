
const dotenv = require("dotenv");
dotenv.config();

const {app}=require("./App/AppInstance");
require("./Sockets/CreateSocketByID");


// Route imports with camelCase
const authRouter = require("./Routes/AuthRoutes/authRoutes");
const followRouter = require("./Routes/ConnectionRoutes/Follows");
const scheduleRouter = require("./Routes/BlogRoutes/ScheduleBlogs");
const reportRouter = require("./Routes/ReportRoutes/Report");
const likeRouter = require("./Routes/LikeRoutes/Likes");
const bookmarkRouter = require("./Routes/BookmarkRoutes/Bookmarks");
const draftRouter = require("./Routes/DraftRoutes/Drafts");
const commentRouter=require("./Routes/CommentRoutes/Comments")
const blogAdderRouter = require("./Routes/BlogRoutes/BlogAdder");
const blogEditorRouter = require("./Routes/BlogRoutes/BlogEditor");
const blogGetterRouter = require("./Routes/BlogRoutes/BlogGetters");
const detailsRouter=require("./Routes/UserRoutes/UserDetails");
const notificationsRouter=require("./Routes/NotificationRoutes/Notifications");
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
