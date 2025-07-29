"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GenreStep } from "@/components/wizard-steps/genre-step";
import { CharacterStep } from "@/components/wizard-steps/character-step";
import { SettingStep } from "@/components/wizard-steps/setting-step";
import { ElementsStep } from "@/components/wizard-steps/elements-step";
import { ReviewStep } from "@/components/wizard-steps/review-step";

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

const steps = [
  { id: 1, title: "Genre & Mood", description: "Choose your story's style" },
  { id: 2, title: "Characters", description: "Create your protagonists" },
  { id: 3, title: "Setting", description: "Set the scene" },
  { id: 4, title: "Story Elements", description: "Add romantic elements" },
  { id: 5, title: "Review", description: "Final touches" },
];

export function StoryWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState<StoryPreferences>({
    genre: "",
    mood: "",
    characters: {
      protagonist: { name: "", traits: [], occupation: "" },
      love_interest: { name: "", traits: [], occupation: "" },
    },
    setting: {
      time_period: "",
      location: "",
      atmosphere: "",
    },
    elements: {
      tropes: [],
      heat_level: "",
      story_length: "",
      conflict_type: "",
    },
  });

  const progress = (currentStep / steps.length) * 100;

  const updatePreferences = (stepData: Partial<StoryPreferences>) => {
    setPreferences(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate story generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Redirect to the generated story (mock ID)
    router.push("/story/generated-story-123");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.genre && preferences.mood;
      case 2:
        return preferences.characters.protagonist.name && preferences.characters.love_interest.name;
      case 3:
        return preferences.setting.time_period && preferences.setting.location;
      case 4:
        return preferences.elements.tropes.length > 0 && preferences.elements.heat_level;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <GenreStep preferences={preferences} onUpdate={updatePreferences} />;
      case 2:
        return <CharacterStep preferences={preferences} onUpdate={updatePreferences} />;
      case 3:
        return <SettingStep preferences={preferences} onUpdate={updatePreferences} />;
      case 4:
        return <ElementsStep preferences={preferences} onUpdate={updatePreferences} />;
      case 5:
        return <ReviewStep preferences={preferences} onGenerate={handleGenerate} isGenerating={isGenerating} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-3xl font-heading">Create Your Story</CardTitle>
              <CardDescription className="text-lg mt-2">
                Let's craft your perfect romance tale together
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Step {currentStep} of {steps.length}</p>
              <p className="font-heading text-lg">{steps[currentStep - 1].title}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step) => (
                <span key={step.id} className={currentStep >= step.id ? "text-primary font-medium" : ""}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-8">
            <h2 className="text-xl font-heading mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
          </div>

          {renderStep()}

          {currentStep < steps.length && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-primary hover:bg-primary/90"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}