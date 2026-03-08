import { useState, useEffect } from "react";
import { read, write } from "../lib/storage";

export default function Brand() {
  const [profile, setProfile] = useState(() => read('flp_profile', null));
  const [animate, setAnimate] = useState(() => read('flp_animate', false));

  useEffect(() => setProfile(read('flp_profile', null)), []);

  const upload = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      write('flp_profile', r.result);
      setProfile(r.result);
    };
    r.readAsDataURL(file);
  };

  const save = () => {
    write('flp_animate', !!animate);
    alert('Brand saved locally.');
  };

  return (
    <div className="page">
      

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: 160, height: 160, borderRadius: 12, overflow: 'hidden' }}>
            <img src={profile || '/profile.svg'} alt="brand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <div>
          <label>Upload New Image</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" id="animate" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
          <label htmlFor="animate">Animate Identity</label>
        </div>

        <div>
          <button className="btn-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
