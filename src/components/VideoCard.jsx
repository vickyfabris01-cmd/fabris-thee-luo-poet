import React, { useState } from "react";
import { getYouTubeThumb } from "../lib/youtube";
import { formatDate, pickDateField, trimToWords } from "../lib/format";

export default function VideoCard({ video, onOpen }) {
  const [thumbError, setThumbError] = useState(false);
  const primaryThumb = getYouTubeThumb(video.youtubeId || video.youtube_url || video.url || "");
  const thumb = thumbError ? "/FLP.jpeg" : (primaryThumb || "/FLP.jpeg");
  const displayDate = formatDate(pickDateField(video));
  const isShort = video.video_type === 'short';

  if (isShort) {
    // Portrait layout for TikTok/Facebook short videos
    return (
      <article className="list-card" style={{ flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <div style={{ flex: "0 0 120px", display: "flex", flexDirection: "column", gap: 8 }}>
            <img
              src={thumb}
              alt="thumbnail"
              className="thumbnail"
              onClick={() => onOpen(video)}
              onError={() => setThumbError(true)}
              style={{ cursor: "pointer", borderRadius: 8, width: "100%", aspectRatio: "9/16", objectFit: "cover" }}
            />
          </div>
          <div style={{ flex: "1", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: "1rem" }}>{trimToWords(video.title)}</h4>
            <small style={{ color: "var(--muted)" }}>{displayDate}</small>
          </div>
        </div>
      </article>
    );
  }

  // Landscape layout for YouTube long videos (original)
  return (
    <article className="list-card">
      <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", gap: 8 }}>
        <h4 style={{ margin: 0 }}>{trimToWords(video.title)}</h4>
        <img
          src={thumb}
          alt="thumbnail"
          className="thumbnail"
          onClick={() => onOpen(video)}
          onError={() => setThumbError(true)}
          style={{ cursor: "pointer", borderRadius: 8, width: "100%", height: "auto" }}
        />
      </div>
      <div
        className="meta"
        style={{ flex: "1 1 45%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      >
        <small style={{ color: "var(--muted)" }}>{displayDate}</small>
      </div>
    </article>
  );
}
