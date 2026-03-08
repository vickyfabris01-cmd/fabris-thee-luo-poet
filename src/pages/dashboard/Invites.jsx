import { useDashboardContext } from "../Dashboard";
import { deleteRecord, updateRecord } from "../../lib/db";
import { useState, useMemo } from "react";

export default function DashboardInvites() {
  const { invites, refetchInvites } = useDashboardContext();
  const [tab, setTab] = useState('new'); // 'new' or 'previous'

  const handleMarkAsRead = async (id) => {
    try {
      const res = await updateRecord('invites', id, { is_read: true });
      if (!res || !res.success) {
        throw new Error(res?.error || 'Failed to mark as read');
      }
      await refetchInvites();
    } catch (err) {
      alert('Error marking invite as read: ' + (err?.message || err));
    }
  };

  const handleDeleteInvite = async (id) => {
    if (confirm('Delete this invite?')) {
      try {
        const res = await deleteRecord('invites', id);
        if (res && res.success === false) {
          throw new Error(res.error || 'Failed to delete');
        }
        await refetchInvites();
      } catch (err) {
        alert('Error deleting invite: ' + err.message);
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('Delete ALL invites? This cannot be undone.')) {
      try {
        // Delete each invite individually
        for (const invite of invites) {
          await deleteRecord('invites', invite.id);
        }
        await refetchInvites();
      } catch (err) {
        alert('Error clearing invites: ' + err.message);
      }
    }
  };

  const newInvites = useMemo(() => (invites || []).filter(i => !i.is_read), [invites]);
  const previousInvites = useMemo(() => (invites || []).filter(i => i.is_read), [invites]);

  const displayed = tab === 'new' ? newInvites : previousInvites;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setTab('new')} style={{ padding: '6px 10px', borderRadius: 6, border: tab === 'new' ? '2px solid var(--accent)' : '1px solid var(--border)', background: tab === 'new' ? 'var(--surface)' : 'transparent' }}>
            New ({newInvites.length})
          </button>
          <button onClick={() => setTab('previous')} style={{ padding: '6px 10px', borderRadius: 6, border: tab === 'previous' ? '2px solid var(--accent)' : '1px solid var(--border)', background: tab === 'previous' ? 'var(--surface)' : 'transparent' }}>
            Previous ({previousInvites.length})
          </button>
        </div>
        <div>
          <button onClick={handleClearAll} disabled={invites.length === 0}>Clear All</button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div style={{ color: 'var(--muted)' }}>{tab === 'new' ? 'No new invites.' : 'No previous invites.'}</div>
      ) : (
        displayed.map(i => (
          <div key={i.id} className="card" style={{ opacity: i.is_read ? 0.8 : 1, borderLeft: i.is_read ? 'none' : '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <strong>{i.sender_name ?? 'Anonymous'}</strong>
                {!i.is_read && <span style={{ marginLeft: 8, color: 'var(--accent)', fontSize: '0.85em', fontWeight: 'bold' }}>NEW</span>}
                <small style={{ color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                  {new Date(i.created_at).toLocaleString()}
                </small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {tab === 'new' && !i.is_read && (
                  <button 
                    onClick={() => handleMarkAsRead(i.id)}
                    style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer', background: 'var(--accent)', color: 'var(--accent-foreground)', border: 'none', fontWeight: 'bold' }}
                  >
                    Mark Read
                  </button>
                )}

                {tab === 'previous' && (
                  <button 
                    onClick={() => handleDeleteInvite(i.id)}
                    style={{ padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginTop: 8 }}>{i.message}</div>
          </div>
        ))
      )}
    </div>
  );
}

