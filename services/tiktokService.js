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
  // 1. CACHE CHECK
  if (memoryCache.has(videoUrl)) {
    const cached = memoryCache.get(videoUrl);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[CACHE HIT] Serving from memory: ${videoUrl}`);
      return { ...cached.data, cached: true };
    }
    memoryCache.delete(videoUrl); // Expired, remove
  }

  // Attempt 1: TikWM
  try {
    const res = await axios.get("https://www.tikwm.com/api/", {
      params: {
        url: videoUrl,
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
      memoryCache.set(videoUrl, { timestamp: Date.now(), data: result });
      return result;
    }
    // If code is not 0, throw to trigger fallback
    throw new Error("TikWM API returned error code");
  } catch (error) {
    console.log(`[Primary API Failed] ${error.message}.`);
    throw new Error("Gagal mengambil data video. Server sedang sibuk, coba lagi nanti.");
  }
}

function formatTikwmResponse(data) {
  return {
    status: "success",
    platform: "tiktok",
    title: data.title || "TikTok Video",
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
    downloads: [
      {
        type: "video",
        label: "HD No Watermark",
        url: data.hdplay || data.play,
        is_hd: true
      },
      {
        type: "video",
        label: "Watermark",
        url: data.wmplay,
        is_hd: false
      },
      {
        type: "audio",
        label: "MP3 Audio",
        url: data.music,
        is_hd: false
      }
    ].filter(item => item.url),
  };
}

module.exports = {
  fetchTikTokData,
};
