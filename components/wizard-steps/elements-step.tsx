"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ElementsStepProps {
  preferences: any;
  onUpdate: (data: any) => void;
}

const tropes = [
  "Enemies to Lovers", "Friends to Lovers", "Second Chance Romance", "Fake Dating",
  "Arranged Marriage", "Opposites Attract", "Secret Identity", "Forbidden Love",
  "Workplace Romance", "Childhood Friends", "Grumpy/Sunshine", "Single Parent",
  "Forced Proximity", "Love Triangle", "Reunion Romance", "Marriage of Convenience"
];

const heatLevels = [
  { id: "sweet", name: "Sweet", description: "Kisses and hand-holding" },
  { id: "warm", name: "Warm", description: "Some passion, fade to black" },
  { id: "steamy", name: "Steamy", description: "Explicit romantic scenes" },
  { id: "scorching", name: "Scorching", description: "Very explicit content" },
];

const storyLengths = [
  { id: "short", name: "Short Story", description: "2,000-5,000 words" },
  { id: "novella", name: "Novella", description: "15,000-40,000 words" },
  { id: "novel", name: "Full Novel", description: "80,000+ words" },
];

const conflictTypes = [
  { id: "internal", name: "Internal Conflict", description: "Personal struggles and growth" },
  { id: "external", name: "External Conflict", description: "Outside forces and obstacles" },
  { id: "both", name: "Both", description: "Mix of internal and external challenges" },
];

export function ElementsStep({ preferences, onUpdate }: ElementsStepProps) {
  const updateElements = (field: string, value: any) => {
    onUpdate({
      elements: {
        ...preferences.elements,
        [field]: value
      }
    });
  };

  const toggleTrope = (trope: string) => {
    const currentTropes = preferences.elements.tropes || [];
    if (currentTropes.includes(trope)) {
      updateElements("tropes", currentTropes.filter((t: string) => t !== trope));
    } else if (currentTropes.length < 3) {
      updateElements("tropes", [...currentTropes, trope]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-heading mb-2">Romance Tropes</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose up to 3 tropes you'd like to include</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {preferences.elements.tropes?.map((trope: string) => (
            <Badge key={trope} variant="secondary" className="flex items-center gap-1">
              {trope}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleTrope(trope)}
              />
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {tropes.map((trope) => (
            <Button
              key={trope}
              variant="outline"
              size="sm"
              disabled={
                preferences.elements.tropes?.includes(trope) || 
                preferences.elements.tropes?.length >= 3
              }
              onClick={() => toggleTrope(trope)}
            >
              {trope}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-heading mb-4">Heat Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heatLevels.map((level) => (
            <Card
              key={level.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                preferences.elements.heat_level === level.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:border-primary/20"
              }`}
              onClick={() => updateElements("heat_level", level.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{level.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{level.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-heading mb-4">Story Length</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {storyLengths.map((length) => (
            <Card
              key={length.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                preferences.elements.story_length === length.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:border-primary/20"
              }`}
              onClick={() => updateElements("story_length", length.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{length.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{length.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-heading mb-4">Conflict Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {conflictTypes.map((conflict) => (
            <Card
              key={conflict.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                preferences.elements.conflict_type === conflict.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:border-primary/20"
              }`}
              onClick={() => updateElements("conflict_type", conflict.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{conflict.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{conflict.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}