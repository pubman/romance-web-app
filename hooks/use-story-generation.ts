import { useState, useCallback } from 'react';

interface StoryPreferences {
  genre: string;
  mood: string;
  characters: {
    protagonist: { name: string; traits: string[]; occupation: string };
    love_interest: { name: string; traits: string[]; occupation: string };
  };
  setting: {
    time_period: string;
    location: string;
    atmosphere: string;
  };
  elements: {
    tropes: string[];
    heat_level: string;
    story_length: string;
    conflict_type: string;
  };
}

interface StoryGenerationResult {
  story: {
    id: string;
    title: string;
    status: string;
    generation_progress: number;
  };
  job: {
    id: string;
    status: string;
    progress: number;
  };
}

interface UseStoryGenerationReturn {
  generateStory: (title: string, preferences: StoryPreferences) => Promise<StoryGenerationResult | null>;
  isGenerating: boolean;
  error: string | null;
}

export function useStoryGeneration(): UseStoryGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStory = useCallback(async (
    title: string,
    preferences: StoryPreferences
  ): Promise<StoryGenerationResult | null> => {
    if (!title || !preferences) {
      setError('Title and preferences are required');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          preferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Please log in to generate stories');
        } else if (response.status === 402) {
          throw new Error('Insufficient credits. Please upgrade your plan or wait for your credits to reset.');
        } else {
          throw new Error(errorData.error || 'Failed to generate story');
        }
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Story generation failed');
      }

      return result as StoryGenerationResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Story generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateStory,
    isGenerating,
    error,
  };
}