const { getTikTokData } = require("./strategies/tiktokStrategy");

/**
 * PingTok Enterprise Resolver
 * Currently exclusive to TikTok Media.
 */
async function resolveMedia(url) {
  if (!url) throw new Error("URL cannot be empty");

  // Validate TikTok URL
  const isTikTok = url.includes("tiktok.com") || url.includes("douyin.com") || url.includes("/t/");
  
  if (isTikTok) {
    console.log(`[PingTok API] Processing: ${url}`);
    return await getTikTokData(url);
  }

  throw new Error("Invalid Platform. This API currently supports TikTok only.");
}

module.exports = { resolveMedia };