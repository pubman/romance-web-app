import { createClient } from "@/lib/supabase/client";

export interface DatabaseProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string;
  credits_remaining: number;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export async function useUserProfile(userId: string): Promise<DatabaseProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}