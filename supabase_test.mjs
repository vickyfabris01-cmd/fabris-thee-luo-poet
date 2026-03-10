import { createClient } from "@supabase/supabase-js";

(async () => {
  const supabase = createClient(
    "https://dhtppfwdgizlfkaanwvp.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodHBwZndkZ2l6bGZrYWFud3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDM0OTIsImV4cCI6MjA4NTYxOTQ5Mn0.-zC9FhF1WodKQpv2lKxFK7aUDCXLNDTiwW7vVsV_INo",
  );
  // try selecting the legacy field; error code 42703 indicates it
  // doesn't exist.
  const { data, error, status } = await supabase
    .from("profiles")
    .select("photo_history")
    .eq("auth_uid", "56ed3498-946c-45d0-851e-70bf750c5b49");

  console.log("status", status);
  if (error) {
    if (error.code === "42703") {
      console.log("column photo_history not found (expected if removed)");
    } else {
      console.log("error", error);
    }
  } else {
    console.log("data", data);
  }
})();
