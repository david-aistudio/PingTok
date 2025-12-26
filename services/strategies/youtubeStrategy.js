const ytdl = require("ytdl-core");

async function getYouTubeData(url) {
  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error("Invalid YouTube URL");
    }

    // Get Info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Filter Formats (Video + Audio combined is best for direct download, but often limited to 720p)
    // We get 'mp4' with audio
    const formats = ytdl.filterFormats(info.formats, "audioandvideo");
    
    // Sort by resolution (Highest first)
    formats.sort((a, b) => (b.height || 0) - (a.height || 0));

    // Also get audio only
    const audioFormats = ytdl.filterFormats(info.formats, "audioonly");
    audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate);

    const downloads = [];

    // Add Top 3 Video Formats
    formats.slice(0, 3).forEach(fmt => {
      downloads.push({
        type: "video",
        label: `${fmt.qualityLabel || 'Unknown'} (${fmt.container})`,
        url: fmt.url,
        is_hd: fmt.qualityLabel === '1080p' || fmt.qualityLabel === '720p'
      });
    });

    // Add Best Audio
    if (audioFormats.length > 0) {
      downloads.push({
        type: "audio",
        label: `Audio (${audioFormats[0].container})`,
        url: audioFormats[0].url,
        is_hd: false
      });
    }

    // Prepare Thumbnails (Highest Res)
    const thumbnails = videoDetails.thumbnails.sort((a, b) => b.width - a.width);

    return {
      platform: "youtube",
      type: "video",
      title: videoDetails.title,
      cover: thumbnails[0].url,
      author: {
        name: videoDetails.author.name,
        avatar: videoDetails.author.thumbnails?.[0]?.url || "https://ui-avatars.com/api/?name=Y+T",
        id: videoDetails.author.user || videoDetails.author.channelId
      },
      stats: {
        plays: parseInt(videoDetails.viewCount) || 0,
        likes: videoDetails.likes || 0, // YouTube often hides this now
        comments: 0,
        shares: 0
      },
      downloads: downloads
    };

  } catch (error) {
    console.error(`[YouTube Strategy] Error: ${error.message}`);
    throw new Error("Gagal mengambil data YouTube. Pastikan link video publik dan valid.");
  }
}

module.exports = { getYouTubeData };