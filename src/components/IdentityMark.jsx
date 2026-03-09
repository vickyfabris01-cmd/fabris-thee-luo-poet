import { useState, useEffect } from "react";
import { getActiveProfilePhoto } from "../lib/db";
import { useAuth } from "../context/AuthProvider";

export default function IdentityMark() {
  const fallback = "/profile.jpeg";
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    const fetchActivePhoto = async () => {
      if (user?.id) {
        const photo = await getActiveProfilePhoto(user.id);
        setActivePhoto(photo);
      }
    };
    fetchActivePhoto();
  }, [user?.id]);

  const imageUrl = activePhoto?.image_url || fallback;
  const isFallback = imageUrl === fallback;

  return (
    <div className="identity-mark">
      <div
        className={`crop ${isFallback ? "crop--avatar" : "crop--uploaded"}`}
        aria-hidden
      >
        <img
          src={imageUrl}
          alt={isFallback ? "avatar" : "profile image"}
          className={`identity-img ${isFallback ? "is-avatar" : "is-uploaded"}`}
          onError={(e) => {
            e.target.src = fallback;
          }}
        />
      </div>
    </div>
  );
}
