import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    // Validate authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate query parameter
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: "Query must be at least 2 characters long" 
      }, { status: 400 });
    }

    // Search for users with public profiles who allow story sharing
    const { data: users, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .eq("is_public_profile", true)
      .eq("is_share_stories", true)
      .neq("user_id", user.id) // Exclude the current user
      .ilike("display_name", `%${query}%`)
      .order("display_name")
      .limit(10);

    if (error) {
      console.error("User search error:", error);
      return NextResponse.json({ 
        error: "Failed to search users" 
      }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("Unexpected error in user search:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}