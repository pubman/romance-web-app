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
  const response = await fetch('/api/format-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      projectId: projectId || '123e4567-e89b-12d3-a456-426614174000', // Default project ID
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to format prompt');
  }

  const data = await response.json();
  return data.formattedPrompt || prompt;
}