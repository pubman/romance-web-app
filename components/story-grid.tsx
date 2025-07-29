"use client";

import { StoryCard } from "@/components/story-card";
import { Heart, BookOpen } from "lucide-react";

interface Story {
  id: string;
  title: string;
  genre: string;
  createdAt?: string;
  sharedAt?: string;
  author?: string;
  excerpt: string;
  isPublic?: boolean;
  characters: string[];
}

interface StoryGridProps {
  stories: Story[];
  showAuthor?: boolean;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} showAuthor={showAuthor} />
      ))}
    </div>
  );
}