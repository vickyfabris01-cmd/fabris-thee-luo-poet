import { supabase } from "./supabase";

/**
 * Upload a file to Supabase Storage and return the public URL
 */
export async function uploadFile(file, bucket = "media", folder = "") {
  try {
    if (!file) throw new Error("No file provided");

    // Generate a unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop();
    const filename = `${folder ? folder + "/" : ""}${timestamp}-${random}.${ext}`;

    console.log(`Uploading file: ${filename}`);

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) throw new Error("Failed to get public URL");

    console.log("✓ File uploaded:", publicUrl);
    return { success: true, url: publicUrl };
  } catch (e) {
    console.error("File upload failed:", e.message || e);
    return { success: false, error: e.message || e };
  }
}

/**
 * Delete a file from Supabase Storage by URL
 */
export async function deleteFile(fileUrl, bucket = "media") {
  try {
    if (!fileUrl) throw new Error("No URL provided");

    // Extract path from Supabase public URL
    // URL format: https://xxxxx.supabase.co/storage/v1/object/public/media/profile-photos/filename.jpg
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");

    // Find the bucket index and extract everything after it
    const bucketIndex = pathParts.indexOf(bucket);
    if (bucketIndex === -1)
      throw new Error("Invalid file URL - bucket not found");

    const filePath = pathParts.slice(bucketIndex + 1).join("/");
    if (!filePath) throw new Error("Invalid file URL - no path");

    console.log(`Deleting file: ${filePath} from bucket: ${bucket}`);

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      throw error;
    }

    console.log("✓ File deleted");
    return { success: true };
  } catch (e) {
    console.error("File deletion failed:", e.message || e);
    return { success: false, error: e.message || e };
  }
}
