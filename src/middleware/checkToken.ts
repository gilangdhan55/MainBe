import { Request, Response, NextFunction } from "express";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

// Interface untuk user di token
interface DecodedUser {
    id: string;
    username: string;
    role: string;
}

// Interface request dengan user
export interface CustomRequest extends Request {
    user?: DecodedUser;
}
 

if (!process.env.JWT_SECRET) {
    console.warn("⚠️ Warning: JWT_SECRET is not set! Using default secret.");
}

// Middleware verifikasi token
export const verifyToken = (req: CustomRequest, res: Response, next: NextFunction): void => { 
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
             res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        const SECRET_KEY = process.env.JWT_SECRET || "p@nduC3rt2025";

        if (!SECRET_KEY) {
            throw new Error("JWT_SECRET is not set. Please define it in your environment variables.");
        }

        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({ message: "Unauthorized - Token Expired" });
            return;
        }
        if (error instanceof JsonWebTokenError) {
            res.status(403).json({ message: "Forbidden - Invalid Token" });
            return;
        } 
        res.status(500).json({ message: "Internal Server Error" });
    }
};
