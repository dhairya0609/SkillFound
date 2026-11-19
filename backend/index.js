import app from "./app.js";
import { aiEnabled, cloudinaryConfigured, isProduction } from "./config/env.js";
import connectDB from "./utils/db.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT} (AI ${aiEnabled() ? "on" : "off"}, uploads ${cloudinaryConfigured ? "cloudinary" : isProduction ? "disabled" : "local"})`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error?.message || error);
    process.exit(1);
  });
