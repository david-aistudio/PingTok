const axios = require("axios");

async function proxyDownload(req, res) {
  const { url, filename, type } = req.query;

  if (!url) {
    return res.status(400).send("URL is required");
  }

  // SECURITY LAYER 4: SSRF Protection
  // Prevent access to local network or non-http protocols
  try {
    const targetUrl = new URL(url);
    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      return res.status(400).send("Invalid protocol");
    }
    const host = targetUrl.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return res.status(403).send("Access to internal network denied");
    }
  } catch (e) {
    return res.status(400).send("Invalid URL");
  }

  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Set headers to force download
    const finalFilename = filename || `tiktok-${Date.now()}.${type === 'audio' ? 'mp3' : 'mp4'}`;
    res.setHeader("Content-Disposition", `attachment; filename="${finalFilename}"`);
    res.setHeader("Content-Type", response.headers["content-type"]);

    // Pipe the stream directly to the client
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).send("Download failed via proxy");
  }
}

module.exports = { proxyDownload };
