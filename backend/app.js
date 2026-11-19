import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import { allowedOrigins, aiEnabled, cloudinaryConfigured, isProduction } from "./config/env.js";
import { LOCAL_UPLOAD_DIR } from "./utils/storage.js";
import requireAppHeader from "./middlewares/csrf.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";

const app = express();

app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
app.disable("x-powered-by");

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use("/api", requireAppHeader);

if (!cloudinaryConfigured && !isProduction) {
  app.use("/uploads", express.static(LOCAL_UPLOAD_DIR));
}

app.get("/api/v1/health", (req, res) => res.json({ ok: true, ai: aiEnabled() }));
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

app.use((req, res) => res.status(404).json({ message: "Not found.", success: false }));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "That file is too large."
        : "That file type isn't supported here.";
    return res.status(400).json({ message, success: false });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large.", success: false });
  }
  console.error("Unhandled error:", error?.message || error);
  return res.status(500).json({ message: "Something went wrong. Please try again.", success: false });
});

export default app;
