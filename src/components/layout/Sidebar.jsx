import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../context/AuthProvider";
import { useNotificationCount } from "../../context/NotificationContext";

export default function Sidebar({ open, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const notificationCount = useNotificationCount();

  return (
    <>
      {open && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`} inert={!open}>
        <nav>
          {isDashboard ? (
            // Dashboard-specific navigation
            <>
              <Link
                to="/dashboard"
                className={location.pathname === "/dashboard" ? "active" : ""}
                onClick={onClose}
              >
                📊 Overview
              </Link>
              <Link
                to="/dashboard/poems"
                className={
                  location.pathname === "/dashboard/poems" ? "active" : ""
                }
                onClick={onClose}
              >
                ✍️ Poems
              </Link>
              <Link
                to="/dashboard/videos"
                className={
                  location.pathname === "/dashboard/videos" ? "active" : ""
                }
                onClick={onClose}
              >
                🎥 Videos
              </Link>
              <Link
                to="/dashboard/live"
                className={
                  location.pathname === "/dashboard/live" ? "active" : ""
                }
                onClick={onClose}
              >
                🔴 Live
              </Link>
              <Link
                to="/dashboard/comments"
                className={
                  location.pathname === "/dashboard/comments" ? "active" : ""
                }
                onClick={onClose}
              >
                💬 Comments
              </Link>
              <Link
                to="/dashboard/invites"
                className={
                  location.pathname === "/dashboard/invites" ? "active" : ""
                }
                onClick={onClose}
              >
                📩 Invites
              </Link>
              <Link
                to="/dashboard/notifications"
                className={
                  location.pathname === "/dashboard/notifications"
                    ? "active"
                    : ""
                }
                onClick={onClose}
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                🔔 Notifications
                {notificationCount > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: "var(--accent)",
                      color: "white",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                  >
                    {notificationCount}
                  </span>
                )}
              </Link>
              <Link
                to="/dashboard/library"
                className={
                  location.pathname === "/dashboard/library" ? "active" : ""
                }
                onClick={onClose}
              >
                📚 Library
              </Link>
              <Link
                to="/dashboard/profile"
                className={
                  location.pathname === "/dashboard/profile" ? "active" : ""
                }
                onClick={onClose}
              >
                👤 Profile
              </Link>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  background: "var(--accent)",
                  border: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  padding: "10px 16px",
                  width: "100%",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              >
                {theme === "dark" ? "🌙 Dark" : "🌞 Light"}
              </button>
              <AuthControls onClose={onClose} />
            </>
          ) : (
            // Public site navigation
            <>
              <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""}
                onClick={onClose}
              >
                Home
              </Link>
              <Link
                to="/poems"
                className={location.pathname === "/poems" ? "active" : ""}
                onClick={onClose}
              >
                Poems
              </Link>
              <Link
                to="/videos"
                className={location.pathname === "/videos" ? "active" : ""}
                onClick={onClose}
              >
                Videos
              </Link>
              <Link
                to="/live"
                className={location.pathname === "/live" ? "active" : ""}
                onClick={onClose}
              >
                Live
              </Link>
              <Link
                to="/invite"
                className={location.pathname === "/invite" ? "active" : ""}
                onClick={onClose}
              >
                Invite
              </Link>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  background: "var(--accent)",
                  border: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  padding: "10px 16px",
                  width: "100%",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              >
                {theme === "dark" ? "🌙 Dark" : "🌞 Light"}
              </button>
              <AuthControls onClose={onClose} />
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

function AuthControls({ onClose }) {
  const { user, signOut } = useAuth();

  // Only show sign-out if user is authenticated
  if (!user) return null;

  const handleSignOut = async () => {
    const res = await signOut();
    if (res && res.success) {
      if (typeof onClose === "function") onClose();
    }
  };

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: "var(--accent)",
        border: "none",
        textAlign: "center",
        cursor: "pointer",
        padding: "10px 16px",
        width: "100%",
        color: "var(--text)",
        fontFamily: "inherit",
      }}
    >
      🚪 Sign out
    </button>
  );
}
