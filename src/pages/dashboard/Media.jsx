import { useState, useEffect } from "react";
import { useDashboardContext } from "../Dashboard";
import { uploadFile } from "../../lib/supabaseStorage";
import { insertRecord, updateRecord } from "../../lib/db";
import { useToast } from "../../context/ToastProvider";
import { trimToWords } from "../../lib/format";

export default function DashboardMedia() {
  const ctx = useDashboardContext();
  const { poems = [], videos = [], profiles = [] } = ctx;
  const [tab, setTab] = useState('posts'); // 'posts', 'videos', 'profile'

  const profile = profiles?.[0];
  // Handle both old format (profile_image string) and new format (photo_history array)
  let photoHistory = profile?.photo_history || [];
  
  // If photo_history is empty but profile_image exists, convert it to new format
  if (photoHistory.length === 0 && profile?.profile_image) {
    photoHistory = [{
      url: profile.profile_image,
      uploaded_at: profile.updated_at || profile.created_at,
      is_active: true
    }];
  }
  const activePhoto = photoHistory.find(p => p.is_active);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <ProfilePhotos />

      <div>
        <h3>Content Library</h3>
        
        {/* Mini Nav */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <button 
            onClick={() => setTab('posts')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 6, 
              border: 'none',
              background: tab === 'posts' ? 'var(--accent)' : 'transparent',
              color: tab === 'posts' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: tab === 'posts' ? 'bold' : 'normal'
            }}
          >
            📝 Posts ({poems.length})
          </button>
          <button 
            onClick={() => setTab('videos')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 6, 
              border: 'none',
              background: tab === 'videos' ? 'var(--accent)' : 'transparent',
              color: tab === 'videos' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: tab === 'videos' ? 'bold' : 'normal'
            }}
          >
            🎬 Videos ({videos.length})
          </button>
          <button 
            onClick={() => setTab('profile')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 6, 
              border: 'none',
              background: tab === 'profile' ? 'var(--accent)' : 'transparent',
              color: tab === 'profile' ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: tab === 'profile' ? 'bold' : 'normal'
            }}
          >
            🖼️ Images ({photoHistory.length})
          </button>
        </div>

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {poems.length === 0 ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
                No poems yet. Create some in the Poems section!
              </div>
            ) : (
              poems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(poem => (
                <div key={poem.id} className="card" style={{ padding: 12 }}>
                  <strong style={{ fontSize: '1rem' }}>{trimToWords(poem.title, 4)}</strong>
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(poem.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        )}

        {/* Videos Tab */}
        {tab === 'videos' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {videos.length === 0 ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
                No videos yet. Add some in the Videos section!
              </div>
            ) : (
              videos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(video => (
                <div key={video.id} className="card" style={{ padding: 12 }}>
                  <strong style={{ fontSize: '1rem' }}>{trimToWords(video.title, 4)}</strong>
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: 4 }}>
                    {new Date(video.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Images Tab */}
        {tab === 'profile' && (
          photoHistory.length === 0 ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 20 }}>
              No profile images uploaded yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {photoHistory.map((photo, idx) => (
                <div key={idx} style={{ 
                  position: 'relative',
                  paddingBottom: '100%',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  border: photo.is_active ? '3px solid var(--accent)' : '1px solid var(--border)'
                }}>
                  <img 
                    src={photo.url} 
                    alt="profile" 
                    style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => { e.target.src = '/MyLogo.png'; }}
                  />
                  {photo.is_active && (
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      background: 'rgba(0,0,0,0.6)', 
                      color: 'var(--accent)',
                      padding: 4,
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      ✓ Active
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ProfilePhotos() {
  const { profiles = [], refetchProfiles } = useDashboardContext();
  const { addToast } = useToast();
  const profile = profiles?.[0];
  const [uploading, setUploading] = useState(false);
  const [photoHistory, setPhotoHistory] = useState(profile?.photo_history || []);

  // Sync photoHistory when profile data changes
  useEffect(() => {
    let history = profile?.photo_history || [];
    
    // If no photo_history but profile_image exists, convert it
    if (history.length === 0 && profile?.profile_image) {
      history = [{
        url: profile.profile_image,
        uploaded_at: profile.updated_at || profile.created_at,
        is_active: true
      }];
    }
    
    setPhotoHistory(history);
  }, [profile?.photo_history, profile?.profile_image]);


  const handleUploadProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to storage
      const uploadRes = await uploadFile(file, 'media', 'profile-photos');
      if (!uploadRes.success) {
        addToast('Failed to upload profile photo: ' + uploadRes.error, 'error');
        setUploading(false);
        return;
      }

      const newPhotoUrl = uploadRes.url;
      const timestamp = new Date().toISOString();

      // Add to history array
      const updatedHistory = [
        { url: newPhotoUrl, uploaded_at: timestamp, is_active: true },
        ...photoHistory.map(p => ({ ...p, is_active: false }))
      ];

      // Update profile with new photo history
      if (profile?.id) {
        const result = await updateRecord('profiles', profile.id, {
          photo_history: updatedHistory,
          updated_at: timestamp
        });
        
        if (result.success) {
          setPhotoHistory(updatedHistory);
          addToast('Profile photo uploaded! (Old photos preserved)', 'success');
          e.target.value = '';
          setTimeout(() => refetchProfiles?.(), 300);
        } else {
          addToast('Error saving to database', 'error');
        }
      }
    } catch (err) {
      addToast('Error: ' + (err?.message || err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleActivatePhoto = async (photoUrl) => {
    if (!profile?.id) return;
    
    const updatedHistory = photoHistory.map(p => ({
      ...p,
      is_active: p.url === photoUrl
    }));

    try {
      const result = await updateRecord('profiles', profile.id, {
        photo_history: updatedHistory,
        updated_at: new Date().toISOString()
      });

      if (result.success) {
        setPhotoHistory(updatedHistory);
        addToast('Profile photo activated', 'success');
        setTimeout(() => refetchProfiles?.(), 300);
      } else {
        addToast('Error updating photo', 'error');
      }
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    }
  };

  const activePhoto = photoHistory.find(p => p.is_active);

  return (
    <div className="card">
      <h3>👤 Profile Photos</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 12 }}>Upload profile photos. New photos are automatically set as active. Older photos are preserved and can be reactivated anytime.</p>
      
      <form style={{ display: 'grid', gap: 8 }} onSubmit={e => e.preventDefault()}>
        <label style={{ display: 'block' }}>
          Upload new profile photo
          <input type="file" accept="image/*" onChange={handleUploadProfilePhoto} disabled={uploading} style={{ marginTop: 4 }} />
        </label>
        {uploading && <div style={{ color: 'var(--accent)' }}>⏳ Uploading...</div>}
      </form>

      {activePhoto && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: 8 }}>✓ Currently Active</h4>
          <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent)', marginBottom: 12 }}>
            <img src={activePhoto.url} alt="current profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/MyLogo.png'; console.error('Profile photo load error:', activePhoto.url); }} />
          </div>
          <small style={{ display: 'block', color: 'var(--muted)' }}>Uploaded: {new Date(activePhoto.uploaded_at).toLocaleDateString()}</small>
        </div>
      )}

      {photoHistory.length > 1 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: 12 }}>📸 Previous Versions ({photoHistory.length - 1})</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>Click any photo to activate it</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {photoHistory.map((photo, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  paddingBottom: '100%', 
                  position: 'relative', 
                  cursor: photo.is_active ? 'default' : 'pointer',
                  border: photo.is_active ? '3px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  transition: 'border-color 0.2s'
                }}>
                  <img 
                    src={photo.url} 
                    alt="history" 
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: photo.is_active ? 'default' : 'pointer' }}
                    onClick={() => !photo.is_active && handleActivatePhoto(photo.url)}
                    onError={(e) => { e.target.src = '/MyLogo.png'; }}
                    title={photo.is_active ? 'Currently active' : 'Click to activate'}
                  />
                </div>
                <small style={{ display: 'block', marginTop: 4, color: 'var(--muted)', fontSize: '0.7rem' }}>
                  {new Date(photo.uploaded_at).toLocaleDateString()}
                </small>
                {photo.is_active && <small style={{ display: 'block', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 'bold' }}>✓ Active</small>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
