import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSupabaseQuery, insertRecord } from "../lib/db";
import {
  formatDate,
  formatDateTime,
  pickDateField,
  trimToWords,
} from "../lib/format";

export default function PoemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: poemsData = [], loading: loadingPoems } =
    useSupabaseQuery("poems");
  const { data: comments = [], refetch: refetchComments } =
    useSupabaseQuery("comments");

  const poem =
    (poemsData || []).find((p) => String(p.id) === String(id)) || null;
  const currentIndex = (poemsData || []).findIndex(
    (p) => String(p.id) === String(id),
  );
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < (poemsData || []).length - 1;
  const previousPoem = hasPrevious ? poemsData[currentIndex - 1] : null;
  const nextPoem = hasNext ? poemsData[currentIndex + 1] : null;

  console.debug("PoemPage debug:", {
    id,
    poemsDataLength: (poemsData || []).length,
    found: !!poem,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ body: "" });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(true);
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
      if (Math.abs(distance) > 50) {
        // Swipe threshold
        if (distance > 0 && hasNext) {
          navigateWithTransition(nextPoem.id, "next");
        } else if (distance < 0 && hasPrevious) {
          navigateWithTransition(previousPoem.id, "prev");
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
        (r.is_approved === true || r.approved === true),
    );

  const addReflection = async (poemId, payload) => {
    const result = await insertRecord("comments", {
      content_type: "poem",
      content_id: poemId,
      sender_name: null,
      is_anonymous: true,
      message: payload.body,
      is_approved: false,
      created_at: new Date().toISOString(),
    });
    if (result.success) {
      refetchComments();
      setForm({ body: "" });
      setShowForm(false);
    }
  };

  if (!id) {
    navigate("/poems");
    return null;
  }

  if (!poem)
    return (
      <div className="page">
        <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
          ← Back
        </button>
        <div style={{ color: "var(--muted)" }}>Poem not found.</div>
        <div style={{ marginTop: 12 }}>
          <h4>Available poems</h4>
          <div style={{ display: "grid", gap: 8 }}>
            {(poemsData || []).map((p) => (
              <Link
                key={p.id}
                to={`/poems/${p.id}`}
                style={{ textDecoration: "none" }}
                className="list-card"
              >
                <div className="meta">
                  <h4 style={{ margin: 0 }}>{trimToWords(p.title)}</h4>
                  <div style={{ color: "var(--muted)" }}>{p.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="page" style={{ overflow: "hidden" }}>
      <div
        style={{
          transform:
            transitionDirection === "next"
              ? "translateX(-100%)"
              : transitionDirection === "prev"
                ? "translateX(100%)"
                : "translateX(0)",
          transition: isTransitioning ? "transform 0.3s ease-in-out" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <button onClick={() => navigate(-1)}>← Back</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() =>
                hasPrevious && navigateWithTransition(previousPoem.id, "prev")
              }
              disabled={!hasPrevious}
              style={{
                cursor: hasPrevious ? "pointer" : "not-allowed",
                opacity: hasPrevious ? 1 : 0.5,
              }}
            >
              ← Previous
            </button>
            <button
              onClick={() =>
                hasNext && navigateWithTransition(nextPoem.id, "next")
              }
              disabled={!hasNext}
              style={{
                cursor: hasNext ? "pointer" : "not-allowed",
                opacity: hasNext ? 1 : 0.5,
              }}
            >
              Next →
            </button>
          </div>
        </div>

        <section style={{ marginTop: 12 }}>
          {poem.image && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={poem.image}
                alt={poem.title}
                style={{
                  width: "100%",
                  maxWidth: 600,
                  height: "auto",
                  borderRadius: 8,
                  display: "block",
                  marginBottom: 12,
                }}
              />
            </div>
          )}
          <div style={{ whiteSpace: "pre-wrap" }}>{poem.body}</div>
          <div style={{ marginTop: 8, color: "var(--muted)" }}>
            {formatDate(pickDateField(poem))}
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <h3>Comments</h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => {
                setLiked(!liked);
                setLikes(liked ? likes - 1 : likes + 1);
              }}
              style={{
                background: liked ? "var(--accent)" : "#f0f0f0",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: liked ? "white" : "var(--text)",
                fontSize: "14px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M235.5 102.8C256.3 68 300.5 54 338 71.6L345.2 75.4C380 96.3 394 140.5 376.4 178L376.4 178L362.3 208L472 208L479.4 208.4C515.7 212.1 544 242.8 544 280C544 293.2 540.4 305.4 534.2 316C540.3 326.6 543.9 338.8 544 352C544 370.3 537.1 386.8 526 399.5C527.3 404.8 528 410.3 528 416C528 441.1 515.1 463 495.8 475.9C493.9 511.4 466.4 540.1 431.4 543.6L424 544L319.9 544C301.9 544 284 540.6 267.3 534.1L260.2 531.1L259.5 530.8L252.9 527.6L252.2 527.3L240 520.8C227.7 514.3 216.7 506.1 207.1 496.7C203 523.6 179.8 544.1 151.8 544.1L119.8 544.1C88.9 544.1 63.8 519 63.8 488.1L64 264C64 233.1 89.1 208 120 208L152 208C162.8 208 172.9 211.1 181.5 216.5L231.6 110L232.2 108.8L234.9 103.8L235.5 102.9zM120 256C115.6 256 112 259.6 112 264L112 488C112 492.4 115.6 496 120 496L152 496C156.4 496 160 492.4 160 488L160 264C160 259.6 156.4 256 152 256L120 256zM317.6 115C302.8 108.1 285.3 113.4 276.9 127L274.7 131L217.9 251.9C214.4 259.4 212.4 267.4 211.9 275.6L211.8 279.8L211.8 392.7L212 400.6C214.4 433.3 233.4 462.7 262.7 478.3L274.2 484.4L280.5 487.5C292.9 493.1 306.3 496 319.9 496L424 496L426.4 495.9C438.5 494.7 448 484.4 448 472L447.8 469.4C447.7 468.5 447.6 467.7 447.4 466.8C444.7 454.7 451.7 442.6 463.4 438.8C473.1 435.7 480 426.6 480 416C480 411.7 478.9 407.8 476.9 404.2C470.6 393.1 474.1 379 484.9 372.2C491.7 367.9 496.1 360.4 496.1 352C496.1 344.9 493 338.5 487.9 334C482.7 329.4 479.7 322.9 479.7 316C479.7 309.1 482.7 302.6 487.9 298C493 293.5 496.1 287.1 496.1 280L496 277.6C494.9 266.3 485.9 257.3 474.6 256.2L472.2 256.1L324.7 256.1C316.5 256.1 308.9 251.9 304.5 245C300.1 238.1 299.5 229.3 303 221.9L333 157.6C340 142.6 334.4 124.9 320.5 116.6L317.6 115z" />
              </svg>
              {likes}
            </button>
            <button
              onClick={() => {
                setShowComments(!showComments);
                setShowForm(!showForm);
              }}
              style={{
                background: "#f0f0f0",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--text)",
                fontSize: "14px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M115.9 448.9C83.3 408.6 64 358.4 64 304C64 171.5 178.6 64 320 64C461.4 64 576 171.5 576 304C576 436.5 461.4 544 320 544C283.5 544 248.8 536.8 217.4 524L101 573.9C97.3 575.5 93.5 576 89.5 576C75.4 576 64 564.6 64 550.5C64 546.2 65.1 542 67.1 538.3L115.9 448.9zM153.2 418.7C165.4 433.8 167.3 454.8 158 471.9L140 505L198.5 479.9C210.3 474.8 223.7 474.7 235.6 479.6C261.3 490.1 289.8 496 319.9 496C437.7 496 527.9 407.2 527.9 304C527.9 200.8 437.8 112 320 112C202.2 112 112 200.8 112 304C112 346.8 127.1 386.4 153.2 418.7z" />
              </svg>
              {reflectionsFor(id).length}
            </button>
            <Link
              to="/invite"
              style={{
                background: "#f0f0f0",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "20px",
                textDecoration: "none",
                color: "var(--text)",
                display: "inline-block",
                fontSize: "14px",
              }}
            >
              Invite
            </Link>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {reflectionsFor(id).length === 0 && (
              <div style={{ color: "var(--muted)" }}>
                No comments yet. Be the first to share.
              </div>
            )}
            {reflectionsFor(id).length > 0 && !showComments && (
              <div>
                {(() => {
                  const latest =
                    reflectionsFor(id)[reflectionsFor(id).length - 1];
                  const name = latest.is_anonymous
                    ? "Anonymous"
                    : latest.sender_name || latest.name || "Guest";
                  const body = latest.message || latest.body || "";
                  const date = formatDateTime(latest.created_at || latest.date);
                  return (
                    <div key={latest.id} className="card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>{name}</strong>
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>
                            {date}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>{body}</div>
                    </div>
                  );
                })()}
              </div>
            )}
            {showComments &&
              reflectionsFor(id)
                .filter(
                  (r) =>
                    r.id !==
                    reflectionsFor(id)[reflectionsFor(id).length - 1].id,
                )
                .map((r) => {
                  const name = r.is_anonymous
                    ? "Anonymous"
                    : r.sender_name || r.name || "Guest";
                  const body = r.message || r.body || "";
                  const date = formatDateTime(r.created_at || r.date);
                  return (
                    <div key={r.id} className="card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <strong>{name}</strong>
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>
                            {date}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>{body}</div>
                    </div>
                  );
                })}

            {showForm && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addReflection(id, form);
                }}
                style={{ marginTop: 10, display: "grid", gap: 8 }}
              >
                <label>
                  Comment
                  <textarea
                    value={form.body}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, body: e.target.value }))
                    }
                  />
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="btn-primary">
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ padding: "10px 12px", borderRadius: 8 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
