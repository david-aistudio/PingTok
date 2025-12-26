const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Required for Vercel (Trust the reverse proxy to get correct IPs)
app.set('trust proxy', 1);

// Enable CORS
app.use(cors());
app.use(express.json());
app.set("json spaces", 2);

// API Routes
app.use("/api/universal", require("./routes/universal"));
app.use("/api/proxy", require("./routes/proxy"));

// Legacy redirect for backward compatibility
app.get("/api/tiktok/download", (req, res) => {
  const { url } = req.query;
  res.redirect(`/api/universal/resolve?url=${encodeURIComponent(url)}`);
});

// Serve Frontend (Monolith Mode)
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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