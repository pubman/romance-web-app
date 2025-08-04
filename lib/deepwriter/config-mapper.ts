import { RomanceGenerationConfig } from './types';

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

/**
 * Maps story preferences from the wizard to DeepWriter generation configuration
 */
export function mapStoryPreferencesToConfig(
  preferences: StoryPreferences
): RomanceGenerationConfig {
  const { elements, setting, genre } = preferences;

  // Determine page length based on story length preference
  const pageLength = getPageLengthForStoryLength(elements.story_length);
  const maxPages = getMaxPagesForStoryLength(elements.story_length);

  // Enable table of contents for longer stories
  const enableTableOfContents = elements.story_length === 'novel';

  // Enable technical diagrams for complex stories with multiple characters/families
  const enableTechnicalDiagrams = shouldEnableTechnicalDiagrams(preferences);

  // Determine if web research should be used (especially for historical settings)
  const useWebResearch = shouldUseWebResearch(setting, genre);

  // Generate research URLs for historical contexts
  const researchUrls = generateResearchUrls(setting, genre);

  // Generate questions and answers for character/plot development
  const questionsAndAnswers = generateQuestionsAndAnswers(preferences);

  return {
    enableTableOfContents,
    enableTechnicalDiagrams,
    useWebResearch,
    pageLength,
    maxPages,
    researchUrls,
    questionsAndAnswers,
    mode: 'deepwriter', // Always use enhanced mode for romance
  };
}

function getPageLengthForStoryLength(storyLength: string): number {
  switch (storyLength) {
    case 'short':
      return 3; // ~10-15k words
    case 'novella':
      return 8; // ~20-40k words
    case 'novel':
      return 15; // ~60-80k words
    default:
      return 5; // Default medium length
  }
}

function getMaxPagesForStoryLength(storyLength: string): number {
  switch (storyLength) {
    case 'short':
      return 5;
    case 'novella':
      return 15;
    case 'novel':
      return 25;
    default:
      return 10;
  }
}

function shouldEnableTechnicalDiagrams(preferences: StoryPreferences): boolean {
  const { elements, genre } = preferences;
  
  // Enable for fantasy/paranormal (for world-building)
  if (genre === 'fantasy' || genre === 'paranormal') {
    return true;
  }
  
  // Enable for longer stories with complex relationships
  if (elements.story_length === 'novel') {
    return true;
  }
  
  // Enable for specific tropes that benefit from visual aids
  const complexTropes = ['enemies to lovers', 'fake relationship', 'arranged marriage'];
  return elements.tropes.some(trope => 
    complexTropes.some(complexTrope => 
      trope.toLowerCase().includes(complexTrope)
    )
  );
}

function shouldUseWebResearch(
  setting: StoryPreferences['setting'], 
  genre: string
): 'auto' | 'on' | 'off' {
  // Always use research for historical settings
  if (genre === 'historical' || 
      setting.time_period === 'regency' || 
      setting.time_period === 'victorian' || 
      setting.time_period === 'medieval') {
    return 'on';
  }
  
  // Use auto for contemporary with specific locations
  if (genre === 'contemporary' && 
      setting.location && 
      !setting.location.toLowerCase().includes('generic')) {
    return 'auto';
  }
  
  return 'auto'; // Default to auto for balanced research
}

function generateResearchUrls(
  setting: StoryPreferences['setting'], 
  genre: string
): string[] {
  const urls: string[] = [];
  
  if (genre === 'historical') {
    if (setting.time_period === 'regency') {
      urls.push(
        'https://www.britannica.com/event/Regency',
        'https://janeausten.co.uk/blogs/regency-life'
      );
    } else if (setting.time_period === 'victorian') {
      urls.push(
        'https://www.britannica.com/event/Victorian-era',
        'https://www.bl.uk/victorian-britain'
      );
    }
  }
  
  // Add location-specific research for detailed settings
  if (setting.location && !setting.location.toLowerCase().includes('generic')) {
    // Note: In a real implementation, you might want to add specific location URLs
    // For now, we'll keep it general to avoid invalid URLs
  }
  
  return urls;
}

function generateQuestionsAndAnswers(preferences: StoryPreferences): Array<{
  question: string;
  answer: string;
}> {
  const { characters, elements, setting } = preferences;
  
  const qa = [];
  
  // Character development questions
  qa.push({
    question: `What drives the main conflict between ${characters.protagonist.name} and ${characters.love_interest.name}?`,
    answer: `The conflict stems from their contrasting backgrounds: ${characters.protagonist.name} as a ${characters.protagonist.occupation} with traits like ${characters.protagonist.traits.slice(0, 2).join(' and ')}, versus ${characters.love_interest.name} as a ${characters.love_interest.occupation} with ${characters.love_interest.traits.slice(0, 2).join(' and ')} characteristics.`
  });
  
  // Setting-based questions
  qa.push({
    question: `How does the ${setting.time_period} setting in ${setting.location} influence the romance?`,
    answer: `The ${setting.atmosphere} atmosphere of ${setting.location} creates unique challenges and opportunities for romance, particularly considering the social constraints and expectations of the ${setting.time_period} period.`
  });
  
  // Trope-specific questions
  if (elements.tropes.length > 0) {
    qa.push({
      question: `How do the chosen tropes (${elements.tropes.slice(0, 2).join(', ')}) enhance the romantic tension?`,
      answer: `These tropes create natural obstacles and emotional stakes that force the characters to confront their feelings and grow, building towards a satisfying romantic resolution.`
    });
  }
  
  return qa;
}