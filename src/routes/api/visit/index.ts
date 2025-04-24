import express  from "express"; 
import {verifyToken} from "../../../middleware/checkToken";
import VisitController from "../../../controllers/VisitController";
import uploadImg from "../../../middleware/uploadFotoVisit"; 
import { Request, Response } from "express";
const routeVisit            = express.Router();
const visitControllers      = VisitController.getInstance();

routeVisit.route("/checkAbsen")
.all(verifyToken)
.post((req: Request, res: Response) => visitControllers.checkAbsenSalesman(req, res));

routeVisit.route("/start-absent")
.all(verifyToken)
.post(uploadImg.single("file"),(req: Request, res: Response) => visitControllers.startAbsent(req, res));

routeVisit.route("/end-absent")
.all(verifyToken)
.post(uploadImg.single("file"),(req: Request, res: Response) => visitControllers.endAbsent(req, res));


routeVisit.route("/check-absent-visit")
.all(verifyToken)
.post((req: Request, res: Response) => visitControllers.checkAbsenVisit(req, res));

routeVisit.route("/visit-master-item-outlet")
.all(verifyToken)
.post((req: Request, res: Response) => visitControllers.getMasterItemOutlet(req, res));

routeVisit.route("/start-visit")
.all(verifyToken)
.post(uploadImg.single("file"),(req: Request, res: Response) => visitControllers.startVisit(req, res));

routeVisit.route("/end-visit")
.all(verifyToken)
.post(uploadImg.single("file"),(req: Request, res: Response) => visitControllers.endVisit(req, res));

routeVisit.route("/get-pict-visit")
.all(verifyToken)
.post((req: Request, res: Response) => visitControllers.getPictVisit(req, res));


routeVisit.route("/save-stock-visit")
.all(verifyToken) 
.post((req: Request, res: Response) => visitControllers.saveStocKVisit(req, res));

routeVisit.route("/get-history-stock-visit")
.all(verifyToken)
.post((req: Request, res: Response) => visitControllers.getHistoryStockVisit(req, res));
export default routeVisit;
