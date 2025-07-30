"use client";

import { StoryCard } from "@/components/story-card";
import { DatabaseStory } from "@/hooks/use-user-stories";
import { Heart, BookOpen } from "lucide-react";

// Legacy story interface for guest stories
interface LegacyStory {
  id: string;
  title: string;
  genre: string;
  createdAt?: string;
  sharedAt?: string;
  author?: string;
  excerpt: string;
  isPublic?: boolean;
  characters: string[];
  isDemo?: boolean;
}

interface StoryGridProps {
  stories: DatabaseStory[] | LegacyStory[];
  showAuthor?: boolean;
}

// Function to check if story is legacy format
function isLegacyStory(story: DatabaseStory | LegacyStory): story is LegacyStory {
  return 'excerpt' in story && 'genre' in story && !('status' in story);
}

// Function to convert legacy story to database story format
function convertLegacyStory(story: LegacyStory): DatabaseStory {
  return {
    id: story.id,
    title: story.title,
    description: story.excerpt,
    cover_image_url: null,
    status: 'completed' as const,
    is_public: story.isPublic || false,
    word_count: 0,
    chapter_count: 1,
    story_preferences: {
      genre: story.genre
    },
    wizard_data: {
      characters: {
        protagonist: story.characters[0] ? { name: story.characters[0] } : undefined,
        love_interest: story.characters[1] ? { name: story.characters[1] } : undefined
      }
    },
    generation_progress: 100,
    created_at: story.createdAt || story.sharedAt || new Date().toISOString(),
    updated_at: story.createdAt || story.sharedAt || new Date().toISOString()
  };
}

export function StoryGrid({ stories, showAuthor = false }: StoryGridProps) {
  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-card/60 backdrop-blur-sm rounded-full p-6 mb-4">
          {showAuthor ? (
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Heart className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-xl font-heading text-foreground mb-2">
          {showAuthor ? "No shared stories yet" : "No stories yet"}
        </h3>
        <p className="text-muted-foreground text-center max-w-sm">
          {showAuthor 
            ? "Stories shared with you will appear here. Start connecting with other writers!"
            : "Ready to create your first romantic tale? Click the 'Create New Story' button to begin your journey."
          }
        </p>
      </div>
    );
  }

  // Convert legacy stories to database format for consistency
  const normalizedStories: DatabaseStory[] = stories.map(story => 
    isLegacyStory(story) ? convertLegacyStory(story) : story
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {normalizedStories.map((story) => (
        <StoryCard key={story.id} story={story} showAuthor={showAuthor} />
      ))}
    </div>
  );
}