import { Link } from "react-router-dom";
import { useDashboardContext } from "../Dashboard";
import { formatDate, pickDateField, trimToWords } from "../../lib/format";

export default function DashboardOverview() {
  const {
    counts,
    poems = [],
    videos = [],
    comments = [],
    invites = [],
  } = useDashboardContext();

  // Ensure counts has defaults
  const safeCount = {
    poems: poems?.length || 0,
    videos: videos?.length || 0,
    comments: comments?.length || 0,
    invites: invites?.length || 0,
    ...counts,
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        <div className="card" style={{ textAlign: "center", padding: 16 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 4,
              color: "var(--accent)",
            }}
          >
            {safeCount.poems}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Poems</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 16 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 4,
              color: "var(--accent)",
            }}
          >
            {safeCount.videos}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Videos</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 16 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 4,
              color: "var(--accent)",
            }}
          >
            {(comments || []).length}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Comments</div>
          <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 6 }}>
            {(comments || []).filter((c) => !c.is_read).length} new
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 16 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 4,
              color: "var(--accent)",
            }}
          >
            {(invites || []).length}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Invites</div>
          <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 6 }}>
            {(invites || []).filter((i) => !i.is_read).length} new
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div>
        <h3>Recent Poems</h3>
        {!poems || poems.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            No poems yet.{" "}
            <Link to="/dashboard/poems" style={{ color: "var(--accent)" }}>
              Create one
            </Link>
            .
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {poems.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{trimToWords(p.title)}</strong>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {formatDate(pickDateField(p))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3>Recent Videos</h3>
        {!videos || videos.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            No videos yet.{" "}
            <Link to="/dashboard/videos" style={{ color: "var(--accent)" }}>
              Upload one
            </Link>
            .
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {videos.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{trimToWords(v.title)}</strong>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {formatDate(pickDateField(v))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Actions */}
      {((comments &&
        comments.filter((c) => !(c.is_approved === true || c.approved === true))
          .length > 0) ||
        (invites || []).filter((i) => !i.is_read).length > 0) && (
        <div>
          <h3>Pending Actions</h3>
          {comments &&
            comments.filter(
              (c) => !(c.is_approved === true || c.approved === true),
            ).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong style={{ color: "var(--accent)" }}>
                  Unapproved Comments (
                  {
                    comments.filter(
                      (c) => !(c.is_approved === true || c.approved === true),
                    ).length
                  }
                  )
                </strong>
                <div style={{ marginTop: 8, color: "var(--muted)" }}>
                  <Link
                    to="/dashboard/comments"
                    style={{ color: "var(--accent)" }}
                  >
                    Review & approve
                  </Link>
                </div>
              </div>
            )}
          {(invites || []).filter((i) => !i.is_read).length > 0 && (
            <div>
              <strong style={{ color: "var(--accent)" }}>
                New Invites ({(invites || []).filter((i) => !i.is_read).length})
              </strong>
              <div style={{ marginTop: 8, color: "var(--muted)" }}>
                <Link
                  to="/dashboard/invites"
                  style={{ color: "var(--accent)" }}
                >
                  View & respond
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
