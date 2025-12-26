const axios = require("axios");

// TURBO CACHE STORAGE (Specific to TikTok)
const memoryCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

async function getTikTokData(url) {
  // 0. EXPAND URL
  const finalUrl = await expandUrl(url);
  
  // 1. CACHE CHECK
  if (memoryCache.has(finalUrl)) {
    const cached = memoryCache.get(finalUrl);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[TikTok Cache] HIT: ${finalUrl}`);
      return { ...cached.data, cached: true };
    }
    memoryCache.delete(finalUrl);
  }

  // 2. FETCH FROM API
  try {
    const res = await axios.get("https://www.tikwm.com/api/", {
      params: { url: finalUrl, hd: 1 },
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "accept": "application/json"
      },
      timeout: 15000
    });

    if (res.data.code === 0 && res.data.data) {
      const result = formatTikwmResponse(res.data.data);
      memoryCache.set(finalUrl, { timestamp: Date.now(), data: result });
      return result;
    }
    throw new Error("TikWM API returned error code");
  } catch (error) {
    console.log(`[TikTok Strategy Error] ${error.message}`);
    throw new Error("Gagal mengambil data TikTok. Coba lagi nanti.");
  }
}

async function expandUrl(url) {
  if (!url.includes("vt.tiktok.com") && !url.includes("vm.tiktok.com") && !url.includes("/t/")) {
    return url;
  }
  try {
    const response = await axios.head(url, {
      maxRedirects: 10,
      headers: { "User-Agent": "Mozilla/5.0" },
      validateStatus: (status) => status >= 200 && status < 400
    });
    return response.request.res.responseUrl || url;
  } catch (error) {
    return url;
  }
}

function formatTikwmResponse(data) {
  const images = data.images || [];
  const downloads = [];

  if (data.hdplay || data.play) {
    downloads.push({ type: "video", label: "HD No Watermark", url: data.hdplay || data.play, is_hd: true });
  }
  if (data.wmplay) {
    downloads.push({ type: "video", label: "Watermark", url: data.wmplay, is_hd: false });
  }
  if (data.music) {
    downloads.push({ type: "audio", label: "MP3 Audio", url: data.music, is_hd: false });
  }

  const slideImages = images.map((imgUrl, index) => ({
    type: "image",
    label: `Photo ${index + 1}`,
    url: imgUrl
  }));

  return {
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
    images: slideImages
  };
}

module.exports = { getTikTokData };