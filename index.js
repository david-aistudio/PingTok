const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// SECURITY LAYER 1: HTTP Headers Hardening
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for inline scripts (needed for our UI)
}));

// SECURITY LAYER 2: Anti-DDoS / Rate Limiting
// Limit each IP to 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again after 15 minutes. (Anti-Spam Protection)"
  }
});
app.use("/api/", limiter);

// Enable CORS
app.use(cors());
app.use(express.json());
app.set("json spaces", 2);

// API Routes
app.use("/api/tiktok", require("./routes/tiktok"));
app.use("/api/proxy", require("./routes/proxy"));

// Root route for API health check
app.get("/", (req, res) => {
  res.json({ status: "online", system: "PingTok Core", version: "2.1.0" });
});

// VERCEL SERVERLESS CONFIGURATION
if (require.main === module) {
  // Local Development
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;