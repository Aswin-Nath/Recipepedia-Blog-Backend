const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const port = 5000;

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

app.get("/", (req, res) => {
  res.send("Hello this is the backend");
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
