import express, { Request, Response } from "express";
import "tsconfig-paths/register";
import appMiddleWare from "./middleware/middleware"; 
// import logger, { requestLogger } from "./utils/logger";
import routes from "./routes/index";
import cors from "cors"; 
import path from "path";

const app = express();
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
const PORT = process.env.PORT || 5000;
 
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1);  
});

process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled Rejection:", reason); 
});
console.log("/uploads",path.join(__dirname, "../uploads")) 
app.use(appMiddleWare);
 
app.use((_, res, next) => {
    res.setHeader("Connection", "keep-alive");
    next();
});

app.use("/uploads",  express.static(path.join(__dirname, "../uploads")));

// ✅ Tambahkan Routes setelah middleware
app.use(routes);

// ✅ Tangani error secara global
app.use((err: Error, _: Request, res: Response) => {
    console.error(`❌ Error: ${err.message}`);
    res.status(500).json({ message: err.message });
});

// 🚀 Jalankan server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
