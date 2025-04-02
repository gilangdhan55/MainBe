import express, { Request, Response } from "express";
import { login, updateAllpassword } from "../../controllers/AuthController";
import routeVisit from "./visit/index";
const apiRouter = express.Router();

apiRouter.get("/", (_: Request, res: Response) => {
    res.json({ message: "User API v1", version: "v1" });
});

apiRouter.route("/login")
.post(login)

apiRouter.use("/visit", routeVisit)

apiRouter.route("/updateAllpassword")
.post(updateAllpassword)

export default apiRouter;
