import { useDashboardContext } from "../Dashboard";
import { formatDateTime, trimToWords } from "../../lib/format";
import { useMemo, useState } from "react";

export default function DashboardComments() {
  const { comments = [], toggleApproveComment, removeComment, markCommentRead, poems = [], videos = [] } = useDashboardContext();
  const [view, setView] = useState('new'); // 'new' or 'read'

  const newComments = useMemo(() => (comments || []).filter(c => !c.is_read), [comments]);
  const readComments = useMemo(() => (comments || []).filter(c => c.is_read), [comments]);

  const list = view === 'new' ? newComments : readComments;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setView('new')} style={{ fontWeight: view === 'new' ? '700' : '400' }}>New Comments ({newComments.length})</button>
        <button onClick={() => setView('read')} style={{ fontWeight: view === 'read' ? '700' : '400' }}>Read Comments ({readComments.length})</button>
      </div>

      {list.length === 0 ? <div style={{ color: 'var(--muted)' }}>No comments in this view.</div> : (
        list.map(c => {
          const name = c.is_anonymous ? "Anonymous" : (c.sender_name || c.name || "Anonymous");
          const body = c.message || c.body || "";
          const date = formatDateTime(c.created_at || c.date);
          const approved = c.is_approved === true || c.approved === true;
          const contentType = c.content_type || 'comment';
          const contentLabel = contentType === 'poem' ? '📝 Poem' : contentType === 'video' ? '🎥 Video' : 'Comment';
          // Resolve title from related collections when available
          let relatedTitle = '';
          if (contentType === 'poem') {
            const p = (poems || []).find(x => String(x.id) === String(c.content_id));
            relatedTitle = p ? trimToWords(p.title) : '';
          } else if (contentType === 'video') {
            const v = (videos || []).find(x => String(x.id) === String(c.content_id));
            relatedTitle = v ? trimToWords(v.title) : '';
          }
          const contentMeta = relatedTitle ? `${contentLabel} — ${relatedTitle}` : contentLabel;
          return (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <strong>{name}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>
                    {contentMeta} • {date}
                  </div>
                </div>
                {!approved && <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 'bold' }}>Pending</span>}
              </div>
              <div style={{ marginTop: 8 }}>{body}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                {!approved
                  ? <button onClick={() => toggleApproveComment(c.id, false)}>Approve</button>
                  : <button onClick={() => toggleApproveComment(c.id, true)}>Disapprove</button>
                }
                {!c.is_read && <button onClick={() => markCommentRead(c.id)}>Mark read</button>}
                {view === 'read' && (
                  <button onClick={() => removeComment(c.id)}>Delete</button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
