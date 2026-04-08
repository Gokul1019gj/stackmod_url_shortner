import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/authenticate";
import {
  getTopUrlsService,
  getDailyTrendService,
  getBotSuspectsService,
  getGlobalClicksByCountryService,
} from "../services/urlService";

const router = Router();

// Helper: validate YYYY-MM-DD and convert to ISO datetime string for SQLite
function parseDate(val: unknown, endOfDay = false): string | undefined {
  if (typeof val !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(val))
    return undefined;
  return endOfDay ? `${val}T23:59:59` : `${val}T00:00:00`;
}

// GET /api/analytics/top-urls — requires auth, optional ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/top-urls", requireAuth, (req: Request, res: Response): void => {
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  const rows = getTopUrlsService(from, to);
  res.status(200).json(rows);
});

// GET /api/analytics/trend — requires auth, optional ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/trend", requireAuth, (req: Request, res: Response): void => {
  const userId = req.user!.sub;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  const rows = getDailyTrendService(userId, from, to);
  res.status(200).json(rows);
});

// GET /api/analytics/bot-report — requires auth
router.get("/bot-report", requireAuth, (_req: Request, res: Response): void => {
  const rows = getBotSuspectsService();
  res.status(200).json(rows);
});

// GET /api/analytics/countries — requires auth, optional ?from&to
router.get("/countries", requireAuth, (req: Request, res: Response): void => {
  const userId = req.user!.sub;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);
  const rows = getGlobalClicksByCountryService(userId, from, to);
  res.status(200).json(rows);
});

export default router;
