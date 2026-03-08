import { useState, useEffect } from "react";
import { useDashboardContext } from "../Dashboard";
import ImageCropper from "../../components/ImageCropper";
import { uploadFile, deleteFile } from "../../lib/supabaseStorage";
import { updateRecord, insertRecord, deleteRecord } from "../../lib/db";
import { useToast } from "../../context/ToastProvider";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";

export default function DashboardSettings() {
  const { profiles = [], refetchProfiles } = useDashboardContext();
  const { user } = useAuth();
  const profile = profiles?.[0] || {};
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoHistory, setPhotoHistory] = useState(
    profile?.photo_history || [],
  );
  const [modalPhoto, setModalPhoto] = useState(null);
  const [autoSwitch, setAutoSwitch] = useState(!!profile?.auto_switch);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);

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
    setAutoSwitch(!!profile?.auto_switch);
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
  }, [
    profile?.photo_history,
    profile?.profile_image,
    profile?.auto_switch,
    profile?.display_name,
    profile?.bio,
  ]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    if (!croppedFile) return;
    setUploading(true);
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
    }
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

  const toggleAutoSwitch = async () => {
    if (!profile?.id) return;
    const next = !autoSwitch;
    try {
      const res = await updateRecord("profiles", profile.id, {
        auto_switch: next,
        auto_switch_interval_hours: 6,
        updated_at: new Date().toISOString(),
      });
      if (!res.success) throw new Error(res.error || "DB update failed");
      setAutoSwitch(next);
      addToast("Auto-switch " + (next ? "enabled" : "disabled"), "success");
      setTimeout(() => refetchProfiles?.(), 300);
    } catch (err) {
      addToast("Error updating auto-switch: " + (err?.message || err), "error");
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
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid var(--accent)",
                flexShrink: 0,
              }}
            >
              <img
                src={
                  (photoHistory.find((p) => p.is_active) || {}).url ||
                  "/profile.svg"
                }
                alt="active profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => (e.target.src = "/profile.svg")}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 12 }}>
                <span
                  style={{ display: "block", marginBottom: 6, fontWeight: 500 }}
                >
                  Upload New Photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  style={{ marginTop: 6 }}
                />
              </label>
              <small style={{ color: "var(--muted)" }}>
                JPG, PNG or GIF. Max 5MB.
              </small>

              <div style={{ marginTop: 12 }}>
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={autoSwitch}
                    onChange={toggleAutoSwitch}
                    disabled={uploading}
                  />
                  <span style={{ color: "var(--muted)" }}>
                    Auto-rotate photos every 6 hours
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo History Card */}
      {photoHistory.length > 0 && (
        <div className="card">
          <h4>📷 Photo History ({photoHistory.length})</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 12,
            }}
          >
            {photoHistory.map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  paddingBottom: "100%",
                  overflow: "hidden",
                  borderRadius: 8,
                  border: p.is_active
                    ? "3px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                }}
              >
                <img
                  src={p.url}
                  alt={"photo-" + idx}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onClick={() => openModal(p)}
                  onError={(e) => (e.target.src = "/MyLogo.png")}
                />
                {p.is_active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "var(--accent)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Active
                  </div>
                )}
                <small
                  style={{
                    position: "absolute",
                    left: 6,
                    bottom: 6,
                    background: "rgba(0,0,0,0.5)",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                  }}
                >
                  {new Date(p.uploaded_at).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

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
