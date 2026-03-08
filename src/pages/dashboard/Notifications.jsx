import { useDashboardContext } from "../Dashboard";
import { formatDateTime, trimToWords } from "../../lib/format";
import { useMemo, useState } from "react";
import { updateRecord, deleteRecord } from "../../lib/db";

export default function DashboardNotifications() {
  const {
    comments = [],
    invites = [],
    poems = [],
    videos = [],
    toggleApproveComment,
    markCommentRead,
    refetchComments,
    refetchInvites,
  } = useDashboardContext();
  const [tab, setTab] = useState("all"); // 'all', 'comments', 'invites'

  // Filter unread items
  const unreadComments = useMemo(
    () => (comments || []).filter((c) => !c.is_read),
    [comments],
  );
  const unreadInvites = useMemo(
    () => (invites || []).filter((i) => !i.is_read),
    [invites],
  );

  // Combine all notifications
  const allNotifications = useMemo(() => {
    const items = [];

    // Add unread comments
    unreadComments.forEach((c) => {
      items.push({
        id: `comment-${c.id}`,
        type: "comment",
        data: c,
        timestamp: new Date(c.created_at || c.date).getTime(),
      });
    });

    // Add unread invites
    unreadInvites.forEach((i) => {
      items.push({
        id: `invite-${i.id}`,
        type: "invite",
        data: i,
        timestamp: new Date(i.created_at).getTime(),
      });
    });

    // Sort by timestamp (newest first)
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [unreadComments, unreadInvites]);

  const handleMarkCommentRead = async (id) => {
    try {
      const result = await updateRecord("comments", id, { is_read: true });
      if (result.success) {
        await refetchComments();
      }
    } catch (e) {
      console.error("Error marking comment read:", e);
    }
  };

  const handleMarkInviteRead = async (id) => {
    try {
      const res = await updateRecord("invites", id, { is_read: true });
      if (res && res.success) {
        await refetchInvites();
      }
    } catch (err) {
      console.error("Error marking invite as read:", err);
    }
  };

  const handleDeleteInvite = async (id) => {
    if (confirm("Delete this invite?")) {
      try {
        const res = await deleteRecord("invites", id);
        if (res && res.success !== false) {
          await refetchInvites();
        }
      } catch (err) {
        console.error("Error deleting invite:", err);
      }
    }
  };

  const displayedNotifications =
    tab === "all"
      ? allNotifications
      : tab === "comments"
        ? allNotifications.filter((n) => n.type === "comment")
        : allNotifications.filter((n) => n.type === "invite");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Tab filter */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => setTab("all")}
          style={{ fontWeight: tab === "all" ? "700" : "400" }}
        >
          All ({allNotifications.length})
        </button>
        <button
          onClick={() => setTab("comments")}
          style={{ fontWeight: tab === "comments" ? "700" : "400" }}
        >
          Comments ({unreadComments.length})
        </button>
        <button
          onClick={() => setTab("invites")}
          style={{ fontWeight: tab === "invites" ? "700" : "400" }}
        >
          Invites ({unreadInvites.length})
        </button>
      </div>

      {/* Notifications list */}
      {displayedNotifications.length === 0 ? (
        <div
          style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}
        >
          🎉 All caught up! No new notifications.
        </div>
      ) : (
        displayedNotifications.map((notification) => {
          if (notification.type === "comment") {
            const c = notification.data;
            const name = c.is_anonymous
              ? "Anonymous"
              : c.sender_name || c.name || "Anonymous";
            const body = c.message || c.body || "";
            const date = formatDateTime(c.created_at || c.date);
            const approved = c.is_approved === true || c.approved === true;
            const contentType = c.content_type || "comment";
            const contentLabel =
              contentType === "poem"
                ? "📝 Poem"
                : contentType === "video"
                  ? "🎥 Video"
                  : "Comment";

            let relatedTitle = "";
            if (contentType === "poem") {
              const p = (poems || []).find(
                (x) => String(x.id) === String(c.content_id),
              );
              relatedTitle = p ? trimToWords(p.title) : "";
            } else if (contentType === "video") {
              const v = (videos || []).find(
                (x) => String(x.id) === String(c.content_id),
              );
              relatedTitle = v ? trimToWords(v.title) : "";
            }
            const contentMeta = relatedTitle
              ? `${contentLabel} — ${relatedTitle}`
              : contentLabel;

            return (
              <div key={notification.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <strong>💬 {name}</strong>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {contentMeta} • {date}
                    </div>
                  </div>
                  {!approved && (
                    <span
                      style={{
                        color: "var(--accent)",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      Pending Approval
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 8, marginBottom: 8 }}>{body}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!approved && (
                    <button onClick={() => toggleApproveComment(c.id, false)}>
                      Approve
                    </button>
                  )}
                  <button onClick={() => handleMarkCommentRead(c.id)}>
                    Mark as Read
                  </button>
                </div>
              </div>
            );
          } else if (notification.type === "invite") {
            const i = notification.data;
            return (
              <div
                key={notification.id}
                className="card"
                style={{ borderLeft: "4px solid var(--accent)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>📩 {i.sender_name ?? "Anonymous"}</strong>
                    <small
                      style={{
                        color: "var(--muted)",
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      {new Date(i.created_at).toLocaleString()}
                    </small>
                    {i.message && (
                      <div style={{ marginTop: 8, color: "var(--text)" }}>
                        {i.message}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(i.id)}
                    style={{
                      marginLeft: 8,
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })
      )}
    </div>
  );
}
