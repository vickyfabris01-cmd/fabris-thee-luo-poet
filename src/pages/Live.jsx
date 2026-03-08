import { useSupabaseQuery } from "../lib/db";
import { getYouTubeEmbedUrl } from "../lib/youtube";

export default function Live(){
  const { data: liveSettings = [] } = useSupabaseQuery('live_settings');
  const settings = liveSettings?.[0] || { enabled: false, youtubeId: null };
  const isEnabled = settings.enabled ?? settings.is_enabled ?? false;
  const embedUrl = getYouTubeEmbedUrl(
    settings.youtubeId || settings.youtube_url || settings.url || ""
  );
  
  return (
    <div className="page">
      
      <section style={{marginTop:12}}>
        {isEnabled && embedUrl ? (
          <div className="featured-card">
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={embedUrl}
                title="Live stream"
                style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}
                frameBorder="0"
                allowFullScreen
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="live-badge">LIVE NOW</span>
              <div style={{ color: 'var(--muted)', marginTop: 6 }}>Live Session on YouTube</div>
            </div>
          </div>
        ) : (
          <div className="featured-card">
            <p style={{color:'var(--muted)'}}>Currently offline. When live, an embedded player will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
