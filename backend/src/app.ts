import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import shortenRouter from "./routes/shorten";
import redirectRouter from "./routes/redirect";
import statsRouter from "./routes/stats";
import urlsRouter from "./routes/urls";
import authRouter from "./routes/auth";
import analyticsRouter from "./routes/analytics";

const app = express();

// CORS — allow configured origins
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
);

// HTTP request logging (skip in test env to keep output clean)
if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use(express.json());

// API routes
app.use("/api/auth", authRouter); // POST /api/auth/signup, /api/auth/login
app.use("/api/shorten", shortenRouter);
app.use("/api/urls", statsRouter); // GET /api/urls/:short_code/stats
app.use("/api/urls", urlsRouter); // GET /api/urls, DELETE /api/urls/:short_code

app.use("/api/analytics", analyticsRouter);

// Redirect route — must come after /api routes to avoid conflicts
app.use("/", redirectRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
