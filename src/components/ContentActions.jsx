import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function ContentActions({
  contentType,
  contentId,
  initialLikes = 0,
  commentCount = 0,
  onLike,
  onToggleComments,
  showComments = false,
}) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);

  // Update likes when initialLikes prop changes
  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  const handleLike = () => {
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1;
    setLiked(newLiked);
    setLikes(newLikes);
    if (onLike) {
      onLike(newLiked, newLikes);
    }
  };

  const handleCommentToggle = () => {
    if (onToggleComments) {
      onToggleComments(!showComments);
    }
  };

  return (
    <>
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
          onClick={handleLike}
          style={{
            background: liked ? "var(--accent)" : "var(--bg-secondary)",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: liked ? "white" : "var(--text)",
            fontSize: "11px",
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
          onClick={handleCommentToggle}
          style={{
            background: "var(--bg-secondary)",
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
          {commentCount}
        </button>

        <Link
          to="/invite"
          style={{
            background: "var(--bg-secondary)",
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

      <h3>Comments</h3>
    </>
  );
}
