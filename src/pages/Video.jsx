import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseQuery, insertRecord } from "../lib/db";
import { getYouTubeEmbedUrl, fetchTikTokEmbed, fetchFacebookEmbed } from "../lib/youtube";
import Loader from "../components/Loader";
import { formatDateTime } from "../lib/format";
import { useState, useEffect } from "react";

// Trim long titles to reasonable length with ellipsis
function trimTitle(title, maxLength = 60) {
  if (!title) return "Untitled Video";
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength) + "...";
}

export default function Video() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: videos = [], loading } = useSupabaseQuery("videos");
  const { data: comments = [], refetch: refetchComments } = useSupabaseQuery("comments");
  const [tiktokEmbed, setTiktokEmbed] = useState(null);
  const [facebookEmbed, setFacebookEmbed] = useState(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [reflectionForm, setReflectionForm] = useState({ name: '', anonymous: false, message: '' });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);

  const video = videos.find(v => v.id == id);
  const currentIndex = videos.findIndex(v => v.id == id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < videos.length - 1;
  const previousVideo = hasPrevious ? videos[currentIndex - 1] : null;
  const nextVideo = hasNext ? videos[currentIndex + 1] : null;

  // Reset transition state when id changes
  useEffect(() => {
    setIsTransitioning(false);
    setTransitionDirection(null);
  }, [id]);

  // Handle navigation with transition - navigate immediately
  const navigateWithTransition = (videoId, direction) => {
    setTransitionDirection(direction);
    setIsTransitioning(true);
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate(`/videos/${videoId}`);
    }, 300);
  };

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (touchStart !== null) {
      const distance = touchStart - e.changedTouches[0].clientX;
      if (Math.abs(distance) > 50) { // Swipe threshold
        if (distance > 0 && hasNext) {
          navigateWithTransition(nextVideo.id, 'next');
        } else if (distance < 0 && hasPrevious) {
          navigateWithTransition(previousVideo.id, 'prev');
        }
      }
    }
  };

  // Filter reflections for this video
  const reflectionsFor = (videoId) =>
    (comments || []).filter(
      (r) =>
        String(r.content_id) === String(videoId) &&
        r.content_type === "video" &&
        (r.is_approved === true || r.approved === true)
    );

  // Submit reflection to database
  const addReflection = async (videoId, payload) => {
    const result = await insertRecord('comments', {
      content_type: 'video',
      content_id: videoId,
      sender_name: payload.name || null,
      is_anonymous: payload.anonymous || false,
      message: payload.message,
      is_approved: false,
      created_at: new Date().toISOString(),
    });
    if (result.success) {
      refetchComments();
      setReflectionForm({ name: '', anonymous: false, message: '' });
      setShowReflectionForm(false);
    }
  };

  useEffect(() => {
    if (!video) return;

    setTiktokEmbed(null);
    setFacebookEmbed(null);
    setEmbedLoading(true);

    const loadEmbeds = async () => {
      // Fetch TikTok embed if needed
      if (video.youtube_url?.includes('tiktok.com') || video.youtube_url?.includes('vt.tiktok.com')) {
        const embed = await fetchTikTokEmbed(video.youtube_url);
        if (embed) {
          setTiktokEmbed(embed);
          // Load TikTok embed script
          if (window && !window.tiktok) {
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
          } else if (window.tiktok) {
            window.tiktok.embed.lib.render(document.body);
          }
        }
      }

      // Fetch Facebook embed if needed
      if (video.youtube_url?.includes('facebook.com')) {
        const embed = await fetchFacebookEmbed(video.youtube_url);
        if (embed) {
          setFacebookEmbed(embed);
          // Load Facebook SDK if needed
          if (window && !window.FB) {
            window.fbAsyncInit = function() {
              FB.init({
                xfbml: true,
                version: 'v18.0'
              });
            };
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0';
            script.async = true;
            document.head.appendChild(script);
          } else if (window.FB) {
            window.FB.XFBML.parse();
          }
        }
      }

      setEmbedLoading(false);
    };

    loadEmbeds();
  }, [video]);

  if (loading) {
    return <Loader message="Loading video..." />;
  }

  if (!video) {
    return (
      <div className="page">
        <button onClick={() => navigate('/videos')} style={{ marginBottom: 16 }}>← Back to Videos</button>
        <div style={{ color: 'var(--muted)' }}>Video not found.</div>
      </div>
    );
  }

  return (
    <div className="page" style={{ overflow: 'hidden' }}>
      <div style={{ 
        transform: transitionDirection === 'next' ? 'translateX(-100%)' : (transitionDirection === 'prev' ? 'translateX(100%)' : 'translateX(0)'),
        transition: isTransitioning ? 'transform 0.3s ease-in-out' : 'none'
      }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => navigate('/videos')} style={{ cursor: 'pointer' }}>← Back to Videos</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => hasPrevious && navigateWithTransition(previousVideo.id, 'prev')} 
              disabled={!hasPrevious}
              style={{ cursor: hasPrevious ? 'pointer' : 'not-allowed', opacity: hasPrevious ? 1 : 0.5 }}
            >
              ← Previous
            </button>
            <button 
              onClick={() => hasNext && navigateWithTransition(nextVideo.id, 'next')} 
              disabled={!hasNext}
              style={{ cursor: hasNext ? 'pointer' : 'not-allowed', opacity: hasNext ? 1 : 0.5 }}
            >
              Next →
            </button>
          </div>
        </div>

      {/* YouTube: Standard iframe */}
      {(video.youtube_url?.includes('youtube.com') || video.youtube_url?.includes('youtu.be') || video.youtubeId) && (
        <div style={{position:'relative',paddingTop:'56.25%', marginBottom: 30}}>
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeId || video.youtube_url || "")}
            title={video.title}
            style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* TikTok: Embedded video using oEmbed HTML */}
      {(video.youtube_url?.includes('tiktok.com') || video.youtube_url?.includes('vt.tiktok.com')) && (
        <>
          {tiktokEmbed && (
            <div style={{display:'flex', justifyContent:'center', marginBottom: 30}}>
              <div dangerouslySetInnerHTML={{ __html: tiktokEmbed.html }} />
            </div>
          )}
          {!tiktokEmbed && !embedLoading && (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginBottom: 30, padding:20, backgroundColor:'var(--bg-secondary)', borderRadius:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{marginBottom:12}}>🎵 Unable to embed TikTok video</div>
                <a href={video.youtube_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Watch on TikTok
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {/* Facebook: Embedded video using oEmbed HTML */}
      {video.youtube_url?.includes('facebook.com') && (
        <>
          {facebookEmbed && (
            <div style={{display:'flex', justifyContent:'center', marginBottom: 30}}>
              <div id="fb-root"></div>
              <div dangerouslySetInnerHTML={{ __html: facebookEmbed.html }} />
            </div>
          )}
          {!facebookEmbed && !embedLoading && (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginBottom: 30, padding:20, backgroundColor:'var(--bg-secondary)', borderRadius:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{marginBottom:12}}>👍 Unable to embed Facebook video</div>
                <a href={video.youtube_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Watch on Facebook
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {/* Portrait layout for short videos (as fallback) */}
      {video.video_type === 'short' && !video.youtube_url?.includes('tiktok.com') && !video.youtube_url?.includes('vt.tiktok.com') && !video.youtube_url?.includes('facebook.com') && (
        <div style={{position:'relative', paddingTop:'177.78%', marginBottom: 30, maxWidth: 350, margin: '0 auto 30px'}}>
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeId || video.youtube_url || "")}
            title={video.title}
            style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Reflections</h3>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {reflectionsFor(id).length === 0 && <div style={{ color: 'var(--muted)' }}>No reflections yet. Be the first to share.</div>}
          {reflectionsFor(id).map(r => {
            const name = r.is_anonymous ? "Anonymous" : (r.sender_name || r.name || "Guest");
            const body = r.message || r.body || "";
            const date = formatDateTime(r.created_at || r.date);
            return (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{date}</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>{body}</div>
            </div>
          )})}
        </div>

          {!showReflectionForm && <div style={{ marginTop: 10 }}><button className="btn-primary" onClick={() => setShowReflectionForm(true)}>Leave a Reflection</button></div>}

          {showReflectionForm && (
            <form onSubmit={(e) => { e.preventDefault(); addReflection(id, reflectionForm); }} style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              <label>Name (optional)<input value={reflectionForm.name} onChange={(e) => setReflectionForm(f => ({ ...f, name: e.target.value }))} /></label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={reflectionForm.anonymous} onChange={(e) => setReflectionForm(f => ({ ...f, anonymous: e.target.checked }))} /> Send anonymously</label>
              <label>Reflection<textarea value={reflectionForm.message} onChange={(e) => setReflectionForm(f => ({ ...f, message: e.target.value }))} required /></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary">Submit</button>
                <button type="button" onClick={() => setShowReflectionForm(false)} style={{ padding: '10px 12px', borderRadius: 8 }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
