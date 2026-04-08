import { Router, Request, Response } from "express";
import { signup, login } from "../services/authService";

const router = Router();

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body ?? {};
  const result = await signup(name, email, password);

  if ("code" in result) {
    const status =
      result.code === "EMAIL_TAKEN" ? 409 :
      result.code === "CREATE_FAILED" ? 500 : 400;
    const messages: Record<string, string> = {
      INVALID_NAME: "name must be at least 2 characters",
      INVALID_EMAIL: "A valid email is required",
      INVALID_PASSWORD: "password must be at least 6 characters",
      EMAIL_TAKEN: "Email is already registered",
      CREATE_FAILED: "Could not create user",
    };
    res.status(status).json({ error: messages[result.code] });
    return;
  }

  res.status(201).json(result);
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body ?? {};
  const result = await login(email, password);

  if ("code" in result) {
    const status = result.code === "MISSING_FIELDS" ? 400 : 401;
    const messages: Record<string, string> = {
      MISSING_FIELDS: "email and password are required",
      INVALID_CREDENTIALS: "Invalid email or password",
    };
    res.status(status).json({ error: messages[result.code] });
    return;
  }

  res.status(200).json(result);
});

export default router;
