import express, { Request, Response, NextFunction } from "express";
import appMiddleWare from "./middleware/middleware"; 
// import logger, { requestLogger } from "./utils/logger";
import routes from "./routes/index";

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 Tangani error yang bisa bikin server mati
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1); // Matikan server dengan kode error
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection:", reason);
    // Jangan exit, biar tetap bisa reconnect
});

// ✅ Middleware global
app.use(appMiddleWare);

// ✅ Tambahkan Middleware untuk menangani koneksi yang mati
app.use((req, res, next) => {
    res.setHeader("Connection", "keep-alive");
    next();
});

// ✅ Tambahkan Routes setelah middleware
app.use(routes);

// ✅ Tangani error secara global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`❌ Error: ${err.message}`);
    res.status(500).json({ message: err.message });
});

// 🚀 Jalankan server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
