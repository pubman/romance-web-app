import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DatabaseStory {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  is_public: boolean;
  content_url: string | null;
  word_count: number;
  chapter_count: number;
  story_preferences: {
    genre?: string;
    elements?: { 
      genre?: string;
      tropes?: string[];
      heat_level?: string;
    };
  } | null;
  wizard_data: {
    characters?: {
      protagonist?: { name: string };
      love_interest?: { name: string };
    };
  } | null;
  generation_progress: number;
  created_at: string;
  updated_at: string;
}

interface UseUserStoriesReturn {
  stories: DatabaseStory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isEmpty: boolean;
}

export function useUserStories(userId?: string): UseUserStoriesReturn {
  const [stories, setStories] = useState<DatabaseStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

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

      setStories(data || []);
    } catch (err) {
      console.error("Error fetching user stories:", err);
      setError(err instanceof Error ? err.message : "Failed to load stories");
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

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
  };
}