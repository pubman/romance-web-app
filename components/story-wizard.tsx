"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoryGeneration } from "@/hooks/use-story-generation";
import { DatabaseStory } from "@/hooks/use-user-stories";

import { GenreStep } from "@/components/wizard-steps/genre-step";
import { CharacterStep } from "@/components/wizard-steps/character-step";
import { SettingStep } from "@/components/wizard-steps/setting-step";
import { ElementsStep } from "@/components/wizard-steps/elements-step";
import { ReviewStep } from "@/components/wizard-steps/review-step";
import { PromptStep } from "@/components/wizard-steps/prompt-step";

export interface StoryPreferences {
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
	{
		id: 5,
		title: "Outline",
		description: "Format and approve your story outline",
	},
	{ id: 6, title: "Review", description: "Final review and generate story" },
];

export function StoryWizard() {
	const router = useRouter();
	const { generateStory, isGenerating, error } = useStoryGeneration();
	const [currentStep, setCurrentStep] = useState(1);
	const [formattedPrompt, setFormattedPrompt] = useState("");
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

	const fillTestData = () => {
		const testPreferences: StoryPreferences = {
			genre: "contemporary",
			mood: "passionate",
			characters: {
				protagonist: {
					name: "Emma",
					traits: ["Independent", "Witty", "Ambitious"],
					occupation: "Architect",
				},
				love_interest: {
					name: "James",
					traits: ["Protective", "Charming", "Mysterious"],
					occupation: "Detective",
				},
			},
			setting: {
				time_period: "modern",
				location: "New York City",
				atmosphere: "urban",
			},
			elements: {
				tropes: ["Enemies to Lovers", "Workplace Romance", "Grumpy/Sunshine"],
				heat_level: "warm",
				story_length: "novella",
				conflict_type: "both",
			},
		};

		setPreferences(testPreferences);
		setFormattedPrompt(
			"Emma, an ambitious architect, finds herself working alongside the mysterious detective James on a case involving her latest building project. Their initial clash turns into undeniable chemistry as they navigate external threats and internal conflicts in the heart of New York City."
		);
		setCurrentStep(6); // Jump to review step
	};

	const progress = (currentStep / steps.length) * 100;

	const updatePreferences = (stepData: DatabaseStory["story_preferences"]) => {
		if (stepData) {
			setPreferences((prev) => {
				// Merge the data carefully to maintain StoryPreferences structure
				const updated: StoryPreferences = { ...prev };
				
				if (stepData.genre) updated.genre = stepData.genre;
				if (stepData.mood) updated.mood = stepData.mood;
				
				if (stepData.characters) {
					updated.characters = {
						protagonist: {
							name: stepData.characters.protagonist?.name || prev.characters.protagonist.name,
							traits: stepData.characters.protagonist?.traits || prev.characters.protagonist.traits,
							occupation: stepData.characters.protagonist?.occupation || prev.characters.protagonist.occupation,
						},
						love_interest: {
							name: stepData.characters.love_interest?.name || prev.characters.love_interest.name,
							traits: stepData.characters.love_interest?.traits || prev.characters.love_interest.traits,
							occupation: stepData.characters.love_interest?.occupation || prev.characters.love_interest.occupation,
						},
					};
				}
				
				if (stepData.setting) {
					updated.setting = {
						time_period: stepData.setting.time_period || prev.setting.time_period,
						location: stepData.setting.location || prev.setting.location,
						atmosphere: stepData.setting.atmosphere || prev.setting.atmosphere,
					};
				}
				
				if (stepData.elements) {
					updated.elements = {
						tropes: stepData.elements.tropes || prev.elements.tropes,
						heat_level: stepData.elements.heat_level || prev.elements.heat_level,
						story_length: stepData.elements.story_length || prev.elements.story_length,
						conflict_type: stepData.elements.conflict_type || prev.elements.conflict_type,
					};
				}
				
				return updated;
			});
		}
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
		// Generate story title from character names
		const title = `${preferences.characters.protagonist.name}'s Romance`;

		try {
			const result = await generateStory(title, preferences);

			if (result) {
				// Redirect to story status page to monitor generation
				router.push(`/story-status/${result.story.id}`);
			}
		} catch (error) {
			console.error("Story generation failed:", error);
			// Error is handled by the hook
		}
	};

	const handlePromptApproval = (prompt: string) => {
		setFormattedPrompt(prompt);
	};

	const canProceed = () => {
		switch (currentStep) {
			case 1:
				return preferences.genre && preferences.mood;
			case 2:
				return (
					preferences.characters.protagonist.name &&
					preferences.characters.love_interest.name
				);
			case 3:
				return preferences.setting.time_period && preferences.setting.location;
			case 4:
				return (
					preferences.elements.tropes.length > 0 &&
					preferences.elements.heat_level
				);
			case 5:
				return formattedPrompt.trim().length > 0;
			case 6:
				return true;
			default:
				return false;
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<GenreStep preferences={preferences} onUpdate={updatePreferences} />
				);
			case 2:
				return (
					<CharacterStep
						preferences={preferences}
						onUpdate={updatePreferences}
					/>
				);
			case 3:
				return (
					<SettingStep preferences={preferences} onUpdate={updatePreferences} />
				);
			case 4:
				return (
					<ElementsStep
						preferences={preferences}
						onUpdate={updatePreferences}
					/>
				);
			case 5:
				return (
					<PromptStep
						preferences={preferences}
						onPromptApproval={handlePromptApproval}
						formattedPrompt={formattedPrompt}
					/>
				);
			case 6:
				return (
					<ReviewStep
						preferences={preferences}
						formattedPrompt={formattedPrompt}
						onGenerate={handleGenerate}
						isGenerating={isGenerating}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-8">
				<Link
					href="/dashboard"
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Dashboard
				</Link>
			</div>

			<Card className="bg-card/80 backdrop-blur-sm">
				<CardHeader>
					<div className="flex items-center justify-between mb-4">
						<div>
							<CardTitle className="text-3xl font-heading">
								Create Your Story
							</CardTitle>
							<CardDescription className="text-lg mt-2">
								Let&apos;s craft your perfect romance tale together
							</CardDescription>
						</div>
						<div className="text-right">
							{process.env.NODE_ENV === "development" && (
								<Button
									variant="outline"
									size="sm"
									onClick={fillTestData}
									className="mb-2 text-xs"
								>
									Dev: Fill Test Data
								</Button>
							)}
							<p className="text-sm text-muted-foreground">
								Step {currentStep} of {steps.length}
							</p>
							<p className="font-heading text-lg">
								{steps[currentStep - 1].title}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Progress value={progress} className="h-2" />
						<div className="flex justify-between text-xs text-muted-foreground">
							{steps.map((step) => (
								<span
									key={step.id}
									className={
										currentStep >= step.id ? "text-primary font-medium" : ""
									}
								>
									{step.title}
								</span>
							))}
						</div>
					</div>
				</CardHeader>

				<CardContent>
					<div className="mb-8">
						<h2 className="text-xl font-heading mb-2">
							{steps[currentStep - 1].title}
						</h2>
						<p className="text-muted-foreground">
							{steps[currentStep - 1].description}
						</p>
					</div>

					{renderStep()}

					{error && (
						<div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
						</div>
					)}

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

					{currentStep === steps.length && (
						<div className="flex justify-start mt-8">
							<Button
								variant="outline"
								onClick={handlePrevious}
								disabled={isGenerating}
							>
								<ArrowLeft className="mr-2 h-4 w-4" />
								Previous
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
