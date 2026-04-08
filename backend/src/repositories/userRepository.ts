import { getDb } from "../db";

export interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  password_hash: string | null;
  created_at: string;
}

export function findUserById(id: string): UserRow | undefined {
  return getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
    | UserRow
    | undefined;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return getDb().prepare(`SELECT * FROM users WHERE email = ?`).get(email) as
    | UserRow
    | undefined;
}

export function createUser(
  id: string,
  name: string,
  email: string,
  passwordHash: string,
): UserRow {
  const db = getDb();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`,
  ).run(id, name, email, passwordHash);
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow;
}

/** Creates a lightweight user record if one does not already exist (anonymous/legacy callers). */
export function ensureUser(userId: string): void {
  getDb().prepare(`INSERT OR IGNORE INTO users (id) VALUES (?)`).run(userId);
}
