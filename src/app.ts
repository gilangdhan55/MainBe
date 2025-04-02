import express, { Request, Response } from "express";
import appMiddleWare from "./middleware/middleware"; 
// import logger, { requestLogger } from "./utils/logger";
import routes from "./routes/index";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
const PORT = process.env.PORT || 5000;

// 🔥 Tangani error yang bisa bikin server mati
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1); // Matikan server dengan kode error
});

process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled Rejection:", reason);
    // Jangan exit, biar tetap bisa reconnect
});

// ✅ Middleware global
app.use(appMiddleWare);

// ✅ Tambahkan Middleware untuk menangani koneksi yang mati
app.use((_, res, next) => {
    res.setHeader("Connection", "keep-alive");
    next();
});

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
