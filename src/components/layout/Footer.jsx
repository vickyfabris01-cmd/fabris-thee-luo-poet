import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import IdentityMark from "../IdentityMark";

export default function Footer() {
  const [iconClicks, setIconClicks] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicPage = !location.pathname.startsWith("/dashboard");
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

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
    <>
      {isHomePage && (
        <section className="intro">
          <IdentityMark />

          <p>
            A mobile-first poetry & media space — public art, private control.
          </p>
        </section>
      )}
      <footer className="footer">
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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
    </>
  );
}
