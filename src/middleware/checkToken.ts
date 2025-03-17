import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
    user?: any;
}

export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ message: "Unauthorized - No Token Provided" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded; // Simpan user di request
        next();
    } catch (error) {
        res.status(403).json({ message: "Forbidden - Invalid Token" });
    }
};
