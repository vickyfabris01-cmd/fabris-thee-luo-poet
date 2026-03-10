import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { fetchVideoById, useSupabaseQuery } from "../../lib/db";
import { trimToWords } from "../../lib/format";
import { useNotificationCount } from "../../context/NotificationContext";

function titleFromPath(pathname) {
  if (!pathname) return "";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Home";
  // handle /dashboard subroutes
  if (segments[0] === "dashboard") {
    if (segments.length === 1) return "Dashboard";
    const map = {
      poems: "Poems",
      videos: "Videos",
      live: "Live",
      comments: "Comments",
      invites: "Invites",
      notifications: "Notifications",
      profile: "Profile",
    };
    return map[segments[1]] || "Dashboard";
  }

  const map = {
    poems: "Poems",
    videos: "Videos",
    live: "Live",
    invite: "Invite",
    brand: "Brand",
  };
  return (
    map[segments[0]] ||
    segments[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const isDashboard = segments[0] === "dashboard";
  const [computedTitle, setComputedTitle] = useState("");
  const { data: poems = [] } = useSupabaseQuery("poems");
  const notificationCount = useNotificationCount();

  let pageTitle = titleFromPath(location.pathname);

  // If viewing a specific video page (/videos/:id), fetch that single video's title
  useEffect(() => {
    let mounted = true;

    // If NOT on videos/:id page, clear computed title
    if (segments[0] !== "videos" || !segments[1]) {
      setComputedTitle("");
      return;
    }

    const load = async () => {
      try {
        const { data, error } = await fetchVideoById(segments[1]);
        if (error) return;
        if (!mounted) return;
        if (data && data.title) {
          setComputedTitle(data.title);
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  // If viewing a specific poem page (/poems/:id), get the poem title from data
  useEffect(() => {
    if (segments[0] !== "poems" || !segments[1]) {
      setComputedTitle("");
      return;
    }

    const poem = poems.find((p) => String(p.id) === String(segments[1]));
    if (poem && poem.title) {
      setComputedTitle(poem.title);
    } else {
      setComputedTitle("");
    }
  }, [location.pathname, poems]);

  if (computedTitle) pageTitle = computedTitle;

  return (
    <>
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <header className="header">
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            position: "relative",
          }}
        >
          <button
            aria-label="Toggle sidebar"
            onClick={() => setOpen((s) => !s)}
            className="sidebar-toggle"
          >
            ☰
          </button>
          {isDashboard && notificationCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: -8,
                left: 30,
                background: "var(--accent)",
                color: "white",
                borderRadius: "50%",
                width: 18,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {notificationCount}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div style={{ textAlign: "center", fontWeight: 700 }}>
            {trimToWords(pageTitle)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link to="/" className="brand">
            <img src="/MyLogo.svg" alt="FTLP" />
          </Link>
        </div>
      </header>
    </>
  );
}
