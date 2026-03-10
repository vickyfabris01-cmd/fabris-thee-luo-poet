import { useState, useEffect } from "react";
import { getActiveProfilePhoto, syncProfilePhotosFromHistory } from "../lib/db";
import { useAuth } from "../context/AuthProvider";

export default function IdentityMark({ userId }) {
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(null);
  const [imageError, setImageError] = useState(false);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    const fetchActivePhoto = async () => {
      if (targetUserId) {
        // Sync any existing photos first
        await syncProfilePhotosFromHistory(targetUserId);

        const photo = await getActiveProfilePhoto(targetUserId);
        setActivePhoto(photo);
      }
    };
    fetchActivePhoto();
  }, [targetUserId]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="identity-mark">
      <div className="crop crop--uploaded" aria-hidden>
        {activePhoto?.image_url && !imageError ? (
          <img
            src={activePhoto.image_url}
            alt="profile image"
            className="identity-img is-uploaded"
            onError={handleImageError}
          />
        ) : (
          <img
            src="/profile.svg"
            alt="profile placeholder"
            className="identity-img is-placeholder"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
