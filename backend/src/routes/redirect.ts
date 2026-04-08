import { Router, Request, Response } from "express";
import { resolveAndTrack } from "../services/urlService";

const router = Router();

router.get("/:short_code", (req: Request, res: Response): void => {
  const { short_code } = req.params;
  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  const userAgent = req.headers["user-agent"] ?? null;
  const country = (req.headers["cf-ipcountry"] as string | undefined) ?? null;

  const result = resolveAndTrack(short_code, ip, country, userAgent);

  if (result.status === "not_found") {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }
  if (result.status === "expired") {
    res.status(410).json({ error: "This short URL has expired" });
    return;
  }

  res.redirect(302, result.original_url);
});

export default router;
