import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import logger from "./utils/logger";
import process from "process";
import populate_with_mock_data from "./mockdata";
import path from "path";
import fs from "fs";
import { login } from "./routes/login";
import { signup } from "./routes/signup";
import { logout } from "./routes/logout";
import { resetPassword } from "./routes/resetPassword";
import { forgotPassword } from "./routes/forgotPassword";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import listContactFormSubmissions from "./routes/listContactFormSubmissions";
import createContactFormSubmission from "./routes/createContactFormSubmission";
import getContactFormSubmission from "./routes/getContactFormSubmission";
import getGitHubProfile from "./routes/getGitHubProfile";
import searchRecipes from "./routes/searchRecipes";
import getCurrentAuthUser from "./routes/getCurrentAuthUser";
import getWeatherData from "./routes/getWeatherData";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5010;

logger.info("Starting app server...");

// Mock data setup
const mockDataInitialized = (async () => {
  if (process.env.USE_MOCK === "true") {
    console.log("Initializing mock data...");
    try {
      await populate_with_mock_data();
      logger.info("Mock data initialization complete");
    } catch (mockError) {
      logger.error("Mock data initialization failed:", mockError);
    }
  }
})();

app.use(async function initializeMockData(req, res, next) {
  await mockDataInitialized;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Public (Auth-free) API Routes
app.post("/api/signup", signup);
app.post("/api/login", login);
app.get("/api/logout", logout);
app.post("/api/forgot-password", forgotPassword);
app.post("/api/reset-password", resetPassword);

// Public API Routes
app.get("/api/contact_form_submissions", listContactFormSubmissions());
app.post("/api/contact_form_submissions", createContactFormSubmission());
app.get(
  "/api/contact_form_submissions/:contact_form_submission_id",
  getContactFormSubmission()
);
app.get("/api/github_profile", getGitHubProfile());
app.get("/api/recipes", searchRecipes());
app.get("/api/storm/me", getCurrentAuthUser());
app.get("/api/weather", getWeatherData());

// Serve static public folder
app.use(express.static(path.join(__dirname, "../public")));

// JWT auth middleware (runs after public routes)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (
    req.path.startsWith("/api/signup") ||
    req.path.startsWith("/api/login") ||
    req.path.startsWith("/api/logout") ||
    req.path.startsWith("/api/reset-password") ||
    req.path.startsWith("/api/forgot-password")
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized", redirect: "/login.html" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("JWT verification failed:", error);
    return res
      .status(401)
      .json({ error: "Invalid or expired token", redirect: "/login.html" });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: `Internal Server Error: ${err.message}` });
});

// Start server (only once)
if (require.main === module) {
  app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`🚀 App running at: ${url}`);
    logger.info(`Server is running at ${url}`);
  });
}

export default app;
