import { Router, Request, Response } from "express";
import { getUrlStats } from "../services/urlService";

const router = Router();

router.get("/:short_code/stats", (req: Request, res: Response): void => {
  const { short_code } = req.params;
  const stats = getUrlStats(short_code);

  if (!stats) {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }

  res.status(200).json({
    short_code: stats.url.short_code,
    original_url: stats.url.original_url,
    user_id: stats.url.user_id,
    is_active: Boolean(stats.url.is_active),
    expires_at: stats.url.expires_at,
    created_at: stats.url.created_at,
    analytics: {
      total_clicks: stats.total_clicks,
      unique_visitors: stats.unique_visitors,
      clicks_by_country: stats.clicks_by_country,
    },
  });
});

export default router;
