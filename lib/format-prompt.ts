import { StoryPreferences } from '@/components/story-wizard';

export function generatePromptFromPreferences(preferences: StoryPreferences): string {
  const {
    genre,
    mood,
    characters,
    setting,
    elements,
  } = preferences;

  const prompt = `Create a ${mood.toLowerCase()} ${genre.toLowerCase()} romance novel with the following specifications:

**Main Characters:**
- Protagonist: ${characters.protagonist.name}, a ${characters.protagonist.occupation}
  Character traits: ${characters.protagonist.traits.join(', ')}
- Love Interest: ${characters.love_interest.name}, a ${characters.love_interest.occupation}  
  Character traits: ${characters.love_interest.traits.join(', ')}

**Setting:**
- Time Period: ${setting.time_period}
- Location: ${setting.location}
- Atmosphere: ${setting.atmosphere}

**Story Elements:**
- Romance Tropes: ${elements.tropes.join(', ')}
- Heat Level: ${elements.heat_level}
- Story Length: ${elements.story_length}
- Conflict Type: ${elements.conflict_type}

**Writing Style Guidelines:**
- Mood: ${mood}
- Genre: ${genre}

Please create an engaging romance story that incorporates all these elements naturally. Focus on character development, emotional depth, and satisfying romantic tension that builds throughout the story.`.trim();

  return prompt;
}

export async function formatPromptWithAPI(prompt: string, projectId?: string): Promise<string> {
  try {
    const response = await fetch('/api/format-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        projectId: projectId || '123e4567-e89b-12d3-a456-426614174000',
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to format prompt';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        
        // Log detailed error info for debugging
        console.error('Format prompt API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestId: errorData.requestId
        });
        
        // If it's a configuration error in development, provide helpful message
        if (errorData.details && errorData.suggestion) {
          throw new Error(`${errorMessage}: ${errorData.suggestion}`);
        }
        
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Log success info
    console.log('Format prompt success:', {
      requestId: data.requestId,
      mock: data.mock,
      warning: data.warning
    });
    
    // Show warning for mock responses in development
    if (data.mock && data.warning) {
      console.warn('DeepWriter API Mock Response:', data.warning);
    }
    
    return data.formattedPrompt || prompt;
    
  } catch (error) {
    console.error('Format prompt request failed:', error);
    throw error;
  }
}