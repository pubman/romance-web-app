import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StoryStatus {
  id: string;
  user_id: string;
  project_id: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  progress: number;
  progress_stage: string;
  percent_complete: number;
  title: string;
  is_byok: boolean;
  reasoning_model: string;
  writing_model: string;
  function_model: string;
  error_message: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
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

export function useStoryStatus(storyId: string, jobId?: string): UseStoryStatusReturn {
  const [status, setStatus] = useState<StoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!storyId) return;

    try {
      // Get authenticated session
      const supabase = createClient();
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError || !session) {
        throw new Error('Authentication required');
      }

      // Use the stories status endpoint - with jobId as query param if provided
      const statusUrl = jobId 
        ? `/api/stories/${storyId}/status?jobId=${jobId}`
        : `/api/stories/${storyId}/status`;
        
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          Accept: "*/*"
        },
      });
      
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
      
      // The API now returns the correct format directly
      setStatus(data);
      setError(null);

      // Auto-stop polling if story is completed or failed
      // Map 'processing' to 'generating' for internal consistency
      const mappedStatus = data.status === 'processing' ? 'generating' : data.status;
      if (mappedStatus === 'completed' || mappedStatus === 'failed') {
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
  }, [storyId, jobId]);

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
    const mappedStatus = status?.status === 'processing' ? 'generating' : status?.status;
    if (mappedStatus === 'completed' || mappedStatus === 'failed') {
      return;
    }

    setIsPolling(true);
    
    // Fetch immediately
    fetchStatus();
    
    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchStatus();
    }, interval);
  }, [fetchStatus, status?.status]);

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
    const mappedStatus = status?.status === 'processing' ? 'generating' : status?.status;
    if (mappedStatus === 'generating' && !isPolling) {
      startPolling();
    }
  }, [status?.status, isPolling, startPolling]);

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

