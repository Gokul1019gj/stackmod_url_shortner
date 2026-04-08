import { Router, Request, Response } from "express";
import {
  SlidingWindowRateLimiter,
  rateLimitMiddleware,
} from "../middleware/rateLimiter";
import { optionalAuth } from "../middleware/authenticate";
import { shortenUrl } from "../services/urlService";

const router = Router();

const limiter = new SlidingWindowRateLimiter({ max_requests: 10, window_seconds: 60 });
router.use(rateLimitMiddleware(limiter));
router.use(optionalAuth);

router.post("/", (req: Request, res: Response): void => {
  const { original_url, custom_alias, expires_at } = req.body ?? {};
  const bodyUserId =
    typeof req.body?.user_id === "string" && req.body.user_id.trim()
      ? (req.body.user_id as string).trim()
      : null;
  const userId: string | null = req.user?.sub ?? bodyUserId;

  const result = shortenUrl({ original_url, custom_alias, expires_at, userId });

  if ("code" in result) {
    const status = result.code === "ALIAS_TAKEN" ? 409 : 400;
    const messages: Record<string, string> = {
      MISSING_URL: "original_url is required",
      INVALID_URL: "original_url must be a valid URL including protocol (http/https)",
      INVALID_ALIAS: "custom_alias must be 4–20 alphanumeric characters or hyphens",
      ALIAS_TAKEN: `Alias '${(result as { code: string; alias?: string }).alias}' is already taken`,
      INVALID_EXPIRES: "expires_at must be a valid date",
      EXPIRES_IN_PAST: "expires_at must be a future date",
    };
    res.status(status).json({ error: messages[result.code] });
    return;
  }

  res.status(201).json({
    ...result,
    short_url: `${req.protocol}://${req.get("host")}/${result.short_code}`,
    saved_to_history: userId !== null,
  });
});

export default router;
