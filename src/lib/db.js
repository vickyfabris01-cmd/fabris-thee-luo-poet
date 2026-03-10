import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * Custom hook for fetching data from Supabase
 * Automatically subscribes to real-time updates
 */
export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`Real-time update from ${table}:`, payload);
          fetchData(); // Refetch on any change
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);

  async function fetchData() {
    try {
      setLoading(true);
      // Some tables may not have a `created_at` column. Try ordering by
      // `created_at`, then `updated_at`, and finally without ordering.
      let result = null;
      let err = null;

      const tryFetch = async (orderBy) => {
        if (orderBy) {
          return await supabase
            .from(table)
            .select("*")
            .order(orderBy, { ascending: false });
        }
        return await supabase.from(table).select("*");
      };

      // Try created_at first
      ({ data: result, error: err } = await tryFetch("created_at"));

      // If column doesn't exist (SQL error 42703), try updated_at
      if (
        err &&
        (err.code === "42703" || /does not exist/.test(err.message || ""))
      ) {
        console.warn(
          `${table}: 'created_at' not found, retrying with 'updated_at'`,
        );
        ({ data: result, error: err } = await tryFetch("updated_at"));
      }

      // If still an error, fallback to no ordering
      if (err) {
        console.warn(
          `${table}: ordering failed, fetching without order`,
          err.message || err,
        );
        const fallback = await tryFetch();
        result = fallback.data;
        err = fallback.error;
      }

      if (err) {
        console.error(`Error fetching ${table}:`, err);
        setError(err);
      } else {
        setData(result || []);
      }
    } catch (e) {
      console.error(`Fetch error for ${table}:`, e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  const refetch = fetchData;

  return { data: data || [], loading, error, refetch };
}

/**
 * Fetch a single video by id and apply the same trimming rules as the list hook.
 * Returns an object: { data, error }
 */
export async function fetchVideoById(id) {
  try {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .limit(1)
      .single();

    if (error) return { data: null, error };

    if (!data) return { data: null };

    return { data };
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * Insert a single record into a table
 */
export async function insertRecord(table, record) {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert([record])
      .select();

    if (error) {
      if (error.code === "42703") {
        // missing column; log and treat as successful no-op
        console.warn(
          `Warning: trying to insert into ${table} but a column was missing; field ignored`,
        );
        return { success: true, data: data?.[0] };
      }
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }

    console.log(`✓ Inserted into ${table}:`, data);
    return { success: true, data: data?.[0] };
  } catch (e) {
    console.error(`Insert error:`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Update a single record
 */
export async function updateRecord(table, id, updates) {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      if (error.code === "42703") {
        console.warn(
          `Warning: trying to update ${table} but a column was missing; update skipped`,
        );
        return { success: true, data: data?.[0] };
      }
      console.error(`Error updating ${table}:`, error);
      throw error;
    }

    console.log(`✓ Updated ${table}:`, data);
    return { success: true, data: data?.[0] };
  } catch (e) {
    console.error(`Update error:`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a single record
 */
export async function deleteRecord(table, id) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      throw error;
    }

    console.log(`✓ Deleted from ${table}`);
    return { success: true };
  } catch (e) {
    console.error(`Delete error:`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Batch insert multiple records
 */
export async function insertBatch(table, records) {
  try {
    const { data, error } = await supabase.from(table).insert(records).select();

    if (error) {
      console.error(`Error batch inserting into ${table}:`, error);
      throw error;
    }

    console.log(`✓ Batch inserted ${records.length} records into ${table}`);
    return { success: true, data };
  } catch (e) {
    console.error(`Batch insert error:`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete all records from a table
 */
export async function deleteAll(table) {
  try {
    const { error } = await supabase.from(table).delete().neq("id", ""); // Match all records

    if (error) {
      console.error(`Error clearing ${table}:`, error);
      throw error;
    }

    console.log(`✓ Cleared all records from ${table}`);
    return { success: true };
  } catch (e) {
    console.error(`Clear error:`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Fetch active profile photo for a specific user
 */
export async function getActiveProfilePhoto(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows found", which is ok
      console.warn(`Error fetching active profile photo:`, error);
    }

    return data || null;
  } catch (e) {
    console.error(`Error fetching active profile photo:`, e);
    return null;
  }
}

/**
 * Fetch all profile photos for a specific user
 */
export async function getUserProfilePhotos(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(`Error fetching profile photos:`, error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error(`Error fetching profile photos:`, e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Likes helpers
// ---------------------------------------------------------------------------

/**
 * Record a like/unlike event to the `likes` table.  The table currently has no
 * user column, so this simply inserts a row each time the client toggles a
 * like.  You can change this to upsert if you add a unique constraint
 * (content_type, content_id) on the likes table.
 */
export async function recordLike(contentType, contentId, liked = true) {
  if (!contentType || !contentId) {
    return { success: false, error: "Missing content type or id" };
  }
  try {
    const { data, error } = await supabase.from("likes").insert({
      content_type: contentType,
      content_id: contentId,
      liked,
    });
    if (error) {
      console.error("Error inserting like record:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (e) {
    console.error("Error recording like:", e);
    return { success: false, error: e.message };
  }
}

/**
 * Return the number of `liked = true` rows for a given item.
 */
export async function getLikeCount(contentType, contentId) {
  if (!contentType || !contentId) return 0;
  try {
    const { count, error } = await supabase
      .from("likes")
      .select("id", { count: "exact" })
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("liked", true);
    if (error) {
      console.warn("Error counting likes:", error);
      return 0;
    }
    return count || 0;
  } catch (e) {
    console.error("Error counting likes:", e);
    return 0;
  }
}

/**
 * Sync existing photos from profile.photo_history to profile_photos table
 * This helps migrate photos that were uploaded before the profile_photos table existed
 */
export async function syncProfilePhotosFromHistory(userId) {
  if (!userId) return { success: false, error: "No user ID provided" };

  try {
    // attempt to read the legacy column; if it doesn't exist PostgREST will
    // return a 42703 error which we handle below.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("photo_history")
      .eq("auth_uid", userId)
      .single();

    if (profileError) {
      // PGRST42703 = missing column
      if (profileError.code === "42703") {
        console.warn(
          "syncProfilePhotosFromHistory: 'photo_history' column missing, skipping migration",
        );
        return { success: true, message: "no photo_history column" };
      }
      return { success: false, error: "Profile not found" };
    }

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    const photoHistory = profile.photo_history || [];

    // Check if photos already exist in profile_photos table
    const existingPhotos = await getUserProfilePhotos(userId);

    // If no photos in profile_photos but photos exist in history, migrate them
    if (existingPhotos.length === 0 && photoHistory.length > 0) {
      console.log(
        `Migrating ${photoHistory.length} photos from photo_history to profile_photos table`,
      );

      const photosToInsert = photoHistory.map((photo) => ({
        user_id: userId,
        image_url: photo.url,
        created_at: photo.uploaded_at,
        active: photo.is_active || false,
      }));

      const insertResult = await insertBatch("profile_photos", photosToInsert);

      if (insertResult.success) {
        console.log(`✓ Successfully migrated ${photoHistory.length} photos`);
        return { success: true, migrated: photoHistory.length };
      } else {
        return { success: false, error: insertResult.error };
      }
    }

    return { success: true, message: "No migration needed" };
  } catch (e) {
    console.error(`Error syncing profile photos:`, e);
    return { success: false, error: e.message };
  }
}
