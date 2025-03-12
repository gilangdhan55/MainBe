import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Jangan lupa quote jika ada karakter spesial di .env
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER as string,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // Pastikan di SQL Server sesuai
    trustServerCertificate: true, // Untuk koneksi lokal
  },
};

let pool: sql.ConnectionPool | null = null;

export const connectDB = async (): Promise<sql.ConnectionPool> => {
  try {
    if (!pool) {
      pool = await new sql.ConnectionPool(dbConfig).connect();
      console.log("✅ Connected to SQL Server");
    }
    return pool;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};
