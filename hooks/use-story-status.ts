import { useState, useEffect, useCallback, useRef } from 'react';

interface JobStatus {
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

interface StoryStatus {
  story: {
    id: string;
    title: string;
    status: 'draft' | 'generating' | 'completed' | 'failed';
    progress: number;
    progress_stage: string;
    percent_complete: number;
    error_message?: string | null;
  };
  job: {
    id: string;
    status: string;
    progress: number;
    progress_stage: string;
    message?: string;
    models: {
      reasoning: string;
      writing: string;
      function: string;
    };
    is_byok: boolean;
    is_starred: boolean;
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

export function useStoryStatus(storyId: string, jobId?: string): UseStoryStatusReturn {
  const [status, setStatus] = useState<StoryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!storyId) return;

    try {
      let response;
      
      // If we have a jobId, use the new getJobStatus endpoint
      if (jobId) {
        response = await fetch(`/api/getJobStatus?jobId=${jobId}`, {
          method: 'GET',
          headers: {
            "Accept": "*/*"
          },
        });
      } else {
        // Fallback to the old endpoint to get job ID first
        response = await fetch(`/api/stories/${storyId}/status`);
      }
      
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
      
      // Transform new API response to match our interface
      let transformedStatus: StoryStatus;
      
      if (jobId && 'progress_stage' in data) {
        // New API response format
        const jobStatus = data as JobStatus;
        transformedStatus = {
          story: {
            id: jobStatus.project_id,
            title: jobStatus.title,
            status: mapApiStatusToInternal(jobStatus.status),
            progress: jobStatus.progress,
            progress_stage: jobStatus.progress_stage,
            percent_complete: jobStatus.percent_complete,
            error_message: jobStatus.error_message,
          },
          job: {
            id: jobStatus.id,
            status: jobStatus.status,
            progress: jobStatus.progress,
            progress_stage: jobStatus.progress_stage,
            models: {
              reasoning: jobStatus.reasoning_model,
              writing: jobStatus.writing_model,
              function: jobStatus.function_model,
            },
            is_byok: jobStatus.is_byok,
            is_starred: jobStatus.is_starred,
          }
        };
      } else {
        // Old API response format - add default values for new fields
        transformedStatus = {
          ...data,
          story: {
            ...data.story,
            progress_stage: data.story.progress_stage || getProgressStageFromStatus(data.story.status, data.story.progress),
            percent_complete: (data.story.progress || 0) / 100,
            error_message: data.story.error_message || null,
          },
          job: data.job ? {
            ...data.job,
            progress_stage: data.job.progress_stage || getProgressStageFromStatus(data.story.status, data.job.progress),
            models: {
              reasoning: 'google/gemini-2.5-flash-001',
              writing: 'google/gemini-2.5-flash-001',
              function: 'google/gemini-2.5-flash-001',
            },
            is_byok: false,
            is_starred: false,
          } : null
        };
      }
      
      setStatus(transformedStatus);
      setError(null);

      // Auto-stop polling if story is completed or failed
      if (transformedStatus.story.status === 'completed' || transformedStatus.story.status === 'failed') {
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

// Helper functions
function mapApiStatusToInternal(apiStatus: string): 'draft' | 'generating' | 'completed' | 'failed' {
  const statusMap: { [key: string]: 'draft' | 'generating' | 'completed' | 'failed' } = {
    'draft': 'draft',
    'processing': 'generating',
    'completed': 'completed',
    'failed': 'failed'
  };
  return statusMap[apiStatus] || 'draft';
}

function getProgressStageFromStatus(status: string, progress: number): string {
  if (status === 'completed') return 'completed';
  if (status === 'failed') return 'failed';
  if (status === 'draft') return 'draft';
  
  // For generating status, determine stage based on progress
  if (progress < 20) return 'initializing';
  if (progress < 40) return 'planning_story';
  if (progress < 80) return 'generating_work';
  if (progress < 100) return 'finalizing';
  
  return 'generating_work';
}