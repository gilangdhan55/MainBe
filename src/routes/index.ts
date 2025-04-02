import express, { Request, Response } from "express";  
import apiRouter from "./api/index";
import logger from "../utils/logger";
const routes = express.Router();
  
routes.get("/", (_, res) => {
    res.json({ message: "User API v1", version: "v1" });
});


routes.use("/api", apiRouter);

routes.use((req: Request, res: Response) => {
    logger.error(`${req.method} ${req.url} - Not Found`);
    res.status(404).json({ message: "Not Found" });
});

 
 
export default routes;
