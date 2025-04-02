import express  from "express"; 
import {verifyToken} from "../../../middleware/checkToken";
import { checkAbsenSalesman, startAbsent, endAbsent, checkAbsenVisit,
    getMasteItemOutlet
 } from "../../../controllers/VisitController";
import uploadImg from "../../../middleware/uploadFotoVisit"; 
const routeVisit = express.Router();


routeVisit.route("/checkAbsen")
.all(verifyToken)
.post(checkAbsenSalesman);

routeVisit.route("/start-absent")
.all(verifyToken)
.post(uploadImg.single("file"),startAbsent);

routeVisit.route("/end-absent")
.all(verifyToken)
.post(uploadImg.single("file"),endAbsent);


routeVisit.route("/check-absent-visit")
.all(verifyToken)
.post(checkAbsenVisit);

routeVisit.route("/visit-master-item-outlet")
.all(verifyToken)
.post(getMasteItemOutlet);

export default routeVisit;
