import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DatabaseStory } from "./use-user-stories";

export interface ReadingProgressItem {
  story_id: string;
  percentage_complete: number;
  current_chapter: number;
  current_position: number;
  last_read_at: string;
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
  story: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    status: 'draft' | 'generating' | 'completed' | 'failed';
    word_count: number;
    chapter_count: number;
    story_preferences: DatabaseStory["story_preferences"];
    created_at: string;
  };
}

interface UseReadingProgressReturn {
  readingProgress: ReadingProgressItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isEmpty: boolean;
}

export function useReadingProgress(userId?: string): UseReadingProgressReturn {
  const [readingProgress, setReadingProgress] = useState<ReadingProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchReadingProgress = useCallback(async () => {
    if (!userId) {
      setReadingProgress([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("reading_progress")
        .select(`
          story_id,
          percentage_complete,
          current_chapter,
          current_position,
          last_read_at,
          reading_time_minutes,
          created_at,
          updated_at,
          story:stories!inner (
            id,
            title,
            description,
            cover_image_url,
            status,
            word_count,
            chapter_count,
            story_preferences,
            created_at
          )
        `)
        .eq("user_id", userId)
        .gt("percentage_complete", 0) // Only stories that have been started
        .lt("percentage_complete", 100) // Only stories that aren't finished
        .eq("story.status", "completed") // Only completed stories can be read
        .order("last_read_at", { ascending: false }); // Most recently read first

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Type assertion through unknown to handle Supabase type inference issues
      setReadingProgress((data as unknown) as ReadingProgressItem[] || []);
    } catch (err) {
      console.error("Error fetching reading progress:", err);
      setError(err instanceof Error ? err.message : "Failed to load reading progress");
      setReadingProgress([]);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  const refetch = useCallback(() => {
    fetchReadingProgress();
  }, [fetchReadingProgress]);

  useEffect(() => {
    fetchReadingProgress();
  }, [fetchReadingProgress]);

  return {
    readingProgress,
    loading,
    error,
    refetch,
    isEmpty: !loading && readingProgress.length === 0,
  };
}