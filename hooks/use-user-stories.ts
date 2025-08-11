import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStoryStatusUpdater } from "./use-story-status-updater";

export interface DatabaseStory {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  is_public: boolean;
  author: string;
  word_count: number;
  chapter_count: number;
  story_preferences: {
    genre?: string;
    elements?: { 
      genre?: string;
      tropes?: string[];
      heat_level?: string;
      story_length?: string;
      conflict_type?: string;
    };
    setting?: {
      time_period?: string;
      location?: string;
      atmosphere?: string;
    };
    characters?: {
      protagonist?: { name: string; traits?: string[]; occupation?: string };
      love_interest?: { name: string; traits?: string[]; occupation?: string };
    };
    mood?: string;
  } | null;
  wizard_data: {
    genre?: string;
    characters?: {
      protagonist?: { name: string; traits?: string[]; occupation?: string };
      love_interest?: { name: string; traits?: string[]; occupation?: string };
    };
    setting?: {
      time_period?: string;
      location?: string;
      atmosphere?: string;
    };
    elements?: {
      genre?: string;
      tropes?: string[];
      heat_level?: string;
      story_length?: string;
      conflict_type?: string;
    };
    mood?: string;
  } | null;
  generation_progress: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  // PDF-related properties
  generation_job_id?: string | null;
  content_url?: string | null;
  page_count?: number | null;
}

interface UseUserStoriesReturn {
  stories: DatabaseStory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isEmpty: boolean;
  isUpdatingStatus: boolean;
  statusError: string | null;
}

export function useUserStories(userId?: string): UseUserStoriesReturn {
  const [stories, setStories] = useState<DatabaseStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const { updateStoriesStatus, isUpdating: isUpdatingStatus, error: statusError } = useStoryStatusUpdater();

  const fetchUserStories = useCallback(async () => {
    if (!userId) {
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("stories")
        .select(`
         *
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }); // Most recent first

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const fetchedStories = data || [];
      setStories(fetchedStories);

      // Check status of generating stories after initial fetch
      if (fetchedStories.length > 0) {
        const generatingStories = fetchedStories.filter(story => story.status === 'generating');
        if (generatingStories.length > 0) {
          // Don't await this - let it run in background
          updateStoriesStatus(fetchedStories).then(updates => {
            if (updates.length > 0) {
              // Apply updates to local state immediately
              setStories(prevStories => 
                prevStories.map(story => {
                  const update = updates.find(u => u.id === story.id);
                  if (update) {
                    return {
                      ...story,
                      status: update.status,
                      generation_progress: update.generation_progress,
                      ...(update.error_message && { error_message: update.error_message }),
                    };
                  }
                  return story;
                })
              );
            }
          }).catch(err => {
            console.error('Background status update failed:', err);
          });
        }
      }
    } catch (err) {
      console.error("Error fetching user stories:", err);
      setError(err instanceof Error ? err.message : "Failed to load stories");
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, updateStoriesStatus]);

  const refetch = useCallback(() => {
    fetchUserStories();
  }, [fetchUserStories]);

  useEffect(() => {
    fetchUserStories();
  }, [fetchUserStories]);

  return {
    stories,
    loading,
    error,
    refetch,
    isEmpty: !loading && stories.length === 0,
    isUpdatingStatus,
    statusError,
  };
}