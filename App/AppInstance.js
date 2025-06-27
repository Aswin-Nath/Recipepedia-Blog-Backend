const express=require("express");
const app=express();
const helmet=require("helmet");
const cors=require("cors");
app.use(cors());
app.use(express.json());
app.use(helmet());
module.exports={app};