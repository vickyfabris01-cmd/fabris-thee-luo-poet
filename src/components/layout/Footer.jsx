import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useSupabaseQuery } from "../../lib/db";
import IdentityMark from "../IdentityMark";

export default function Footer() {
  const [iconClicks, setIconClicks] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPublicPage = !location.pathname.startsWith("/dashboard");
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  // Fetch profiles to get user profile data
  const { data: profiles = [] } = useSupabaseQuery("profiles");
  const userProfile = profiles?.find((p) => p.auth_uid === user?.id) || {};

  // Reset icon clicks after 3 seconds of inactivity
  useEffect(() => {
    if (iconClicks === 0) return;
    const timer = setTimeout(() => {
      setIconClicks(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [iconClicks]);

  const handleIconClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newClicks = iconClicks + 1;
    setIconClicks(newClicks);
    if (newClicks === 5) {
      navigate("/secret-login");
      setIconClicks(0);
    }
  };

  return (
    <footer className="footer">
      {isHomePage && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <IdentityMark />
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.9rem",
              lineHeight: 1.4,
            }}
          >
            {userProfile?.display_name && userProfile?.bio ? (
              <>
                <strong>{userProfile.display_name}</strong> — {userProfile.bio}
              </>
            ) : (
              "A mobile-first poetry & media space — public art, private control."
            )}
          </p>
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "center",
          marginTop: isHomePage ? "0" : "auto",
        }}
      >
        <div>© Fabris Thee Luo Poet</div>
        {isPublicPage && (
          <div
            onClick={handleIconClick}
            style={{
              cursor: "inherit",
              fontSize: "16px",
              userSelect: "none",
              opacity: 0.6,
            }}
          >
            🔒
          </div>
        )}
      </div>
    </footer>
  );
}
