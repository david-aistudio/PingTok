const { resolveMedia } = require("../services/mediaService");

async function handleUniversalDownload(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        status: "error", 
        message: "URL is required." 
      });
    }

    // Call the universal service
    const data = await resolveMedia(url);
    
    // Standardize success response
    res.json({
      status: "success",
      ...data
    });

  } catch (error) {
    console.error(`[Universal Controller Error] ${error.message}`);
    res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}

module.exports = { handleUniversalDownload };