import { useSupabaseQuery } from "../lib/db";
import PoemCard from "../components/PoemCard";
import Loader from "../components/Loader";

export default function Poems() {
  const { data: poems = [], loading } = useSupabaseQuery('poems');

  return (
    <div className="page">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
      </header>

      {loading && <Loader message="Loading poems..." />}

      <section style={{ marginTop: 12, display: 'grid', gap: 12 }}>
        {(!poems || poems.length === 0) && !loading && <div style={{ color: 'var(--muted)' }}>No poems yet.</div>}
        {(poems || []).map((p) => (
          <PoemCard key={p.id} poem={p} />
        ))}
      </section>
    </div>
  );
}
