import IdentityMark from "../components/IdentityMark";
import { useSupabaseQuery, getActiveProfilePhoto } from "../lib/db";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import { getYouTubeThumb } from "../lib/youtube";
import { trimToWords } from "../lib/format";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  const { data: poems = [], loading: loadingPoems } = useSupabaseQuery("poems");
  const { data: videos = [], loading: loadingVideos } =
    useSupabaseQuery("videos");
  const { data: liveSettings = [], loading: loadingLive } =
    useSupabaseQuery("live_settings");
  const [videoThumbError, setVideoThumbError] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loadingProfilePhoto, setLoadingProfilePhoto] = useState(false);

  const featuredPoem = (poems && poems[0]) || null;
  const featuredVideo = (videos && videos[0]) || null;
  const liveActive =
    (liveSettings && liveSettings[0] && liveSettings[0].enabled) || false;

  const isLoading = loadingPoems || loadingVideos || loadingLive;
  const videoThumb = videoThumbError
    ? "/FLP.jpeg"
    : getYouTubeThumb(
        featuredVideo?.youtubeId || featuredVideo?.youtube_url || "",
      ) || "/FLP.jpeg";

  // Fetch active profile photo
  useEffect(() => {
    if (user?.id) {
      const fetchProfilePhoto = async () => {
        setLoadingProfilePhoto(true);
        const photo = await getActiveProfilePhoto(user.id);
        setProfilePhoto(photo);
        setLoadingProfilePhoto(false);
      };
      fetchProfilePhoto();
    }
  }, [user?.id]);

  return (
    <div className="page">
      <section className="intro">
        <IdentityMark />

        <p>
          A mobile-first poetry & media space — public art, private control.
        </p>
      </section>

      {/* Show Live first if active */}
      {liveActive && (
        <section
          className="featured-card"
          style={{ borderColor: "var(--accent)", borderWidth: 2 }}
        >
          <h4 style={{ margin: 0, color: "var(--accent)", fontWeight: 700 }}>
            🔴 Live Now
          </h4>
          <div style={{ marginTop: 8 }}>
            <Link to="/live" className="btn-primary">
              Watch Live
            </Link>
          </div>
        </section>
      )}

      {/* Profile Photo */}
      {profilePhoto && (
        <section className="featured-card">
          <h4 style={{ margin: 0, color: "var(--muted)", fontWeight: 700 }}>
            👤 Profile
          </h4>
          <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden" }}>
            <img
              src={profilePhoto.image_url}
              alt="Profile Photo"
              className="identity-img is-avatar"
              style={{ width: "100%", height: "auto", borderRadius: 8 }}
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        </section>
      )}

      {/* Featured content */}
      <section className="featured-card">
        <h4 style={{ margin: 0, color: "var(--muted)", fontWeight: 700 }}>
          Featured
        </h4>
        {isLoading ? (
          <Loader size="small" message="Loading featured content..." />
        ) : !featuredPoem && !featuredVideo ? (
          <div style={{ paddingTop: 8, color: "var(--muted)" }}>
            No featured items yet. Add content in the dashboard.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20, marginTop: 8 }}>
            {/* Featured Poem */}
            {featuredPoem && (
              <div>
                <h5
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                    color: "var(--muted)",
                  }}
                >
                  Poem
                </h5>
                <h3 style={{ margin: "6px 0 4px" }}>
                  {trimToWords(featuredPoem.title)}
                </h3>
                <p style={{ color: "var(--muted)", marginBottom: 12 }}>
                  {featuredPoem.body.split("\n").slice(0, 2).join(" ")}
                </p>
                <Link to={`/poems/${featuredPoem.id}`} className="btn-primary">
                  Read
                </Link>
              </div>
            )}

            {/* Featured Video */}
            {featuredVideo && (
              <div>
                <h5
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                    color: "var(--muted)",
                  }}
                >
                  Video
                </h5>
                <div
                  style={{
                    borderRadius: 8,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <img
                    src={videoThumb}
                    alt={featuredVideo.title}
                    onError={() => setVideoThumbError(true)}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                <h3 style={{ margin: "6px 0 4px" }}>
                  {trimToWords(featuredVideo.title)}
                </h3>
                <Link to="/videos" className="btn-primary">
                  Watch
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
