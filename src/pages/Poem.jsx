import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSupabaseQuery, insertRecord } from "../lib/db";
import { formatDate, formatDateTime, pickDateField, trimToWords } from "../lib/format";

export default function PoemPage(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: poemsData = [], loading: loadingPoems } = useSupabaseQuery('poems');
  const { data: comments = [], refetch: refetchComments } = useSupabaseQuery('comments');
  
  const poem = (poemsData || []).find(p => String(p.id) === String(id)) || null;
  const currentIndex = (poemsData || []).findIndex(p => String(p.id) === String(id));
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < (poemsData || []).length - 1;
  const previousPoem = hasPrevious ? poemsData[currentIndex - 1] : null;
  const nextPoem = hasNext ? poemsData[currentIndex + 1] : null;

  console.debug('PoemPage debug:', { id, poemsDataLength: (poemsData || []).length, found: !!poem });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', anonymous: false, body: '' });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);

  // Reset transition state when id changes
  useEffect(() => {
    setIsTransitioning(false);
    setTransitionDirection(null);
  }, [id]);

  // Handle navigation with transition - navigate immediately
  const navigateWithTransition = (poemId, direction) => {
    setTransitionDirection(direction);
    setIsTransitioning(true);
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate(`/poems/${poemId}`);
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
          navigateWithTransition(nextPoem.id, 'next');
        } else if (distance < 0 && hasPrevious) {
          navigateWithTransition(previousPoem.id, 'prev');
        }
      }
    }
  };

  // If an id was provided but no poem found, redirect to the first available poem.
  useEffect(() => {
    if (id && !poem && Array.isArray(poemsData) && poemsData.length > 0) {
      navigate(`/poems/${poemsData[0].id}`, { replace: true });
    }
  }, [id, poem, poemsData, navigate]);

  const reflectionsFor = (poemId) =>
    (comments || []).filter(
      (r) =>
        String(r.content_id) === String(poemId) &&
        r.content_type === "poem" &&
        (r.is_approved === true || r.approved === true)
    );

  const addReflection = async (poemId, payload) => {
    const result = await insertRecord('comments', {
      content_type: 'poem',
      content_id: poemId,
      sender_name: payload.name || null,
      is_anonymous: payload.anonymous || false,
      message: payload.body,
      is_approved: false,
      created_at: new Date().toISOString(),
    });
    if (result.success) {
      refetchComments();
      setForm({ name: '', anonymous: false, body: '' });
      setShowForm(false);
    }
  };

  if (!id) { navigate('/poems'); return null; }

  if (!poem) return (
    <div className="page">
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Back</button>
      <div style={{ color: 'var(--muted)'}}>Poem not found.</div>
      <div style={{ marginTop: 12 }}>
        <h4>Available poems</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {(poemsData || []).map(p => (
            <Link key={p.id} to={`/poems/${p.id}`} style={{ textDecoration: 'none' }} className="list-card">
              <div className="meta">
                <h4 style={{ margin: 0 }}>{trimToWords(p.title)}</h4>
                <div style={{ color:'var(--muted)' }}>{p.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ overflow: 'hidden' }}>
      <div style={{ 
        transform: transitionDirection === 'next' ? 'translateX(-100%)' : (transitionDirection === 'prev' ? 'translateX(100%)' : 'translateX(0)'),
        transition: isTransitioning ? 'transform 0.3s ease-in-out' : 'none'
      }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => navigate(-1)}>← Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => hasPrevious && navigateWithTransition(previousPoem.id, 'prev')} 
              disabled={!hasPrevious}
              style={{ cursor: hasPrevious ? 'pointer' : 'not-allowed', opacity: hasPrevious ? 1 : 0.5 }}
            >
              ← Previous
            </button>
            <button 
              onClick={() => hasNext && navigateWithTransition(nextPoem.id, 'next')} 
              disabled={!hasNext}
              style={{ cursor: hasNext ? 'pointer' : 'not-allowed', opacity: hasNext ? 1 : 0.5 }}
            >
              Next →
            </button>
          </div>
        </div>

      <section style={{ marginTop: 12 }}>
        {poem.image && (
          <div style={{ marginBottom: 16 }}>
            <img src={poem.image} alt={poem.title} style={{ width: '100%', maxWidth: 600, height: 'auto', borderRadius: 8, display: 'block', marginBottom: 12 }} />
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{poem.body}</div>
        <div style={{ marginTop: 8, color: 'var(--muted)' }}>{formatDate(pickDateField(poem))}</div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Reflections</h3>
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

          {!showForm && <div style={{ marginTop: 10 }}><button className="btn-primary" onClick={() => setShowForm(true)}>Leave a Reflection</button></div>}

          {showForm && (
            <form onSubmit={(e) => { e.preventDefault(); addReflection(id, form); }} style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              <label>Name (optional)<input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={form.anonymous} onChange={(e) => setForm(f => ({ ...f, anonymous: e.target.checked }))} /> Send anonymously</label>
              <label>Reflection<textarea value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} /></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn-primary">Submit</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 12px', borderRadius: 8 }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}
