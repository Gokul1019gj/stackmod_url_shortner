import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "./config";

const DB_PATH = path.isAbsolute(config.dbPath)
  ? config.dbPath
  : path.join(__dirname, "..", config.dbPath);

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}
