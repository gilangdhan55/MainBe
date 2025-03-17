import express, { Request, Response, NextFunction } from "express"; 
import {verifyToken} from "../../../middleware/checkToken";
import { checkAbsenSalesman } from "../../../controllers/VisitController";
const routeVisit = express.Router();


routeVisit.route("/checkAbsen")
.all(verifyToken)
.post(checkAbsenSalesman)

export default routeVisit;
