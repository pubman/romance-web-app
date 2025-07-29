"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ReadingProgressItem } from "@/hooks/use-reading-progress";

interface ReadingProgressCardProps {
  progress: ReadingProgressItem;
}

export function ReadingProgressCard({ progress }: ReadingProgressCardProps) {
  const { story } = progress;
  
  // Format the last read date
  const lastReadDate = new Date(progress.last_read_at);
  const isToday = new Date().toDateString() === lastReadDate.toDateString();
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === lastReadDate.toDateString();
  
  let lastReadText = "";
  if (isToday) {
    lastReadText = `Today at ${lastReadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    lastReadText = `Yesterday at ${lastReadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    lastReadText = lastReadDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: lastReadDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  // Format reading time
  const readingHours = Math.floor(progress.reading_time_minutes / 60);
  const readingMinutes = progress.reading_time_minutes % 60;
  let readingTimeText = "";
  if (readingHours > 0) {
    readingTimeText = `${readingHours}h ${readingMinutes}m`;
  } else {
    readingTimeText = `${readingMinutes}m`;
  }

  // Get genre from story preferences
  const genre = story.story_preferences?.genre || story.story_preferences?.elements?.genre || "Romance";

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 bg-card/60 backdrop-blur-sm border hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Cover Image or Placeholder */}
          <div className="flex-shrink-0">
            {story.cover_image_url ? (
              <img 
                src={story.cover_image_url} 
                alt={story.title}
                className="w-12 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-12 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-md flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>

          {/* Story Info */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-heading line-clamp-1 group-hover:text-primary transition-colors">
              {story.title}
            </CardTitle>
            {story.description && (
              <CardDescription className="text-sm mt-1 line-clamp-2">
                {story.description}
              </CardDescription>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {genre}
              </Badge>
              {story.chapter_count > 1 && (
                <Badge variant="outline" className="text-xs">
                  Chapter {progress.current_chapter} of {story.chapter_count}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.percentage_complete}%</span>
          </div>
          <Progress value={progress.percentage_complete} className="h-2" />
        </div>

        {/* Reading Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{readingTimeText} read</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{lastReadText}</span>
          </div>
        </div>

        {/* Word Count */}
        <div className="text-xs text-muted-foreground">
          {story.word_count > 0 && (
            <span>{story.word_count.toLocaleString()} words</span>
          )}
        </div>

        {/* Continue Reading Button */}
        <Button 
          asChild 
          variant="outline" 
          size="sm" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        >
          <Link href={`/story/${story.id}`}>
            <BookOpen className="mr-2 h-4 w-4" />
            Continue Reading
            <ChevronRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}