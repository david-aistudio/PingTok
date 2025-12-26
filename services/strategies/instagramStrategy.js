const axios = require("axios");
const cheerio = require("cheerio");

async function getInstagramData(url) {
  try {
    // Basic User Agent Rotation
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
      "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36"
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // 1. Fetch Page Content (Only works for Public Posts)
    const res = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    const $ = cheerio.load(res.data);
    
    // 2. Extract OpenGraph Data
    const title = $('meta[property="og:title"]').attr('content') || "Instagram Post";
    const image = $('meta[property="og:image"]').attr('content');
    const video = $('meta[property="og:video"]').attr('content');
    const desc = $('meta[property="og:description"]').attr('content');
    
    // Extract Author from title or desc
    // Format usually: "Name (@username) on Instagram: ..."
    let authorName = "Instagram User";
    let authorId = "unknown";
    
    const titleMatch = title.match(/(.*) \(@(.*)\)/);
    if (titleMatch) {
        authorName = titleMatch[1];
        authorId = titleMatch[2];
    }

    const downloads = [];

    if (video) {
        downloads.push({
            type: "video",
            label: "Video (Public)",
            url: video,
            is_hd: true
        });
    } else if (image) {
         downloads.push({
            type: "image",
            label: "Photo (Public)",
            url: image,
            is_hd: true
        });
    } else {
        throw new Error("No media found. Account might be private.");
    }

    return {
        platform: 'instagram',
        type: video ? 'video' : 'image',
        title: desc || title,
        cover: image || "https://via.placeholder.com/300?text=Instagram",
        author: {
            name: authorName,
            avatar: "https://ui-avatars.com/api/?name=" + authorName,
            id: authorId
        },
        stats: { plays: 0, likes: 0, comments: 0, shares: 0 },
        downloads: downloads
    };

  } catch (error) {
    console.log(`[Instagram Strategy] Error: ${error.message}`);
    // If scraping fails (likely due to login wall), we should integrate a proper API here later.
    throw new Error("Gagal mengambil data Instagram. Akun mungkin Private atau Instagram memblokir akses server.");
  }
}

module.exports = { getInstagramData };