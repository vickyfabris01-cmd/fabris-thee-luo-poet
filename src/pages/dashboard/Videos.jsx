import { useState, useEffect } from "react";
import { useDashboardContext, formatDate } from "../Dashboard";
import {
  getYouTubeWatchUrl,
  fetchYouTubeMetadata,
  fetchTikTokMetadata,
} from "../../lib/youtube";
import {
  formatDate as formatDisplayDate,
  pickDateField,
  trimToWords,
} from "../../lib/format";
import { updateRecord } from "../../lib/db";

function VideoManager({ videos, onAdd, onDelete }) {
  const [form, setForm] = useState({ youtubeId: "", date: formatDate() });
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState("");
  const [videoTitles, setVideoTitles] = useState({});
  const [platform, setPlatform] = useState("youtube");
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFetchedTitle("");
    if (!form.youtubeId.trim()) return;

    if (platform === "youtube") {
      setFetchingMetadata(true);
      fetchYouTubeMetadata(form.youtubeId).then((metadata) => {
        if (metadata && metadata.title) {
          setFetchedTitle(metadata.title);
        }
        setFetchingMetadata(false);
      });
    } else if (platform === "tiktok") {
      setFetchingMetadata(true);
      fetchTikTokMetadata(form.youtubeId).then((metadata) => {
        if (metadata && metadata.title) {
          setFetchedTitle(metadata.title);
        }
        setFetchingMetadata(false);
      });
    }
  }, [form.youtubeId, platform]);

  useEffect(() => {
    videos.forEach((v) => {
      const youtubeId = v.youtubeId || v.youtube_url || v.url;
      if (youtubeId && !videoTitles[v.id]) {
        if (v.title) {
          setVideoTitles((prev) => ({ ...prev, [v.id]: v.title }));
        } else {
          fetchYouTubeMetadata(youtubeId).then((metadata) => {
            if (metadata && metadata.title) {
              setVideoTitles((prev) => ({ ...prev, [v.id]: metadata.title }));
            }
          });
        }
      }
    });
  }, [videos, videoTitles]);

  const save = async (e) => {
    e.preventDefault();
    try {
      setFetchingMetadata(true);

      let title = fetchedTitle;

      if (platform === "youtube") {
        if (!title) {
          const meta = await fetchYouTubeMetadata(form.youtubeId);
          title = meta?.title || `Video ${form.youtubeId}`;
        }
      } else if (platform === "tiktok") {
        if (!title) {
          const meta = await fetchTikTokMetadata(form.youtubeId);
          title = meta?.title || null;
        }
        if (!title) {
          alert(
            "Could not fetch TikTok title. Please try again or enter title manually.",
          );
          return;
        }
      } else if (platform === "facebook") {
        if (!title) {
          alert("Please enter a title for Facebook videos");
          return;
        }
      }

      const videoType = platform === "youtube" ? "long" : "short";

      await onAdd({
        youtubeId: form.youtubeId,
        title,
        date: form.date,
        video_type: videoType,
      });
      setForm({ youtubeId: "", date: formatDate() });
      setFetchedTitle("");
    } finally {
      setFetchingMetadata(false);
    }
  };

  const refreshVideoTitle = async (video) => {
    setIsSaving(true);
    const youtubeId = video.youtubeId || video.youtube_url || video.url || "";
    const metadata = await fetchYouTubeMetadata(youtubeId);
    if (metadata && metadata.title) {
      setModalTitle(metadata.title);
      await updateRecord("videos", video.id, { title: metadata.title });
      setVideoTitles((prev) => ({ ...prev, [video.id]: metadata.title }));
    }
    setIsSaving(false);
  };

  const handleSaveTitle = async (video) => {
    if (!modalTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await updateRecord("videos", video.id, { title: modalTitle });
      setVideoTitles((prev) => ({ ...prev, [video.id]: modalTitle }));
      setEditingVideoId(null);
      setModalTitle("");
    } catch (e) {
      console.error("Error saving title:", e);
      alert("Error saving title");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (video) => {
    setEditingVideoId(video.id);
    setModalTitle(videoTitles[video.id] || video.title || "");
  };

  const findVideoById = (id) => videos.find((v) => v.id === id);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <form onSubmit={save} style={{ display: "grid", gap: 8 }}>
        {/* Platform Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={platform === "youtube" ? "btn-primary" : ""}
            onClick={() => {
              setPlatform("youtube");
              setForm({ ...form, youtubeId: "" });
              setFetchedTitle("");
            }}
            style={{ flex: 1 }}
          >
            ▶️ YouTube
          </button>
          <button
            type="button"
            className={platform === "tiktok" ? "btn-primary" : ""}
            onClick={() => {
              setPlatform("tiktok");
              setForm({ ...form, youtubeId: "" });
              setFetchedTitle("");
            }}
            style={{ flex: 1 }}
          >
            🎵 TikTok
          </button>
          <button
            type="button"
            className={platform === "facebook" ? "btn-primary" : ""}
            onClick={() => {
              setPlatform("facebook");
              setForm({ ...form, youtubeId: "" });
              setFetchedTitle("");
            }}
            style={{ flex: 1 }}
          >
            👍 Facebook
          </button>
        </div>

        {/* YouTube Mode - auto-fetch title */}
        {platform === "youtube" && (
          <>
            <input
              value={form.youtubeId}
              onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
              placeholder="YouTube ID or URL"
            />
          </>
        )}

        {/* TikTok Mode - auto-fetch title */}
        {platform === "tiktok" && (
          <>
            <input
              value={form.youtubeId}
              onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
              placeholder="TikTok URL or video ID"
            />
            {fetchedTitle && (
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                📌 Title: {fetchedTitle}
              </div>
            )}
          </>
        )}

        {/* Facebook Mode - manual title */}
        {platform === "facebook" && (
          <>
            <label>
              Title
              <input
                value={fetchedTitle}
                onChange={(e) => setFetchedTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </label>
            <input
              value={form.youtubeId}
              onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
              placeholder="Facebook video URL"
            />
          </>
        )}

        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={
              fetchingMetadata ||
              !form.youtubeId.trim() ||
              (platform !== "youtube" && !fetchedTitle.trim())
            }
          >
            Add
          </button>
        </div>
      </form>

      <div style={{ display: "grid", gap: 8 }}>
        {videos.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No videos yet.</div>
        ) : (
          videos.map((v) => (
            <div
              key={v.id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>
                  {trimToWords(
                    videoTitles[v.id] || v.title || "Loading title...",
                  )}
                </strong>
                <div style={{ color: "var(--muted)" }}>
                  {formatDisplayDate(pickDateField(v))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEditModal(v)}
                  style={{ fontSize: "0.85rem", padding: "6px 10px" }}
                >
                  ✏️ Edit Title
                </button>
                <button
                  onClick={() => onDelete(v.id)}
                  title="Delete video"
                  style={{
                    padding: "6px 10px",
                    fontSize: "16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    filter: "drop-shadow(0 0 2px #dc3545) brightness(0.8)",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Title Modal */}
      {editingVideoId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setEditingVideoId(null)}
        >
          <div
            className="card"
            style={{
              padding: 24,
              maxWidth: 400,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Edit Video Title</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8 }}>
                  Title
                </label>
                <textarea
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Enter video title"
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: 8,
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <button
                onClick={() => {
                  const video = findVideoById(editingVideoId);
                  if (video) refreshVideoTitle(video);
                }}
                disabled={isSaving}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                }}
              >
                {isSaving ? "Refreshing..." : "🔄 Refresh from YouTube"}
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    const video = findVideoById(editingVideoId);
                    if (video) handleSaveTitle(video);
                  }}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingVideoId(null)}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid var(--border)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardVideos() {
  const { videos, addVideo, deleteVideo } = useDashboardContext();
  return (
    <VideoManager videos={videos} onAdd={addVideo} onDelete={deleteVideo} />
  );
}
