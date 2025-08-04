// Story preferences interface from existing StoryWizard
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

export function generateDeepWriterPrompt(preferences: StoryPreferences): string {
  // Validate preferences
  validateStoryPreferences(preferences);

  const {
    genre,
    mood,
    characters,
    setting,
    elements,
  } = preferences;

  // Build the comprehensive prompt
  const prompt = `
Create a ${mood.toLowerCase()} ${genre.toLowerCase()} romance novel with the following specifications:

**Main Characters:**
- Protagonist: ${characters.protagonist.name}, a ${characters.protagonist.occupation}
  Character traits: ${characters.protagonist.traits.join(', ')}
- Love Interest: ${characters.love_interest.name}, a ${characters.love_interest.occupation}  
  Character traits: ${characters.love_interest.traits.join(', ')}

**Setting:**
- Time Period: ${getTimePeriodDescription(setting.time_period)}
- Location: ${setting.location}
- Atmosphere: ${getAtmosphereDescription(setting.atmosphere)}

**Story Elements:**
- Romance Tropes: ${elements.tropes.join(', ')}
- Heat Level: ${getHeatLevelDescription(elements.heat_level)}
- Story Length: ${getStoryLengthDescription(elements.story_length)}
- Conflict Type: ${getConflictDescription(elements.conflict_type)}

**Writing Style Guidelines:**
- Mood: ${getMoodDescription(mood)}
- Genre: ${getGenreDescription(genre)}

Please create an engaging romance story that incorporates all these elements naturally. Focus on character development, emotional depth, and satisfying romantic tension that builds throughout the story.

${getAdditionalGuidelines(elements.heat_level, elements.story_length)}
`.trim();

  // Validate the generated prompt
  validatePrompt(prompt);

  return prompt;
}

function validateStoryPreferences(preferences: StoryPreferences): void {
  if (!preferences.genre || !preferences.mood) {
    throw new Error('Genre and mood are required');
  }
  
  if (!preferences.characters.protagonist.name || !preferences.characters.love_interest.name) {
    throw new Error('Character names are required');
  }
  
  if (!preferences.setting.location) {
    throw new Error('Setting location is required');
  }
  
  if (!preferences.elements.tropes || preferences.elements.tropes.length === 0) {
    throw new Error('At least one trope is required');
  }
}

function validatePrompt(prompt: string): void {
  const maxLength = 10000; // Reasonable max length for API
  const minLength = 100;   // Minimum meaningful prompt length
  
  if (prompt.length < minLength) {
    throw new Error(`Generated prompt too short: ${prompt.length} characters (minimum: ${minLength})`);
  }
  
  if (prompt.length > maxLength) {
    throw new Error(`Generated prompt too long: ${prompt.length} characters (maximum: ${maxLength})`);
  }
  
  // Check if prompt seems complete (should end with guidelines)
  if (!prompt.includes('**Additional Guidelines:**')) {
    throw new Error('Generated prompt appears incomplete - missing additional guidelines section');
  }
  
  // Check for incomplete sections
  if (prompt.includes('undefined') || prompt.includes('null')) {
    throw new Error('Generated prompt contains undefined values');
  }
  
  console.log('Prompt validation passed:', {
    length: prompt.length,
    hasGuidelines: prompt.includes('**Additional Guidelines:**'),
    preview: prompt.substring(0, 200) + '...'
  });
}

function getTimePeriodDescription(period: string): string {
  const descriptions: { [key: string]: string } = {
    present: "Contemporary present day",
    recent: "Recent past (1990s-2000s)",
    vintage: "Mid-20th century (1940s-1960s)",
    regency: "Regency England (1811-1820)",
    victorian: "Victorian era (1837-1901)",
    medieval: "Medieval times",
  };
  return descriptions[period] || period;
}

function getAtmosphereDescription(atmosphere: string): string {
  const descriptions: { [key: string]: string } = {
    cozy: "Intimate, warm, and comfortable setting",
    glamorous: "Luxurious, sophisticated, and elegant environment",
    rustic: "Natural, countryside, or small-town charm",
    urban: "Modern city life with fast-paced energy",
    exotic: "Unique, adventurous, and culturally rich location",
    mysterious: "Intriguing, secretive, and atmospheric setting",
  };
  return descriptions[atmosphere] || atmosphere;
}

function getHeatLevelDescription(level: string): string {
  const descriptions: { [key: string]: string } = {
    sweet: "Sweet and innocent romance with minimal physical intimacy",
    warm: "Moderate romance with some passionate moments",
    steamy: "Passionate romance with explicit intimate scenes",
    scorching: "Very explicit and intense romantic and physical scenes",
  };
  return descriptions[level] || level;
}

function getStoryLengthDescription(length: string): string {
  const descriptions: { [key: string]: string } = {
    short: "Short story (approximately 10,000-15,000 words)",
    novella: "Novella length (approximately 20,000-40,000 words)",
    novel: "Full-length novel (approximately 60,000-80,000 words)",
  };
  return descriptions[length] || length;
}

function getConflictDescription(conflict: string): string {
  const descriptions: { [key: string]: string } = {
    internal: "Focus on internal struggles, personal growth, and emotional conflicts",
    external: "External obstacles, societal pressures, or situational challenges",
    both: "Combination of internal character development and external plot challenges",
  };
  return descriptions[conflict] || conflict;
}

function getMoodDescription(mood: string): string {
  const descriptions: { [key: string]: string } = {
    sweet: "Tender, heartwarming, and gentle storytelling",
    passionate: "Intense emotions and deep romantic feelings",
    dramatic: "High stakes, emotional tension, and compelling conflicts",
    playful: "Light-hearted, fun, and often humorous tone",
    mysterious: "Intriguing, suspenseful, and atmospheric writing",
  };
  return descriptions[mood] || mood;
}

function getGenreDescription(genre: string): string {
  const descriptions: { [key: string]: string } = {
    contemporary: "Modern-day realistic romance",
    historical: "Period-specific romance with historical accuracy",
    fantasy: "Romance in fantastical worlds with magical elements",
    paranormal: "Romance involving supernatural beings or elements",
  };
  return descriptions[genre] || genre;
}

function getAdditionalGuidelines(heatLevel: string, storyLength: string): string {
  let guidelines = "\n**Additional Guidelines:**\n";
  
  if (heatLevel === "sweet") {
    guidelines += "- Keep intimate scenes tasteful and fade-to-black when appropriate\n";
    guidelines += "- Focus on emotional connection and romantic tension\n";
  } else if (heatLevel === "scorching") {
    guidelines += "- Include detailed and explicit intimate scenes\n";
    guidelines += "- Balance physical passion with emotional development\n";
  }

  if (storyLength === "short") {
    guidelines += "- Create a focused, single-conflict story arc\n";
    guidelines += "- Develop characters efficiently while maintaining depth\n";
  } else if (storyLength === "novel") {
    guidelines += "- Develop complex character arcs and multiple plot threads\n";
    guidelines += "- Include subplots and supporting character development\n";
  }

  guidelines += "- Ensure a satisfying and emotionally fulfilling conclusion\n";
  guidelines += "- Maintain consistent character voice and development throughout";

  return guidelines;
}