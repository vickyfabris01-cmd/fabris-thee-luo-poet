import { useState, useEffect } from "react";
import { getActiveProfilePhoto, syncProfilePhotosFromHistory } from "../lib/db";
import { useAuth } from "../context/AuthProvider";

export default function IdentityMark() {
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const fetchActivePhoto = async () => {
      if (user?.id) {
        // Sync any existing photos first
        await syncProfilePhotosFromHistory(user.id);

        const photo = await getActiveProfilePhoto(user.id);
        setActivePhoto(photo);
      }
    };
    fetchActivePhoto();
  }, [user?.id]);

  // Only render if there's an active photo from the database
  if (!activePhoto?.image_url) {
    return null;
  }

  return (
    <div className="identity-mark">
      <div className="crop crop--uploaded" aria-hidden>
        <img
          src={activePhoto.image_url}
          alt="profile image"
          className="identity-img is-uploaded"
          onError={(e) => {
            // Hide the image if it fails to load
            e.target.style.display = "none";
          }}
        />
      </div>
    </div>
  );
}
