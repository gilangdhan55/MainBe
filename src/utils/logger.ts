import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { Request, Response, NextFunction } from "express";

// 🔹 Gunakan path absolut untuk log file
const logPath = path.join(__dirname, "../../logs/app-%DATE%.log");

const transport = new winston.transports.DailyRotateFile({
    filename: logPath,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "1m",
    maxFiles: "14d",
    level: "info", // 🔥 Ganti ke "info" biar request juga masuk
    handleExceptions: true,
});

// 🔹 Format Logger
const logFormat = winston.format.printf(({ timestamp, level, message, ip }) => {
    return `${ip || "127.0.0.1"} - [${timestamp}] ${level.toUpperCase()} - ${message}`;
});

const logger = winston.createLogger({
    level: "silly",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json(), // Simpan log dalam format JSON
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

// 🔹 Middleware Logging Request (Tambahkan IP)
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();  
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        logger.info({
            message: `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
            ip: req.ip
        });
    }); 
    next();
};

export default logger;
