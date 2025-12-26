const express = require("express");
const router = express.Router();
const { handleUniversalDownload } = require("../controllers/universalController");

// The "Magic" Endpoint
// GET /api/resolve?url=...
router.get("/resolve", handleUniversalDownload);

module.exports = router;