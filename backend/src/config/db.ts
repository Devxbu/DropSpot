import pkg from "pg";
import { env } from "./env";

const { Pool } = pkg;
const pool = new Pool({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
});

pool.on("connect", () => {
    console.log("Connected to PostgreSQL database");
});

export default pool;