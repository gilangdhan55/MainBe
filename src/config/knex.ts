import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

export const db = knex({
  client: "mssql",
  connection: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || "1433"),
    options: {
      encrypt: process.env.DB_ENCRYPT === "true",
      trustServerCertificate: true,
    },
  }, 
  pool: { min: 2, max: 10,  acquireTimeoutMillis: 30000, // Timeout saat mengambil koneksi (30 detik)
        idleTimeoutMillis: 30000, // Timeout saat koneksi idle}, // Atur pool connection
      }
});

export const dbVisit = knex({
  client: "pg",
  connection: {
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || "5432"),
  },
  pool: { 
    min: 2, 
    max: 10, 
    idleTimeoutMillis: 30000, // Putuskan koneksi idle setelah 30 detik
    createTimeoutMillis: 3000, // Timeout saat membuat koneksi
    acquireTimeoutMillis: 30000, // Timeout saat mengambil koneksi
    reapIntervalMillis: 1000, // Seberapa sering pool membersihkan koneksi yang tidak dipakai
  },
});
