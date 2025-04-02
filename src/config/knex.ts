import knex from "knex";
import dotenv from "dotenv";
import { attachOnDisconnectHandler } from "../utils/dbReconnect";

dotenv.config();

// **Factory function buat bikin koneksi baru**
const createMssqlDb = () => knex({
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
  pool: { 
    min: 2, 
    max: 10,  
    acquireTimeoutMillis: 30000, 
    idleTimeoutMillis: 30000,
  }
});

const createPgDb = () => knex({
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
  }
});

// **Inisialisasi koneksi pertama**
export const db = createMssqlDb();
export const dbVisit = createPgDb();

// **Tambahkan event listener buat auto-reconnect**
attachOnDisconnectHandler(db, createMssqlDb);
attachOnDisconnectHandler(dbVisit, createPgDb);
