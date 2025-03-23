import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// 🔹 Buat folder logs otomatis kalau belum ada
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// 🔹 Path log file
const logPath = path.join(logDir, "app-%DATE%.log");

// 🔹 Transport untuk menyimpan log harian
const transport = new winston.transports.DailyRotateFile({
    filename: logPath,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "5m", // 🔥 Ubah max size ke 5MB (1MB terlalu kecil)
    maxFiles: "14d",
    level: "info",
    handleExceptions: true,
});

// 🔹 Format log (Tanpa `json()`, pakai `printf()` biar rapi)
const logFormat = winston.format.printf(({ timestamp, level, message, ip }) => {
    return `${ip || "127.0.0.1"} - [${timestamp}] ${level.toUpperCase()} - ${message}`;
});

// 🔹 Konfigurasi Winston Logger
const logger = winston.createLogger({
    level: "silly",
    exitOnError: false, // 🔥 Jangan bunuh server kalau logger error
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            level: "silly",
            handleExceptions: true,
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
        }),
        transport, // 🔹 Simpan log ke file
    ],
});

// 🔹 Middleware Logging Request
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        logger.info(`${req.ip} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
};

export default logger;
