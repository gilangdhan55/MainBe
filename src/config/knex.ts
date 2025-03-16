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
  pool: { min: 2, max: 10 }, // Atur pool connection
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
  pool: { min: 2, max: 10 },
});