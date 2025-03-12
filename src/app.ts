import express, { Request, Response, NextFunction } from "express";  
import appMiddleWare from "./middleware/middleware"; 
import logger, { requestLogger } from "./utils/logger";
import routes from "./routes/index";
import {connectDB} from "./config/db";

const app   = express();  
const PORT  = process.env.PORT || 5000;
 
// ❌ Middleware untuk simulasi error
// app.use(requestLogger); 
app.use(appMiddleWare);
  
// **Tambahkan Routes**
app.use(routes); 

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        message: `${req.method} ${req.path} - ${res.statusCode}`,
        ip: req.ip
    });  // Logging ke winston
    res.status(500).json({ message: err.message });
});

app.listen(PORT, () => {
    try {
        connectDB();
        console.log(`🚀 Server running at http://localhost:${PORT}`); 
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
});
