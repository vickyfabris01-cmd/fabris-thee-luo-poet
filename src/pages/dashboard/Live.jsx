import { useState } from "react";
import { useDashboardContext } from "../Dashboard";
import { updateRecord, insertRecord } from "../../lib/db";
import { parseYouTubeId, getYouTubeEmbedUrl } from "../../lib/youtube";

export default function DashboardLive() {
  const { liveSettings, refetchLive } = useDashboardContext();
  const settings = liveSettings?.[0] || { id: null, youtubeId: "", enabled: false };

  const [youtubeUrl, setYoutubeUrl] = useState(
    settings.youtube_url || settings.youtubeId || ""
  );
  const [enabled, setEnabled] = useState(settings.enabled ?? settings.is_enabled ?? false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const youtubeId = parseYouTubeId(youtubeUrl);
    if (!youtubeId && youtubeUrl) {
      alert('Invalid YouTube URL');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        youtubeId: youtubeId || "",
        enabled: enabled && !!youtubeId,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        // Update existing record
        await updateRecord('live_settings', settings.id, payload);
      } else {
        // Create new record
        await insertRecord('live_settings', {
          ...payload,
          created_at: new Date().toISOString(),
        });
      }

      await refetchLive();
      alert('Live settings saved!');
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <h3>Live Stream Management</h3>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: 8 }}>
          <label>YouTube Live URL or Channel
            <input 
              type="text" 
              value={youtubeUrl} 
              onChange={(e) => setYoutubeUrl(e.target.value)} 
              placeholder="https://www.youtube.com/watch?v=..." 
              disabled={loading}
            />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={loading}
            />
            <span>Live Active</span>
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Live Settings'}
          </button>
        </form>
      </div>
      <div className="card">
        <h3>Live Preview</h3>
        {enabled && youtubeUrl ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', marginTop: 8 }}>
            <iframe
              src={getYouTubeEmbedUrl(youtubeUrl)}
              title="live preview"
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ color: 'var(--muted)' }}>Configure and enable live to preview here.</div>
        )}
      </div>
    </div>
  );
}
