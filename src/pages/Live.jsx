import { useSupabaseQuery } from "../lib/db";
import { getYouTubeEmbedUrl } from "../lib/youtube";
import { useState, useRef, useEffect } from "react";
import ContentActions from "../components/ContentActions";

export default function Live() {
  const { data: liveSettings = [] } = useSupabaseQuery("live_settings");
  const settings = liveSettings?.[0] || { enabled: false, youtubeId: null };
  const isEnabled = settings.enabled ?? settings.is_enabled ?? false;
  const embedUrl = getYouTubeEmbedUrl(
    settings.youtubeId || settings.youtube_url || settings.url || "",
  );

  const [isInView, setIsInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showComments, setShowComments] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isInView && !isEnabled) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isInView, isEnabled]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = (liked, newLikes) => {
    console.log("Liked:", liked, "Total:", newLikes);
  };

  const handleToggleComments = (state) => {
    setShowComments(state);
  };

  return (
    <div className="page">
      <section style={{ marginTop: 12 }}>
        {isEnabled && embedUrl ? (
          <div className="featured-card">
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={embedUrl}
                title="Live stream"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                }}
                frameBorder="0"
                allowFullScreen
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="live-badge">LIVE NOW</span>
              <div style={{ color: "var(--muted)", marginTop: 6 }}>
                Live Session on YouTube
              </div>
            </div>
          </div>
        ) : (
          <div className="featured-card" ref={containerRef}>
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <video
                ref={videoRef}
                src="/Live preview.mp4"
                title="Preview video"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                }}
                muted
                loop
                playsInline
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  onClick={togglePlay}
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  {isPlaying ? "⏸️" : "▶️"}
                </button>
                <button
                  onClick={toggleMute}
                  style={{
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ color: "var(--muted)", marginTop: 6 }}>
                🚨 No live session currently. Check back later! 🚨
              </div>
            </div>
          </div>
        )}
      </section>

      <ContentActions
        contentType="live"
        contentId="live-session"
        initialLikes={0}
        commentCount={0}
        onLike={handleLike}
        onToggleComments={handleToggleComments}
        showComments={showComments}
      />

      {showComments && (
        <div style={{ marginTop: 10 }}>
          <p>Comments will appear here.</p>
        </div>
      )}
    </div>
  );
}
