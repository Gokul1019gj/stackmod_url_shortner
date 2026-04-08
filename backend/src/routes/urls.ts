import { Router, Request, Response } from "express";
import { optionalAuth } from "../middleware/authenticate";
import { listUrls, deleteUrl } from "../services/urlService";

const router = Router();

router.use(optionalAuth);

// GET /api/urls?page=1&limit=10
router.get("/", (req: Request, res: Response): void => {
  const userId =
    req.user?.sub ??
    (typeof req.query.user_id === "string" ? req.query.user_id.trim() : undefined);

  if (!userId) {
    res.status(400).json({ error: "user_id is required (query param or Authorization header)" });
    return;
  }

  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = parseInt((req.query.limit as string) ?? "10", 10);

  res.status(200).json(listUrls(userId, page, limit));
});

// DELETE /api/urls/:short_code — soft delete (ownership check)
router.delete("/:short_code", (req: Request, res: Response): void => {
  const { short_code } = req.params;
  const bodyUserId =
    typeof req.body?.user_id === "string" && req.body.user_id.trim()
      ? (req.body.user_id as string).trim()
      : null;
  const userId = req.user?.sub ?? bodyUserId;

  if (!userId) {
    res.status(401).json({ error: "user_id is required (request body or Authorization header)" });
    return;
  }

  const result = deleteUrl(short_code, userId);

  if (result === "not_found") {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }
  if (result === "forbidden") {
    res.status(403).json({ error: "You do not have permission to delete this URL" });
    return;
  }
  if (result === "already_inactive") {
    res.status(400).json({ error: "Short URL is already deactivated" });
    return;
  }

  res.status(200).json({ message: `Short URL '${short_code}' has been deactivated` });
});

export default router;
