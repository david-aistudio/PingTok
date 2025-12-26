const { getTikTokData } = require("./strategies/tiktokStrategy");
const { getInstagramData } = require("./strategies/instagramStrategy");
const { getYouTubeData } = require("./strategies/youtubeStrategy");

/**
 * Universal Media Resolver
 * Identifies the URL and delegates to the correct strategy.
 */
async function resolveMedia(url) {
  if (!url) throw new Error("URL cannot be empty");

  // 1. TikTok Detection
  if (url.includes("tiktok.com") || url.includes("douyin.com")) {
    console.log(`[MediaService] Detected TikTok: ${url}`);
    return await getTikTokData(url);
  }

  // 2. Instagram Detection
  if (url.includes("instagram.com")) {
    console.log(`[MediaService] Detected Instagram: ${url}`);
    return await getInstagramData(url);
  }

  // 3. YouTube Detection
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    console.log(`[MediaService] Detected YouTube: ${url}`);
    return await getYouTubeData(url);
  }

  throw new Error("Platform not supported yet. Coming soon to PingTok Ecosystem!");
}

module.exports = { resolveMedia };