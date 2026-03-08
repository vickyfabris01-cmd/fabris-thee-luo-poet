import React from "react";
import { Link } from "react-router-dom";
import { formatDate, pickDateField, trimToWords } from "../lib/format";

export default function PoemCard({ poem, onOpen }) {
  const excerpt = poem.body.split("\n").slice(0, 2).join(" ");
  const displayDate = formatDate(pickDateField(poem));
  return (
    <article className="list-card">
      {poem.image && (
        <img src={poem.image} alt="" className="thumbnail" />
      )}
      <div className="meta">
        <h4 style={{ margin: 0 }}>{trimToWords(poem.title)}</h4>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>{excerpt}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <small style={{ color: 'var(--muted)' }}>{displayDate}</small>
          <Link to={`/poems/${poem.id}`} style={{ marginLeft: 'auto' }} className="btn-primary">Read</Link>
        </div>
      </div>
    </article>
  );
}
