import { useState } from "react";
import { Link } from "react-router-dom";
import { useSupabaseQuery } from "../lib/db";
import VideoCard from "../components/VideoCard";
import Loader from "../components/Loader";

export default function Videos(){
  const [filter, setFilter] = useState('all');
  const { data: videos = [], loading } = useSupabaseQuery('videos');

  const filtered = (videos || []).filter(v => {
    if (filter === 'all') return true;
    const type = v.video_type || v.type || 'long';
    return filter === type;
  });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Videos</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('long')} className={filter === 'long' ? 'active' : ''}>Long</button>
          <button onClick={() => setFilter('short')} className={filter === 'short' ? 'active' : ''}>Short</button>
        </div>
      </div>

      {loading && <Loader message="Loading videos..." />}

      <section style={{marginTop:12, display:'grid', gap:12}}>
        {!loading && filtered.length === 0 && <div style={{ color: 'var(--muted)' }}>No videos found.</div>}
        {filtered.map(v => (
          <Link key={v.id} to={`/videos/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <VideoCard video={v} onOpen={() => {}} />
          </Link>
        ))}
      </section>
    </div>
  );
}
