import { useState, useCallback, useRef } from 'react';
import { DatabaseStory } from './use-user-stories';

interface StoryStatusUpdate {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  generation_progress: number;
  error_message?: string;
}

interface StatusCheckResponse {
  success: boolean;
  updates: StoryStatusUpdate[];
  checked: number;
  updated: number;
  message?: string;
}

interface UseStoryStatusUpdaterReturn {
  updateStoriesStatus: (stories: DatabaseStory[]) => Promise<StoryStatusUpdate[]>;
  isUpdating: boolean;
  error: string | null;
}

// Cache to prevent redundant API calls
interface StatusCache {
  [storyId: string]: {
    lastChecked: number;
    result: StoryStatusUpdate | null;
  };
}

const CACHE_DURATION = 30 * 1000; // 30 seconds
const DEBOUNCE_DELAY = 1000; // 1 second
const statusCache: StatusCache = {};

// Global debounce timer to prevent rapid successive calls
let debounceTimer: NodeJS.Timeout | null = null;

export function useStoryStatusUpdater(): UseStoryStatusUpdaterReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateStoriesStatus = useCallback(async (stories: DatabaseStory[]): Promise<StoryStatusUpdate[]> => {
    // Filter to only generating stories
    const generatingStories = stories.filter(story => story.status === 'generating');
    
    if (generatingStories.length === 0) {
      return [];
    }

    // Return a promise that resolves after debounce delay
    return new Promise((resolve) => {
      // Clear existing timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer
      debounceTimer = setTimeout(async () => {
        try {
          const updates = await performStatusCheck(generatingStories);
          resolve(updates);
        } catch (error) {
          console.error('Debounced status check failed:', error);
          resolve([]);
        }
      }, DEBOUNCE_DELAY);
    });
  }, []);

  const performStatusCheck = useCallback(async (generatingStories: DatabaseStory[]): Promise<StoryStatusUpdate[]> => {
    // Check cache first
    const now = Date.now();
    const uncachedStoryIds: string[] = [];
    const cachedUpdates: StoryStatusUpdate[] = [];

    generatingStories.forEach(story => {
      const cached = statusCache[story.id];
      if (cached && (now - cached.lastChecked) < CACHE_DURATION) {
        // Use cached result if available
        if (cached.result) {
          cachedUpdates.push(cached.result);
        }
      } else {
        // Needs fresh check
        uncachedStoryIds.push(story.id);
      }
    });

    // If all stories are cached, return cached results
    if (uncachedStoryIds.length === 0) {
      return cachedUpdates;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsUpdating(true);
    setError(null);

    try {
      // Make individual API calls for uncached stories
      const promises = uncachedStoryIds.map(async (storyId) => {
        try {
          const response = await fetch(`/api/stories/${storyId}/status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          });

          if (!response.ok) {
            console.error(`Failed to check status for story ${storyId}:`, response.statusText);
            return null;
          }

          const data = await response.json();
          
          // Only return an update if the status actually changed
          const story = generatingStories.find(s => s.id === storyId);
          if (story && (data.story.status !== story.status || data.story.progress !== story.generation_progress)) {
            return {
              id: storyId,
              status: data.story.status,
              generation_progress: data.story.progress,
              error_message: data.story.error_message,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error checking status for story ${storyId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const updates = results.filter(Boolean) as StoryStatusUpdate[];

      // Simulate the old API response format
      const result = {
        success: true,
        updates,
        checked: uncachedStoryIds.length,
        updated: updates.length,
      };


      // Update cache with results
      const allUpdates = [...cachedUpdates];
      
      result.updates.forEach(update => {
        statusCache[update.id] = {
          lastChecked: now,
          result: update,
        };
        allUpdates.push(update);
      });

      // Cache negative results (no updates) for stories that were checked but didn't change
      uncachedStoryIds.forEach(storyId => {
        if (!result.updates.find(update => update.id === storyId)) {
          statusCache[storyId] = {
            lastChecked: now,
            result: null, // No update needed
          };
        }
      });

      console.log(`Status check completed: ${result.checked} checked, ${result.updated} updated, ${cachedUpdates.length} from cache`);
      
      return allUpdates;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return cachedUpdates;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to check story status';
      console.error('Story status update error:', err);
      setError(errorMessage);
      
      // Return cached results on error
      return cachedUpdates;
    } finally {
      setIsUpdating(false);
      abortControllerRef.current = null;
    }
  }, []);

  return {
    updateStoriesStatus,
    isUpdating,
    error,
  };
}

// Utility function to clear cache (useful for testing or forced refresh)
export function clearStatusCache() {
  Object.keys(statusCache).forEach(key => {
    delete statusCache[key];
  });
}

// Utility function to get cache statistics (useful for debugging)
export function getStatusCacheStats() {
  const now = Date.now();
  const entries = Object.entries(statusCache);
  const fresh = entries.filter(([, data]) => (now - data.lastChecked) < CACHE_DURATION);
  const stale = entries.length - fresh.length;
  
  return {
    total: entries.length,
    fresh: fresh.length,
    stale,
    cacheDuration: CACHE_DURATION,
  };
}