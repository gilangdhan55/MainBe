import express, { Request, Response, NextFunction } from "express"; 
import {verifyToken} from "../../../middleware/checkToken";
import { checkAbsenSalesman, startAbsent } from "../../../controllers/VisitController";
import uploadImg from "../../../middleware/uploadFotoVisit";
const routeVisit = express.Router();


routeVisit.route("/checkAbsen")
.all(verifyToken)
.post(checkAbsenSalesman);

routeVisit.route("/start-absent")
.all(verifyToken)
.post(uploadImg.single("file"),startAbsent);


export default routeVisit;
