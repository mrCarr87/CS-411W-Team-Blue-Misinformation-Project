import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "../db/schema.sql");

async function run() {
  try {
    const sql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(sql);
    console.log("Schema executed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Schema failed:", err);
    process.exit(1);
  }
}

run();