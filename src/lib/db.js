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
 * Fetch active profile photo for a user
 */
export async function getActiveProfilePhoto(userId) {
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
 * Fetch all profile photos for a user
 */
export async function getUserProfilePhotos(userId) {
  try {
    const { data, error } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(`Error fetching user profile photos:`, error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error(`Error fetching user profile photos:`, e);
    return [];
  }
}
