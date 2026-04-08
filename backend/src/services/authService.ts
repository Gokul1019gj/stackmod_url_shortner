import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { JWT_SECRET } from "../middleware/authenticate";
import {
  findUserByEmail,
  createUser,
  UserRow,
} from "../repositories/userRepository";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PublicUser {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export type SignupError =
  | { code: "INVALID_NAME" }
  | { code: "INVALID_EMAIL" }
  | { code: "INVALID_PASSWORD" }
  | { code: "EMAIL_TAKEN" }
  | { code: "CREATE_FAILED" };

export type LoginError =
  | { code: "MISSING_FIELDS" }
  | { code: "INVALID_CREDENTIALS" };

function toPublicUser(user: UserRow): PublicUser {
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}

function signToken(user: UserRow): string {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

export async function signup(
  name: unknown,
  email: unknown,
  password: unknown,
): Promise<AuthResult | SignupError> {
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { code: "INVALID_NAME" };
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return { code: "INVALID_EMAIL" };
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return { code: "INVALID_PASSWORD" };
  }

  const existing = findUserByEmail((email as string).toLowerCase());
  if (existing) return { code: "EMAIL_TAKEN" };

  const passwordHash = await bcrypt.hash(password as string, 10);
  const userId = `user_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

  let user: UserRow;
  try {
    user = createUser(userId, (name as string).trim(), (email as string).toLowerCase(), passwordHash);
  } catch {
    return { code: "CREATE_FAILED" };
  }

  return { token: signToken(user), user: toPublicUser(user) };
}

export async function login(
  email: unknown,
  password: unknown,
): Promise<AuthResult | LoginError> {
  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return { code: "MISSING_FIELDS" };
  }

  const user = findUserByEmail((email as string).toLowerCase());
  if (!user || !user.password_hash) return { code: "INVALID_CREDENTIALS" };

  const match = await bcrypt.compare(password as string, user.password_hash);
  if (!match) return { code: "INVALID_CREDENTIALS" };

  return { token: signToken(user), user: toPublicUser(user) };
}
