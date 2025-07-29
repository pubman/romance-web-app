"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Crown, Sparkles, Coffee, Sword } from "lucide-react";

interface GenreStepProps {
  preferences: any;
  onUpdate: (data: any) => void;
}

const genres = [
  {
    id: "contemporary",
    name: "Contemporary",
    description: "Modern-day romance with relatable characters",
    icon: Coffee,
    color: "text-blue-500"
  },
  {
    id: "historical",
    name: "Historical",
    description: "Romance set in bygone eras with rich period details",
    icon: Crown,
    color: "text-purple-500"
  },
  {
    id: "fantasy",
    name: "Fantasy",
    description: "Magical worlds with supernatural romance",
    icon: Sparkles,
    color: "text-pink-500"
  },
  {
    id: "paranormal",
    name: "Paranormal",
    description: "Romance with vampires, werewolves, and otherworldly beings",
    icon: Sword,
    color: "text-red-500"
  },
];

const moods = [
  { id: "sweet", name: "Sweet & Tender", description: "Gentle, heartwarming romance" },
  { id: "passionate", name: "Passionate", description: "Intense emotional connection" },
  { id: "dramatic", name: "Dramatic", description: "High stakes and emotional conflict" },
  { id: "playful", name: "Playful", description: "Light-hearted and fun romance" },
  { id: "mysterious", name: "Mysterious", description: "Romance with secrets and intrigue" },
];

export function GenreStep({ preferences, onUpdate }: GenreStepProps) {
  const handleGenreSelect = (genreId: string) => {
    onUpdate({ genre: genreId });
  };

  const handleMoodSelect = (moodId: string) => {
    onUpdate({ mood: moodId });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-heading mb-4">Choose Your Genre</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {genres.map((genre) => {
            const Icon = genre.icon;
            return (
              <Card 
                key={genre.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  preferences.genre === genre.id 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:border-primary/20"
                }`}
                onClick={() => handleGenreSelect(genre.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${genre.color}`} />
                    <CardTitle className="text-base">{genre.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{genre.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-heading mb-4">Set the Mood</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {moods.map((mood) => (
            <Button
              key={mood.id}
              variant={preferences.mood === mood.id ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => handleMoodSelect(mood.id)}
            >
              <span className="font-medium">{mood.name}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {mood.description}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}