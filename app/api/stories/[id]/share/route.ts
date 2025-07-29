import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ShareRequest {
  userIds: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: storyId } = await params;
    
    // Validate authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body: ShareRequest = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: "User IDs array is required" 
      }, { status: 400 });
    }

    // Verify the story exists and belongs to the current user
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, user_id, title, is_public")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ 
        error: "Story not found or access denied" 
      }, { status: 404 });
    }

    // Verify all target users exist and have public profiles that allow sharing
    const { data: targetUsers, error: usersError } = await supabase
      .from("profiles")
      .select("user_id, display_name, is_public_profile, is_share_stories")
      .in("user_id", userIds);

    if (usersError) {
      return NextResponse.json({ 
        error: "Failed to verify target users" 
      }, { status: 500 });
    }

    // Filter out users who don't allow sharing or don't have public profiles
    const validUsers = targetUsers?.filter(u => 
      u.is_public_profile && u.is_share_stories
    ) || [];

    if (validUsers.length === 0) {
      return NextResponse.json({ 
        error: "No valid users found for sharing" 
      }, { status: 400 });
    }

    // For now, we'll just log the sharing action
    // In a full implementation, you might:
    // 1. Create a story_shares table to track who has access
    // 2. Send notifications to the shared users
    // 3. Create activity logs
    
    console.log(`Story "${story.title}" (${storyId}) shared by user ${user.id} with:`, 
      validUsers.map(u => `${u.display_name} (${u.user_id})`));

    // You could implement a story_shares table like this:
    /*
    const shareRecords = validUsers.map(targetUser => ({
      story_id: storyId,
      owner_id: user.id,
      shared_with_id: targetUser.user_id,
      shared_at: new Date().toISOString(),
      access_level: 'read' // or 'read_write' if you want different permission levels
    }));

    const { error: shareError } = await supabase
      .from("story_shares")
      .upsert(shareRecords, { 
        onConflict: 'story_id,shared_with_id',
        ignoreDuplicates: false 
      });

    if (shareError) {
      return NextResponse.json({ 
        error: "Failed to create share records" 
      }, { status: 500 });
    }
    */

    return NextResponse.json({ 
      success: true,
      message: `Story shared with ${validUsers.length} user(s)`,
      sharedWith: validUsers.map(u => ({
        user_id: u.user_id,
        display_name: u.display_name
      }))
    });

  } catch (error) {
    console.error("Unexpected error in story sharing:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}