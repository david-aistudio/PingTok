const axios = require("axios");

// TURBO CACHE STORAGE
const memoryCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

/**
 * Scrape TikTok video/audio data.
 * Strategy:
 * 1. Check Cache (Instant)
 * 2. Primary: TikWM API (Fast, rich metadata)
 * 
 * @param {string} videoUrl - TikTok video URL
 * @returns {Promise<Object>}
 */
async function fetchTikTokData(videoUrl) {
  // 0. EXPAND URL (Fix for TikTok Lite / Short Links)
  const finalUrl = await expandUrl(videoUrl);
  
  // 1. CACHE CHECK
  if (memoryCache.has(finalUrl)) {
    const cached = memoryCache.get(finalUrl);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[CACHE HIT] Serving from memory: ${finalUrl}`);
      return { ...cached.data, cached: true };
    }
    memoryCache.delete(finalUrl); // Expired, remove
  }

  // Attempt 1: TikWM
  try {
    const res = await axios.get("https://www.tikwm.com/api/", {
      params: {
        url: finalUrl,
        hd: 1
      },
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "accept": "application/json"
      },
      timeout: 15000 // Increased to 15s
    });

    if (res.data.code === 0 && res.data.data) {
      const result = formatTikwmResponse(res.data.data);
      // Save to Cache
      memoryCache.set(finalUrl, { timestamp: Date.now(), data: result });
      return result;
    }
    // If code is not 0, throw to trigger fallback
    throw new Error("TikWM API returned error code");
  } catch (error) {
    console.log(`[Primary API Failed] ${error.message}.`);
    throw new Error("Gagal mengambil data video. Server sedang sibuk, coba lagi nanti.");
  }
}

/**
 * Resolves short links (vt.tiktok.com, vm.tiktok.com) to full canonical URLs.
 * This is crucial for TikTok Lite links to work with the API.
 */
async function expandUrl(url) {
  // Only attempt to expand common short domains
  if (!url.includes("vt.tiktok.com") && !url.includes("vm.tiktok.com") && !url.includes("/t/")) {
    return url;
  }

  try {
    console.log(`[URL Expand] Resolving: ${url}`);
    const response = await axios.head(url, {
      maxRedirects: 10,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      },
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    // In Node.js Axios, the final URL after redirects is in request.res.responseUrl
    const expanded = response.request.res.responseUrl || url;
    console.log(`[URL Expand] Resolved to: ${expanded}`);
    return expanded;
  } catch (error) {
    console.warn(`[URL Expand Warning] Failed to expand ${url}: ${error.message}`);
    return url; // Fallback to original if expansion fails (e.g. 403)
  }
}

function formatTikwmResponse(data) {
  const images = data.images || [];
  const downloads = [];

  // Handle Video
  if (data.hdplay || data.play) {
    downloads.push({
      type: "video",
      label: "HD No Watermark",
      url: data.hdplay || data.play,
      is_hd: true
    });
  }
  if (data.wmplay) {
    downloads.push({
      type: "video",
      label: "Watermark",
      url: data.wmplay,
      is_hd: false
    });
  }

  // Handle Music
  if (data.music) {
    downloads.push({
      type: "audio",
      label: "MP3 Audio",
      url: data.music,
      is_hd: false
    });
  }

  // Handle Slideshow Images
  const slideImages = images.map((imgUrl, index) => ({
    type: "image",
    label: `Photo ${index + 1}`,
    url: imgUrl
  }));

  return {
    status: "success",
    platform: "tiktok",
    type: images.length > 0 ? "slideshow" : "video",
    title: data.title || "TikTok Content",
    cover: data.cover || data.origin_cover,
    author: {
      name: data.author?.nickname || "Unknown",
      avatar: data.author?.avatar || "https://ui-avatars.com/api/?name=T",
      id: data.author?.unique_id || "unknown"
    },
    stats: {
      plays: data.play_count || 0,
      likes: data.digg_count || 0,
      comments: data.comment_count || 0,
      shares: data.share_count || 0
    },
    downloads: downloads,
    images: slideImages // Separate list for the UI slider
  };
}

module.exports = {
  fetchTikTokData,
};
