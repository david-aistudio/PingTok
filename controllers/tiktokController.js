const { fetchTikTokData } = require("../services/tiktokService");

async function handleTikTokDownload(req, res) {
  try {
    const { url } = req.query;
    
    // SECURITY LAYER 3: Strict Input Validation
    if (!url) {
      return res.status(400).json({ status: "error", message: "Link TikTok wajib diisi." });
    }
    
    // Validate URL format (Must contain tiktok.com or douyin.com)
    const isValidUrl = (url.includes('tiktok.com') || url.includes('douyin.com')) && typeof url === 'string';
    
    if (!isValidUrl || url.length > 500) {
      return res.status(400).json({ status: "error", message: "Link tidak valid. Masukkan link TikTok/TikTok Lite yang benar." });
    }

    const data = await fetchTikTokData(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

module.exports = { handleTikTokDownload };
