import { useState } from "react";
import { sendInvite, validateInvite } from "../lib/invites";

export default function Invite(){
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate input
    const validation = validateInvite({ sender_name: name, is_anonymous: anonymous, message });
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setLoading(true);

    try {
      const result = await sendInvite({
        sender_name: anonymous ? "anonymous" : name,
        is_anonymous: anonymous,
        message: message,
      });

      if (result.success) {
        setSent(true);
        setName("");
        setMessage("");
        setAnonymous(false);
        setTimeout(() => setSent(false), 2500);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      
      <form onSubmit={handleSubmit} style={{marginTop:12, display:'grid', gap:8}}>
        <label>
          Name (optional)
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" disabled={loading || anonymous} />
        </label>
        <label style={{display:'flex',gap:8,alignItems:'center'}}>
          <input type="checkbox" checked={anonymous} onChange={(e)=>setAnonymous(e.target.checked)} disabled={loading} /> Anonymous
        </label>
        <label>
          Message
          <textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Write a short message" rows={4} disabled={loading} />
        </label>
        <div style={{display:'flex',gap:8}}>
          <button type="submit" className="btn-primary" disabled={loading || !message.trim()}>
            {loading ? "Sending..." : "Send Invite"}
          </button>
          <button type="button" onClick={()=>{ window.location.href = 'mailto:vickyfabris01@gmail.com'; }} style={{padding:'10px 12px', borderRadius:8}}>Email Me</button>
          <button type="button" onClick={()=>{ window.location.href = 'tel:+2540742518050'; }} style={{padding:'10px 12px', borderRadius:8}}>Call Me</button>
        </div>
        {error && <div style={{color:'var(--accent)'}}>{error}</div>}
        {sent && <div style={{color:'var(--accent)'}}>Invite sent successfully!</div>}
      </form>
    </div>
  );
}
