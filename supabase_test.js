const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

(async () => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const { data, error } = await supabase
    .from("profiles")
    .select("photo_history")
    .eq("auth_uid", "56ed3498-946c-45d0-851e-70bf750c5b49");

  if (error) {
    if (error.code === "42703") {
      console.log(
        "Supabase test: column 'photo_history' does not exist (expected if removed)",
      );
    } else {
      console.log("error", error);
    }
  } else {
    console.log("data", data);
  }
})();
