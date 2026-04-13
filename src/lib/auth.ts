import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

export async function ensureUserProfile(user: User) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      display_name:
        typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : null,
      avatar_url:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}
