"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    genre: string;
    createdAt?: string;
    sharedAt?: string;
    author?: string;
    excerpt: string;
    isPublic?: boolean;
    characters: string[];
  };
  showAuthor?: boolean;
}

export function StoryCard({ story, showAuthor = false }: StoryCardProps) {
  const date = story.createdAt || story.sharedAt;
  const formattedDate = date ? new Date(date).toLocaleDateString() : "";

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 bg-card/60 backdrop-blur-sm border hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-heading line-clamp-1 group-hover:text-primary transition-colors">
              {story.title}
            </CardTitle>
            {showAuthor && story.author && (
              <CardDescription className="text-sm mt-1">
                by {story.author}
              </CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/story/${story.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Story
                </Link>
              </DropdownMenuItem>
              {!showAuthor && (
                <>
                  <DropdownMenuItem>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Heart className="mr-2 h-4 w-4" />
                    Edit Preferences
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {story.genre}
          </Badge>
          {!showAuthor && story.isPublic && (
            <Badge variant="outline" className="text-xs">
              Public
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {story.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Characters:</span>
            <span className="font-medium">{story.characters.join(", ")}</span>
          </div>
          {formattedDate && (
            <span>{showAuthor ? "Shared" : "Created"} {formattedDate}</span>
          )}
        </div>
        
        <div className="mt-4">
          <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Link href={`/story/${story.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Read Story
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}