import { useState, useEffect } from "react";
import { useDashboardContext, formatDate } from "../Dashboard";
import { formatDate as formatDisplayDate, pickDateField, trimToWords } from "../../lib/format";

function PoemManager({ poems, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });

  useEffect(() => { if (editing) setForm(editing); else setForm({ title: '', body: '' }); }, [editing]);

  const save = (e) => { 
    e.preventDefault(); 
    if(editing){ 
      onUpdate(editing.id, form); 
      setEditing(null); 
    } else { 
      onAdd(form);
      setForm({ title: '', body: '' });
    } 
  };

  return (
    <div style={{ display:'grid', gap:12 }}>
      <form onSubmit={save} style={{ display:'grid', gap:8 }}>
        <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></label>
        <label>Body<textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} /></label>
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Poem</button>
          {editing && <button type="button" onClick={()=>setEditing(null)}>Cancel</button>}
        </div>
      </form>

      <div style={{ display:'grid', gap:8 }}>
        {poems.length === 0 ? <div style={{ color: 'var(--muted)' }}>No poems yet.</div> : poems.map(p => (
          <div key={p.id} className="card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <strong>{trimToWords(p.title)}</strong>
              <div style={{ color:'var(--muted)', fontSize: '0.85rem' }}>{formatDisplayDate(pickDateField(p))}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{ setEditing(p); }}>Edit</button>
              <button onClick={()=>onDelete(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPoems() {
  const { poems, addPoem, updatePoem, deletePoem } = useDashboardContext();
  return <PoemManager poems={poems} onAdd={addPoem} onUpdate={updatePoem} onDelete={deletePoem} />;
}
