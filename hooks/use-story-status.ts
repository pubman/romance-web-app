import { useState, useEffect, useCallback, useRef } from 'react';

interface StoryStatus {
  story: {
    id: string;
    title: string;
    status: 'draft' | 'generating' | 'completed' | 'failed';
    progress: number;
  };
  job: {
    id: string;
    status: string;
    progress: number;
    message?: string;
  } | null;
}

interface UseStoryStatusReturn {
  status: StoryStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export function useStoryStatus(storyId: string): UseStoryStatusReturn {
  const [status, setStatus] = useState<StoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!storyId) return;

    try {
      const response = await fetch(`/api/stories/${storyId}/status`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Story not found');
        } else if (response.status === 401) {
          throw new Error('Authentication required');
        } else {
          throw new Error('Failed to fetch story status');
        }
      }

      const data = await response.json();
      setStatus(data);
      setError(null);

      // Auto-stop polling if story is completed or failed
      if (data.story.status === 'completed' || data.story.status === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setIsPolling(false);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status';
      setError(errorMessage);
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchStatus();
  }, [fetchStatus]);

  const startPolling = useCallback((interval: number = 5000) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Don't start polling if story is already completed or failed
    if (status?.story.status === 'completed' || status?.story.status === 'failed') {
      return;
    }

    setIsPolling(true);
    
    // Fetch immediately
    fetchStatus();
    
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, interval);
  }, [fetchStatus, status?.story.status]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Auto-start polling for generating stories
  useEffect(() => {
    if (status?.story.status === 'generating' && !isPolling) {
      startPolling();
    }
  }, [status?.story.status, isPolling, startPolling]);

  return {
    status,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
    isPolling,
  };
}