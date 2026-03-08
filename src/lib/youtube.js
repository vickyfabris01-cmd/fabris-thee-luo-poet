/**
 * Parse YouTube video ID from various URL formats
 * Handles:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - dQw4w9WgXcQ (direct ID)
 * @param {string} url - YouTube URL or video ID
 * @returns {string|null} YouTube video ID or null if invalid
 */
export function parseYouTubeId(url) {
  if (!url) return null;

  // If it looks like a direct ID (11 alphanumeric characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Try to extract from standard youtube.com URLs
  const youtubeMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return youtubeMatch[1];
  }

  // Try to extract from youtu.be short URLs
  const shortyMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortyMatch) {
    return shortyMatch[1];
  }

  return null;
}

/**
 * Generate an embeddable URL based on the video platform
 * Handles YouTube, TikTok, and Facebook URLs
 * @param {string} input - Video URL or YouTube ID
 * @returns {string} Embeddable URL or empty string if invalid
 */
export function getYouTubeEmbedUrl(input) {
  if (!input) return "";
  
  // YouTube
  const youtubeId = parseYouTubeId(input);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }
  
  // TikTok: Use the oembed API endpoint as an iframe source (experimental)
  if (input.includes('tiktok.com')) {
    // TikTok embeds work best with their blockquote embed, not iframe
    // For now, return the video URL itself for fallback
    return input;
  }
  
  // Facebook: Similar situation - needs SDK and special code
  if (input.includes('facebook.com')) {
    return input;
  }
  
  return "";
}

/**
 * Generate a YouTube thumbnail URL from a video ID or URL
 * Uses hqdefault which is available for all videos (maxresdefault not always available)
 * Falls back to sddefault if needed
 * @param {string} input - YouTube video ID or full URL
 * @returns {string} YouTube thumbnail URL
 */
export function getYouTubeThumb(input) {
  const videoId = parseYouTubeId(input);
  if (!videoId) {
    return "";
  }
  // Use hqdefault which is reliably available for all videos
  // Format: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Generate a standard YouTube watch URL from a video ID or URL
 * @param {string} input - YouTube video ID or full URL
 * @returns {string} Standard YouTube watch URL (https://www.youtube.com/watch?v=...)
 */
export function getYouTubeWatchUrl(input) {
  const videoId = parseYouTubeId(input);
  if (!videoId) {
    return "";
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Fetch metadata from a YouTube video using the oEmbed API
 * Returns title, author name, and other metadata
 * @param {string} input - YouTube video ID or full URL
 * @returns {Promise<Object|null>} Object with title and metadata, or null if fetch fails
 */
export async function fetchYouTubeMetadata(input) {
  try {
    const videoId = parseYouTubeId(input);
    if (!videoId) {
      return null;
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return null;
  }
}

/**
 * Fetch metadata from a TikTok video using the oEmbed API
 * Accepts both full URLs (tiktok.com) and share links (vt.tiktok.com)
 * @param {string} url - TikTok video URL or share link
 * @returns {Promise<Object|null>} Object with title and metadata, or null if fetch fails
 */
export async function fetchTikTokMetadata(url) {
  try {
    if (!url || (!url.includes('tiktok.com') && !url.includes('vt.tiktok.com'))) {
      return null;
    }

    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch (error) {
    console.error("Error fetching TikTok metadata:", error);
    return null;
  }
}

/**
 * Fetch embed HTML from TikTok oEmbed API
 * Returns the HTML code needed to embed the video
 * @param {string} url - TikTok video URL or share link
 * @returns {Promise<Object|null>} Object with html, title, etc or null if fetch fails
 */
export async function fetchTikTokEmbed(url) {
  try {
    if (!url || (!url.includes('tiktok.com') && !url.includes('vt.tiktok.com'))) {
      return null;
    }

    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      html: data.html || "",
      title: data.title || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch (error) {
    console.error("Error fetching TikTok embed:", error);
    return null;
  }
}

/**
 * Fetch embed HTML from Facebook oEmbed API
 * Returns the HTML code needed to embed the video
 * @param {string} url - Facebook video URL
 * @returns {Promise<Object|null>} Object with html, title, etc or null if fetch fails
 */
export async function fetchFacebookEmbed(url) {
  try {
    if (!url || !url.includes('facebook.com')) {
      return null;
    }

    const oembedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&maxwidth=540`;
    
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }

    // Facebook returns HTML directly as an iframe
    const html = await response.text();
    return {
      html: html || "",
      title: "",
    };
  } catch (error) {
    console.error("Error fetching Facebook embed:", error);
    return null;
  }
}
