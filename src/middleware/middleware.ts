import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";   

dotenv.config();
const appMiddleWare = express(); 

// Middleware
appMiddleWare.use(cors({ credentials: true, origin: "http://localhost:3000" }));  
appMiddleWare.use(express.json());
appMiddleWare.use(cookieParser());
 
 
export default appMiddleWare;