"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface CharacterStepProps {
  preferences: any;
  onUpdate: (data: any) => void;
}

const personalityTraits = [
  "Ambitious", "Kind", "Mysterious", "Witty", "Protective", "Independent",
  "Charming", "Stubborn", "Artistic", "Athletic", "Intellectual", "Adventurous",
  "Shy", "Confident", "Loyal", "Sarcastic", "Gentle", "Fierce"
];

const occupations = [
  "Doctor", "Teacher", "Artist", "Chef", "Lawyer", "Engineer", "Writer",
  "Musician", "Business Owner", "Scientist", "Detective", "Photographer",
  "Architect", "Therapist", "Veterinarian", "Journalist"
];

// Character card component moved outside to prevent recreation on each render
interface CharacterCardProps {
  title: string;
  type: "protagonist" | "love_interest";
  character: any;
  onUpdateCharacter: (type: "protagonist" | "love_interest", field: string, value: any) => void;
  onAddTrait: (type: "protagonist" | "love_interest", trait: string) => void;
  onRemoveTrait: (type: "protagonist" | "love_interest", trait: string) => void;
}

function CharacterCard({ 
  title, 
  type, 
  character,
  onUpdateCharacter,
  onAddTrait,
  onRemoveTrait
}: CharacterCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Define your character&apos;s identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`${type}-name`}>Name</Label>
          <Input
            id={`${type}-name`}
            value={character.name || ""}
            onChange={(e) => onUpdateCharacter(type, "name", e.target.value)}
            placeholder="Enter character name"
          />
        </div>

        <div>
          <Label htmlFor={`${type}-occupation`}>Occupation</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
            {occupations.slice(0, 8).map((occupation) => (
              <Button
                key={occupation}
                variant={character.occupation === occupation ? "default" : "outline"}
                size="sm"
                onClick={() => onUpdateCharacter(type, "occupation", occupation)}
              >
                {occupation}
              </Button>
            ))}
          </div>
          <Input
            id={`${type}-occupation`}
            value={character.occupation || ""}
            onChange={(e) => onUpdateCharacter(type, "occupation", e.target.value)}
            placeholder="Or enter custom occupation"
          />
        </div>

        <div>
          <Label>Personality Traits (Choose up to 4)</Label>
          <div className="flex flex-wrap gap-1 mt-2 mb-3">
            {character.traits?.map((trait: string) => (
              <Badge key={trait} variant="secondary" className="flex items-center gap-1">
                {trait}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onRemoveTrait(type, trait)}
                />
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {personalityTraits.map((trait) => (
              <Button
                key={trait}
                variant="outline"
                size="sm"
                disabled={character.traits?.includes(trait) || character.traits?.length >= 4}
                onClick={() => onAddTrait(type, trait)}
              >
                {trait}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CharacterStep({ preferences, onUpdate }: CharacterStepProps) {
  const updateCharacter = (type: "protagonist" | "love_interest", field: string, value: any) => {
    onUpdate({
      characters: {
        ...preferences.characters,
        [type]: {
          ...preferences.characters[type],
          [field]: value
        }
      }
    });
  };

  const addTrait = (type: "protagonist" | "love_interest", trait: string) => {
    const currentTraits = preferences.characters[type].traits || [];
    if (!currentTraits.includes(trait) && currentTraits.length < 4) {
      updateCharacter(type, "traits", [...currentTraits, trait]);
    }
  };

  const removeTrait = (type: "protagonist" | "love_interest", trait: string) => {
    const currentTraits = preferences.characters[type].traits || [];
    updateCharacter(type, "traits", currentTraits.filter((t: string) => t !== trait));
  };

  return (
    <div className="space-y-6">
      <CharacterCard 
        title="Main Character" 
        type="protagonist" 
        character={preferences.characters.protagonist}
        onUpdateCharacter={updateCharacter}
        onAddTrait={addTrait}
        onRemoveTrait={removeTrait}
      />
      <CharacterCard 
        title="Love Interest" 
        type="love_interest" 
        character={preferences.characters.love_interest}
        onUpdateCharacter={updateCharacter}
        onAddTrait={addTrait}
        onRemoveTrait={removeTrait}
      />
    </div>
  );
}