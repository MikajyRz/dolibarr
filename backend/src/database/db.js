import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const sqlite = sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database.sqlite");
const schemaPath = path.join(__dirname, "schema.sql");

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error("Erreur SQLite:", err.message);
    return;
  }

  console.log("SQLite connecté:", dbPath);

  const schema = fs.readFileSync(schemaPath, "utf8");

  db.exec(schema, (schemaErr) => {
    if (schemaErr) {
      console.error("Erreur création tables:", schemaErr.message);
    } else {
      console.log("Tables SQLite vérifiées.");
    }
  });
});

export default db;