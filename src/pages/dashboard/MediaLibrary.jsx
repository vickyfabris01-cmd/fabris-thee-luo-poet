import { useDashboardContext } from "../Dashboard";
import { useState, useEffect } from "react";
import { trimToWords } from "../../lib/format";
import { useAuth } from "../../context/AuthProvider";
import { getActiveProfilePhoto } from "../../lib/db";

export default function DashboardMediaLibrary() {
  const { poems = [], videos = [] } = useDashboardContext();
  const { user } = useAuth();
  const [tab, setTab] = useState("posts"); // 'posts', 'videos', 'profile'
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const fetchActivePhoto = async () => {
      if (user?.id) {
        const photo = await getActiveProfilePhoto(user.id);
        setActivePhoto(photo);
      }
    };
    fetchActivePhoto();
  }, [user?.id]);

  // Support legacy profile_image or new photo_history
  let photoHistory = [];
  if (activePhoto) {
    photoHistory = [
      {
        url: activePhoto.image_url,
        uploaded_at: activePhoto.created_at,
        is_active: true,
      },
    ];
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h3>Library</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setTab("posts")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: tab === "posts" ? "var(--accent)" : "transparent",
            color: tab === "posts" ? "white" : "var(--text)",
          }}
        >
          📝 Posts ({poems.length})
        </button>
        <button
          onClick={() => setTab("videos")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: tab === "videos" ? "var(--accent)" : "transparent",
            color: tab === "videos" ? "white" : "var(--text)",
          }}
        >
          🎬 Videos ({videos.length})
        </button>
        <button
          onClick={() => setTab("profile")}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: tab === "profile" ? "var(--accent)" : "transparent",
            color: tab === "profile" ? "white" : "var(--text)",
          }}
        >
          🖼️ Images ({photoHistory.length})
        </button>
      </div>

      {tab === "posts" && (
        <div style={{ display: "grid", gap: 8 }}>
          {poems.length === 0 ? (
            <div
              style={{
                color: "var(--muted)",
                textAlign: "center",
                padding: 20,
              }}
            >
              No poems yet.
            </div>
          ) : (
            poems
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((p) => (
                <div key={p.id} className="card" style={{ padding: 12 }}>
                  <strong>{trimToWords(p.title, 4)}</strong>
                  <small
                    style={{
                      display: "block",
                      color: "var(--muted)",
                      marginTop: 6,
                    }}
                  >
                    {new Date(p.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
          )}
        </div>
      )}

      {tab === "videos" && (
        <div style={{ display: "grid", gap: 8 }}>
          {videos.length === 0 ? (
            <div
              style={{
                color: "var(--muted)",
                textAlign: "center",
                padding: 20,
              }}
            >
              No videos yet.
            </div>
          ) : (
            videos
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((v) => (
                <div key={v.id} className="card" style={{ padding: 12 }}>
                  <strong>{trimToWords(v.title, 4)}</strong>
                  <small
                    style={{
                      display: "block",
                      color: "var(--muted)",
                      marginTop: 6,
                    }}
                  >
                    {new Date(v.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
          )}
        </div>
      )}

      {tab === "profile" &&
        (photoHistory.length === 0 ? (
          <div
            style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}
          >
            No profile images uploaded yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {photoHistory.map((photo, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  paddingBottom: "100%",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "var(--surface)",
                  border: photo.is_active
                    ? "3px solid var(--accent)"
                    : "1px solid var(--border)",
                }}
              >
                <img
                  src={photo.url}
                  alt="profile"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => (e.target.src = "/MyLogo.png")}
                />
                {photo.is_active && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "rgba(0,0,0,0.6)",
                      color: "var(--accent)",
                      padding: 4,
                      textAlign: "center",
                    }}
                  >
                    ✓ Active
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
