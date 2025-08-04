import { useState, useCallback } from 'react';

interface RetryResponse {
  success: boolean;
  story: {
    id: string;
    title: string;
    status: 'generating';
    generation_progress: number;
  };
  job: {
    id: string;
    status: string;
    progress: number;
  };
  retry: boolean;
  message: string;
  error?: string;
  details?: string;
}

interface UseStoryRetryReturn {
  retryStory: (storyId: string) => Promise<RetryResponse | null>;
  isRetrying: boolean;
  error: string | null;
}

export function useStoryRetry(): UseStoryRetryReturn {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryStory = useCallback(async (storyId: string): Promise<RetryResponse | null> => {
    if (!storyId) {
      setError('Story ID is required');
      return null;
    }

    setIsRetrying(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
        }),
      });

      const result: RetryResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Story retry failed');
      }

      console.log('Story retry successful:', {
        storyId,
        jobId: result.job.id,
        title: result.story.title
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry story';
      console.error('Story retry error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return {
    retryStory,
    isRetrying,
    error,
  };
}