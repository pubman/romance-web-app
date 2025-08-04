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

export interface FormatPromptError {
  message: string;
  statusCode?: number;
  requestId?: string;
  retryable: boolean;
  suggestion?: string;
}

export interface FormatPromptResult {
  success: true;
  formattedPrompt: string;
  mock?: boolean;
  warning?: string;
}

export type FormatPromptResponse = FormatPromptResult | { success: false; error: FormatPromptError };

export async function formatPromptWithAPI(prompt: string, projectId?: string): Promise<FormatPromptResponse> {
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
      let suggestion: string | undefined;
      let retryable = true;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        
        // Check for specific error messages first
        if (errorData.error && typeof errorData.error === 'string') {
          if (errorData.error.includes('credits than your current balance')) {
            errorMessage = 'Insufficient DeepWriter credits to enhance this prompt.';
            suggestion = 'Please add more credits to your DeepWriter account or try again later.';
            retryable = false;
          } else if (errorData.error.includes('credits')) {
            errorMessage = 'Credit-related error with DeepWriter API.';
            suggestion = 'Please check your DeepWriter account balance.';
            retryable = false;
          }
        }

        // Provide user-friendly error messages based on status code
        if (!suggestion) {
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid prompt format. Please check that your outline is not empty and try again.';
              suggestion = 'Make sure your story outline contains text and is properly formatted.';
              retryable = false;
              break;
            case 401:
              errorMessage = 'Authentication failed with DeepWriter API.';
              suggestion = 'Please check your API key configuration or contact support.';
              retryable = false;
              break;
            case 403:
              errorMessage = 'Access denied to DeepWriter API.';
              suggestion = 'Please verify your API key permissions.';
              retryable = false;
              break;
            case 404:
              errorMessage = 'DeepWriter API endpoint not found.';
              suggestion = 'Please check your API URL configuration.';
              retryable = false;
              break;
            case 429:
              errorMessage = 'Too many requests. Please wait a moment before trying again.';
              suggestion = 'Wait a few seconds and try again.';
              retryable = true;
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              errorMessage = 'DeepWriter service is temporarily unavailable.';
              suggestion = 'Please try again in a few moments.';
              retryable = true;
              break;
            default:
              if (errorData.error) {
                errorMessage = errorData.error;
              }
          }
        }
        
        // Log detailed error info for debugging
        console.error('Format prompt API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestId: errorData.requestId
        });
        
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
      }
      
      return {
        success: false,
        error: {
          message: errorMessage,
          statusCode: response.status,
          retryable,
          suggestion,
        }
      };
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
    
    return {
      success: true,
      formattedPrompt: data.formattedPrompt || prompt,
      mock: data.mock,
      warning: data.warning
    };
    
  } catch (error) {
    console.error('Format prompt request failed:', error);
    
    // Handle network errors
    let errorMessage = 'Failed to connect to the service.';
    const retryable = true;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: {
        message: errorMessage,
        retryable,
        suggestion: 'Please check your internet connection and try again.'
      }
    };
  }
}