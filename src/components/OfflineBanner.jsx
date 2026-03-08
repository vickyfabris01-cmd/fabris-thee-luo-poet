import { useOffline } from "../context/OfflineProvider";
import "./OfflineBanner.css";

export default function OfflineBanner() {
  const isOnline = useOffline();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <div className="offline-banner-content">
        <span className="offline-icon">📡</span>
        <span className="offline-text">
          You are offline. Displaying cached content.
        </span>
      </div>
    </div>
  );
}
