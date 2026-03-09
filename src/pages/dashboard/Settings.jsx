import { useState, useEffect } from "react";
import { useDashboardContext } from "../Dashboard";
import ImageCropper from "../../components/ImageCropper";
import { uploadFile, deleteFile } from "../../lib/supabaseStorage";
import {
  updateRecord,
  insertRecord,
  deleteRecord,
  getActiveProfilePhoto,
} from "../../lib/db";
import { useToast } from "../../context/ToastProvider";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";

export default function DashboardSettings() {
  const { profiles = [], refetchProfiles } = useDashboardContext();
  const { user } = useAuth();
  const profile = profiles?.find((p) => p.auth_uid === user?.id) || {};
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoHistory, setPhotoHistory] = useState(
    profile?.photo_history || [],
  );
  const [activePhoto, setActivePhoto] = useState(null);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [croppedFile, setCroppedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // sync profile data
    let history = profile?.photo_history || [];
    if (history.length === 0 && profile?.profile_image) {
      history = [
        {
          url: profile.profile_image,
          uploaded_at: profile.updated_at || profile.created_at,
          is_active: true,
        },
      ];
    }
    setPhotoHistory(history);
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
  }, [
    profile?.photo_history,
    profile?.profile_image,
    profile?.display_name,
    profile?.bio,
  ]);

  // Fetch active profile photo
  useEffect(() => {
    const fetchActivePhoto = async () => {
      if (user?.id) {
        const photo = await getActiveProfilePhoto(user.id);
        setActivePhoto(photo);
      }
    };
    fetchActivePhoto();
  }, [user?.id]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile) => {
    setShowCropper(false);
    if (!croppedFile) return;
    setCroppedFile(croppedFile);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (!croppedFile) return;
    setUploading(true);
    setShowPreview(false);
    try {
      const uploadRes = await uploadFile(
        croppedFile,
        "media",
        "profile-photos",
      );
      if (!uploadRes.success)
        throw new Error(uploadRes.error || "Upload failed");

      const newUrl = uploadRes.url;
      const timestamp = new Date().toISOString();

      // Save to profile_photos table
      if (user?.id) {
        // Set all other photos to inactive
        const { data: existingPhotos } = await supabase
          .from("profile_photos")
          .select("id")
          .eq("user_id", user.id)
          .eq("active", true);

        if (existingPhotos && existingPhotos.length > 0) {
          for (const photo of existingPhotos) {
            await updateRecord("profile_photos", photo.id, { active: false });
          }
        }

        // Insert new photo as active
        const photoRes = await insertRecord("profile_photos", {
          user_id: user.id,
          image_url: newUrl,
          created_at: timestamp,
          active: true,
        });
        if (!photoRes.success) throw new Error("Failed to save profile photo");
      }

      // Build updated history for backward compatibility
      const updated = [
        { url: newUrl, uploaded_at: timestamp, is_active: true },
        ...photoHistory.map((p) => ({ ...p, is_active: false })),
      ];

      if (profile?.id) {
        const res = await updateRecord("profiles", profile.id, {
          photo_history: updated,
          profile_image: newUrl,
          updated_at: timestamp,
        });
        if (!res.success) throw new Error(res.error || "DB save failed");
        setPhotoHistory(updated);
        addToast("Profile photo uploaded successfully", "success");
        setTimeout(() => refetchProfiles?.(), 300);
      } else {
        const res = await insertRecord("profiles", {
          photo_history: updated,
          profile_image: newUrl,
          auth_uid: user?.id,
          email: user?.email,
          display_name: displayName || user?.email?.split("@")[0] || "User",
          created_at: timestamp,
          updated_at: timestamp,
        });
        if (!res.success) throw new Error(res.error || "DB insert failed");
        setPhotoHistory(updated);
        addToast("Profile created with photo", "success");
        setTimeout(() => refetchProfiles?.(), 300);
      }
    } catch (err) {
      addToast(
        "Error uploading profile photo: " + (err?.message || err),
        "error",
      );
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setCroppedFile(null);
      // Refetch active photo
      if (user?.id) {
        getActiveProfilePhoto(user.id).then(setActivePhoto);
      }
    }
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setCroppedFile(null);
    setSelectedFile(null);
  };

  const openModal = (photo) => setModalPhoto(photo);
  const closeModal = () => setModalPhoto(null);

  const saveProfile = async () => {
    if (!profile?.id && !user?.id) {
      addToast("Profile not found", "error");
      return;
    }
    setSaving(true);
    try {
      const profileData = {
        display_name: displayName,
        bio: bio,
        updated_at: new Date().toISOString(),
      };

      if (profile?.id) {
        const res = await updateRecord("profiles", profile.id, profileData);
        if (!res.success) throw new Error(res.error || "Save failed");
        addToast("Profile updated successfully", "success");
      } else {
        const res = await insertRecord("profiles", {
          ...profileData,
          auth_uid: user?.id,
          email: user?.email,
          created_at: new Date().toISOString(),
        });
        if (!res.success)
          throw new Error(res.error || "Profile creation failed");
        addToast("Profile created successfully", "success");
      }
      setTimeout(() => refetchProfiles?.(), 300);
    } catch (err) {
      addToast("Error saving profile: " + (err?.message || err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleMakeLive = async (url) => {
    if (!profile?.id) return;
    const updated = photoHistory.map((p) => ({
      ...p,
      is_active: p.url === url,
    }));
    try {
      const res = await updateRecord("profiles", profile.id, {
        photo_history: updated,
        updated_at: new Date().toISOString(),
      });
      if (!res.success) throw new Error(res.error || "DB update failed");

      // Also update profile_photos table
      if (user?.id) {
        const { data: allPhotos } = await supabase
          .from("profile_photos")
          .select("id")
          .eq("user_id", user.id);

        if (allPhotos) {
          for (const photo of allPhotos) {
            const isThisPhoto = photo.url === url || url.includes(photo.id);
            await updateRecord("profile_photos", photo.id, {
              active: isThisPhoto,
            });
          }
        }
      }

      setPhotoHistory(updated);
      addToast("Photo set as active", "success");
      setTimeout(() => refetchProfiles?.(), 300);
      closeModal();
    } catch (err) {
      addToast("Error setting active photo: " + (err?.message || err), "error");
    }
  };

  const handleDelete = async (url) => {
    if (!profile?.id) return;
    if (!confirm("Delete this photo?")) return;
    try {
      // Remove from history
      const updated = photoHistory.filter((p) => p.url !== url);
      // If active removed, set first as active
      if (!updated.find((p) => p.is_active) && updated.length > 0)
        updated[0].is_active = true;

      const res = await updateRecord("profiles", profile.id, {
        photo_history: updated,
        updated_at: new Date().toISOString(),
      });
      if (!res.success) throw new Error(res.error || "DB update failed");
      setPhotoHistory(updated);
      addToast("Photo removed", "success");
      // attempt deleting from storage (best-effort)
      try {
        await deleteFile(url);
      } catch (e) {
        console.warn("Could not delete storage file:", e);
      }
      setTimeout(() => refetchProfiles?.(), 300);
      closeModal();
    } catch (err) {
      addToast("Error deleting photo: " + (err?.message || err), "error");
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {showCropper && selectedFile && (
        <ImageCropper
          file={selectedFile}
          onSave={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
        />
      )}

      {/* Profile Info Card */}
      <div className="card">
        <h3>👤 Profile Information</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              disabled={saving}
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={user?.email || profile?.email || ""}
              disabled={true}
              style={{ opacity: 0.6 }}
            />
            <small style={{ color: "var(--muted)" }}>Managed by Supabase</small>
          </div>

          <div>
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              disabled={saving}
              style={{ minHeight: 80 }}
            />
          </div>

          <button
            className="btn-primary"
            onClick={saveProfile}
            disabled={saving}
            style={{ width: "100%" }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Profile Photo Card */}
      <div className="card">
        <h3>📸 Profile Photo</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {showPreview && croppedFile ? (
            // Preview and Upload Section
            <div style={{ display: "grid", gap: 16, textAlign: "center" }}>
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid var(--accent)",
                  margin: "0 auto",
                }}
              >
                <img
                  src={URL.createObjectURL(croppedFile)}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                This is how your profile photo will look. Click upload to save
                it.
              </p>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  onClick={cancelPreview}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ padding: "10px 20px" }}
                >
                  {uploading ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            </div>
          ) : (
            // Current Photo Display and Upload Section
            <div style={{ display: "grid", gap: 16, textAlign: "center" }}>
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid var(--accent)",
                  margin: "0 auto",
                }}
              >
                <img
                  src={activePhoto?.image_url || "/profile.svg"}
                  alt="active profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => (e.target.src = "/profile.svg")}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 12 }}>
                  <span
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    Upload New Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    style={{
                      marginTop: 6,
                      padding: "8px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      background: "var(--surface)",
                      cursor: uploading ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                  />
                </label>
                <small style={{ color: "var(--muted)" }}>
                  JPG, PNG or GIF. Max 5MB.
                </small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {modalPhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              width: "min(90vw,600px)",
              background: "var(--bg)",
              padding: 16,
              borderRadius: 8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  width: "100%",
                  height: 320,
                  overflow: "hidden",
                  borderRadius: 8,
                }}
              >
                <img
                  src={modalPhoto.url}
                  alt="modal"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => (e.target.src = "/MyLogo.png")}
                />
              </div>
              <div>
                <h4 style={{ marginTop: 0 }}>
                  {modalPhoto.is_active ? "✓ Active Photo" : "Photo"}
                </h4>
                <p style={{ color: "var(--muted)", margin: "4px 0" }}>
                  Uploaded: {new Date(modalPhoto.uploaded_at).toLocaleString()}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!modalPhoto.is_active && (
                  <button
                    className="btn-primary"
                    onClick={() => handleMakeLive(modalPhoto.url)}
                  >
                    Set as Active
                  </button>
                )}
                <button
                  onClick={() => handleDelete(modalPhoto.url)}
                  style={{
                    flex: 1,
                    background: "rgba(220,53,69,0.1)",
                    border: "1px solid rgba(220,53,69,0.3)",
                    color: "#d63545",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
