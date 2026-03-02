import "dotenv/config";
import mysql from "mysql2/promise";

console.log(process.env.DATABASE_URL)
export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  multipleStatements: true
});