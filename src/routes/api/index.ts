import express, { Request, Response, NextFunction } from "express";
import { login, updateAllpassword } from "../../controllers/AuthController";
const apiRouter = express.Router();

apiRouter.get("/", (req: Request, res: Response) => {
    res.json({ message: "User API v1", version: "v1" });
});

apiRouter.route("/login")
.post(login)

apiRouter.route("/updateAllpassword")
.post(updateAllpassword)

export default apiRouter;
