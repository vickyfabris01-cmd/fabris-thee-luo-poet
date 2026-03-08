import { useSupabaseQuery } from "../lib/db";

export default function IdentityMark() {
  const fallback = "/profile.svg";
  const { data: profiles = [] } = useSupabaseQuery('profiles');
  const profile = profiles?.[0];
  
  // Get active photo from history, fallback to old profile_image field, then fallback to default
  const photoHistory = profile?.photo_history || [];
  const activePhoto = photoHistory.find(p => p.is_active);
  const imageUrl = activePhoto?.url || profile?.profile_image || fallback;

  const isFallback = imageUrl === fallback;

  return (
    <div className="identity-mark">
      <div className={`crop ${isFallback ? 'crop--avatar' : 'crop--uploaded'}`} aria-hidden>
        <img src={imageUrl} alt={isFallback ? 'avatar' : 'profile image'} className={`identity-img ${isFallback ? 'is-avatar' : 'is-uploaded'}`} onError={(e) => { e.target.src = fallback; }} />
      </div>
    </div>
  );
}
