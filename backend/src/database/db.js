import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const sqlite = sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database.sqlite");

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error("Erreur SQLite:", err.message);
  } else {
    console.log("SQLite connecté:", dbPath);
  }
});

export default db;