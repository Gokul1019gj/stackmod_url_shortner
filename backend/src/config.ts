import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "8081", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  dbPath: process.env.DB_PATH ?? "data.db",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim()),
};
