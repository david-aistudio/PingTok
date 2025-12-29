const { resolveMedia } = require("../services/mediaService");

async function handleUniversalDownload(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      // If accessed directly without URL, show documentation instead of JSON error
      // This is friendlier for developers exploring the API
      return res.redirect('/docs');
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