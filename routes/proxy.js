const express = require("express");
const router = express.Router();
const { proxyDownload } = require("../controllers/proxyController");

router.get("/stream", proxyDownload);

module.exports = router;
