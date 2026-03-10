import { useState, useEffect } from "react";
import { useDashboardContext } from "../Dashboard";
import ImageCropper from "../../components/ImageCropper";
import Modal from "../../components/Modal";
import { uploadFile, deleteFile } from "../../lib/supabaseStorage";
import {
  updateRecord,
  insertRecord,
  deleteRecord,
  getActiveProfilePhoto,
  getUserProfilePhotos,
  syncProfilePhotosFromHistory,
} from "../../lib/db";
import { useToast } from "../../context/ToastProvider";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";

export default function DashboardProfiles() {
  const { profiles = [], refetchProfiles } = useDashboardContext();
  const { user } = useAuth();
  const profile = profiles?.find((p) => p.auth_uid === user?.id) || {};
  const { addToast } = useToast();

  // Debug logging
  console.log("DashboardProfiles Debug:");
  console.log("User:", user);
  console.log("Profiles array:", profiles);
  console.log("Found profile:", profile);
  console.log("Profile display_name:", profile?.display_name);
  console.log("Profile bio:", profile?.bio);

  const [selectedFile, setSelectedFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoHistory, setPhotoHistory] = useState(
    profile?.photo_history || [],
  );
  const [activePhoto, setActivePhoto] = useState(null);
  const [allUserPhotos, setAllUserPhotos] = useState([]);
  const [showExistingPhotos, setShowExistingPhotos] = useState(false);
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState(null);
  const [displayName, setDisplayName] = useState(
    profile?.display_name || user?.email?.split("@")[0] || "",
  );
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
    setDisplayName(profile?.display_name || user?.email?.split("@")[0] || "");
    setBio(profile?.bio || "");
  }, [
    profile?.photo_history,
    profile?.profile_image,
    profile?.display_name,
    profile?.bio,
  ]);

  // Fetch active profile photo (global)
  useEffect(() => {
    const fetchActivePhoto = async () => {
      if (user?.id) {
        // First sync any existing photos from photo_history to profile_photos table
        await syncProfilePhotosFromHistory(user.id);

        const photo = await getActiveProfilePhoto(user.id);
        setActivePhoto(photo);
      }
    };
    fetchActivePhoto();
  }, [user?.id]);

  // Fetch all profile photos (global)
  useEffect(() => {
    const fetchAllPhotos = async () => {
      if (user?.id) {
        const photos = await getUserProfilePhotos(user.id);
        setAllUserPhotos(photos);
      }
    };
    fetchAllPhotos();
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

      // Save to profile_photos table (global)
      // Insert new photo as inactive (user can activate it later)
      const photoRes = await insertRecord("profile_photos", {
        user_id: user.id,
        image_url: newUrl,
        created_at: timestamp,
        active: false, // Changed: default to inactive
      });
      if (!photoRes.success) throw new Error("Failed to save profile photo");

      // Build updated history - add as inactive
      const updated = [
        ...photoHistory, // Keep existing photos
        { url: newUrl, uploaded_at: timestamp, is_active: false }, // New photo inactive
      ];

      if (profile?.id) {
        const res = await updateRecord("profiles", profile.id, {
          photo_history: updated,
          // Don't update profile_image since it's inactive
          updated_at: timestamp,
        });
        if (!res.success) throw new Error(res.error || "DB save failed");
        setPhotoHistory(updated);
        addToast("Profile photo uploaded successfully", "success");
        setTimeout(() => refetchProfiles?.(), 300);
      } else {
        const res = await insertRecord("profiles", {
          photo_history: updated,
          // No profile_image since no active photo
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
      // Refetch active photo and all user photos
      if (user?.id) {
        getActiveProfilePhoto(user.id).then(setActivePhoto);
        getUserProfilePhotos(user.id).then(setAllUserPhotos);
      }
    }
  };

  const cancelPreview = () => {
    setShowPreview(false);
    setCroppedFile(null);
    setSelectedFile(null);
  };

  const switchActivePhoto = async (photoId) => {
    if (!user?.id) return;

    try {
      console.log("🔄 Switching active photo globally to:", photoId);

      // Step 1: Set ALL user's photos to inactive (active: false)
      console.log("📝 Step 1: Setting all user photos to inactive");
      const { error: deactivateError } = await supabase
        .from("profile_photos")
        .update({ active: false })
        .eq("user_id", user.id); // Only user's photos

      if (deactivateError) {
        console.error("❌ Error deactivating photos:", deactivateError);
        throw deactivateError;
      }

      console.log("✅ All user photos set to active: false");

      // Step 2: Set the selected photo to active (active: true)
      console.log("📝 Step 2: Activating selected photo");
      const { error: activateError } = await supabase
        .from("profile_photos")
        .update({ active: true })
        .eq("id", photoId);

      if (activateError) {
        console.error("❌ Error activating photo:", activateError);
        throw activateError;
      }

      console.log("✅ Selected photo set to active: true");

      // Update local state to match database
      const updatedPhotos = allUserPhotos.map((photo) => ({
        ...photo,
        active: photo.id === photoId,
      }));
      setAllUserPhotos(updatedPhotos);

      const newActivePhoto = updatedPhotos.find(
        (photo) => photo.id === photoId,
      );
      setActivePhoto(newActivePhoto);

      console.log("🎉 Photo switch completed successfully");
      addToast("Profile photo updated successfully", "success");
    } catch (err) {
      console.error("💥 Error in switchActivePhoto:", err);
      addToast(
        "Error updating active photo: " + (err?.message || err),
        "error",
      );
    }
  };

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

  const handleDeletePhoto = async (photo) => {
    if (!user?.id || !photo?.id) return;
    if (!confirm("Delete this photo?")) return;

    try {
      // Delete from profile_photos table
      const deleteRes = await deleteRecord("profile_photos", photo.id);
      if (!deleteRes.success)
        throw new Error("Failed to delete photo from database");

      // If this was the active photo, switch to another one
      if (photo.active && allUserPhotos.length > 1) {
        const remainingPhotos = allUserPhotos.filter((p) => p.id !== photo.id);
        if (remainingPhotos.length > 0) {
          await switchActivePhoto(remainingPhotos[0].id);
        }
      }

      // Update local state
      setAllUserPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      if (activePhoto?.id === photo.id) {
        setActivePhoto(null);
      }

      addToast("Photo deleted successfully", "success");

      // Attempt to delete from storage (best-effort)
      try {
        await deleteFile(photo.image_url);
      } catch (e) {
        console.warn("Could not delete storage file:", e);
      }

      setSelectedPhotoForModal(null);
    } catch (err) {
      addToast("Error deleting photo: " + (err?.message || err), "error");
    }
  };

  const handleSwitchPhoto = async () => {
    if (!user?.id || !selectedPhotoForModal) return;

    // Find current active photo index
    const activeIndex = allUserPhotos.findIndex((p) => p.active);
    if (activeIndex === -1) return;

    // Find next photo index (cycle through the list)
    const nextIndex = (activeIndex + 1) % allUserPhotos.length;
    const nextPhoto = allUserPhotos[nextIndex];

    await switchActivePhoto(nextPhoto.id);
    setSelectedPhotoForModal(null);
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
                <button
                  onClick={() => setShowExistingPhotos(!showExistingPhotos)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--surface)",
                    cursor: "pointer",
                    fontWeight: 500,
                    marginTop: 8,
                  }}
                >
                  {showExistingPhotos
                    ? "Hide Existing Photos"
                    : "Choose from Existing"}
                  <span style={{ marginLeft: 8 }}>
                    {showExistingPhotos ? "▲" : "▼"}
                  </span>
                </button>
                {showExistingPhotos && (
                  <div style={{ marginTop: 12 }}>
                    {allUserPhotos.length === 0 ? (
                      <p
                        style={{
                          color: "var(--muted)",
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        No photos uploaded yet
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(100px, 1fr))",
                          gap: 12,
                          maxHeight: "300px",
                          overflowY: "auto",
                          padding: "8px",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          background: "var(--bg)",
                        }}
                      >
                        {allUserPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            onClick={() => setSelectedPhotoForModal(photo)}
                            style={{
                              position: "relative",
                              cursor: "pointer",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: photo.active
                                ? "2px solid var(--accent)"
                                : "2px solid transparent",
                              opacity: photo.active ? 1 : 0.7,
                              transition: "all 0.2s ease",
                            }}
                          >
                            <img
                              src={photo.image_url}
                              alt="profile option"
                              style={{
                                width: "100%",
                                height: "100px",
                                objectFit: "cover",
                                filter: photo.active
                                  ? "none"
                                  : "grayscale(30%)",
                              }}
                              onError={(e) => (e.target.src = "/profile.svg")}
                            />
                            {photo.active && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  background: "var(--accent)",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                ✓
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedPhotoForModal && (
        <Modal
          open={!!selectedPhotoForModal}
          onClose={() => setSelectedPhotoForModal(null)}
          title="Photo Options"
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                width: "100%",
                height: 200,
                overflow: "hidden",
                borderRadius: 8,
                border: "2px solid var(--border)",
              }}
            >
              <img
                src={selectedPhotoForModal.image_url}
                alt="selected photo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => (e.target.src = "/profile.svg")}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {selectedPhotoForModal.active ? (
                // Active photo: Switch button only
                <button
                  className="btn-primary"
                  onClick={handleSwitchPhoto}
                  style={{ padding: "10px 20px" }}
                >
                  🔄 Switch to Next Photo
                </button>
              ) : (
                // Inactive photo: Activate and Delete buttons
                <>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      switchActivePhoto(selectedPhotoForModal.id);
                      setSelectedPhotoForModal(null);
                    }}
                    style={{ padding: "10px 20px" }}
                  >
                    ✓ Activate
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(selectedPhotoForModal)}
                    style={{
                      padding: "10px 20px",
                      background: "rgba(220,53,69,0.1)",
                      border: "1px solid rgba(220,53,69,0.3)",
                      color: "#d63545",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
