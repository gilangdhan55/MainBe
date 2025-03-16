import express, { Request, Response, NextFunction } from "express"; 
import { checkAbsenSalesman } from "../../../controllers/VisitController";
const routeVisit = express.Router();


routeVisit.route("/checkAbsen")
.post(checkAbsenSalesman)

export default routeVisit;
