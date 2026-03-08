import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [iconClicks, setIconClicks] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicPage = !location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <footer className="footer">
      {deferredPrompt && (
        <button onClick={installApp}>Install App</button>
      )}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div>© Fabris Thee Luo Poet</div>
        {isPublicPage && (
          <div 
            onClick={handleIconClick}
            style={{ 
              cursor: 'inherit', 
              fontSize: '16px', 
              userSelect: 'none',
              opacity: 0.6
            }}
          >
            🔒
          </div>
        )}
      </div>
    </footer>
  );
}
