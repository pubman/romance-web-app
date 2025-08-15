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
import { useGuest } from "@/contexts/guest-context";

import { PaperTypeStep } from "@/components/wizard-steps/paper-type-step";
import { ResearchFocusStep } from "@/components/wizard-steps/research-focus-step";
import { AcademicContextStep } from "@/components/wizard-steps/academic-context-step";
import { PaperSpecsStep } from "@/components/wizard-steps/paper-specs-step";
import { PaperReviewStep } from "@/components/wizard-steps/paper-review-step";
import { OutlineStep } from "@/components/wizard-steps/outline-step";

export interface StoryPreferences {
	genre: string; // Paper type
	mood: string; // Academic approach
	characters: {
		protagonist: { name: string; traits: string[]; occupation: string }; // Primary research topic
		love_interest: { name: string; traits: string[]; occupation: string }; // Secondary research topic
	};
	setting: {
		time_period: string; // Academic level
		location: string; // Institution
		atmosphere: string; // Timeline constraint
	};
	elements: {
		tropes: string[]; // Research methods
		heat_level: string; // Academic rigor
		story_length: string; // Paper length
		conflict_type: string; // Citation style
	};
}

const steps = [
	{ id: 1, title: "Paper Type", description: "Choose your paper type and approach" },
	{ id: 2, title: "Research Focus", description: "Define your research topics" },
	{ id: 3, title: "Academic Context", description: "Set academic level and context" },
	{ id: 4, title: "Paper Specs", description: "Define paper specifications" },
	{
		id: 5,
		title: "Outline",
		description: "Review and approve your paper outline",
	},
	{ id: 6, title: "Review", description: "Final review and generate paper" },
];

export function StoryWizard() {
	const router = useRouter();
	const { generateStory, isGenerating, error } = useStoryGeneration();
	const { isGuest } = useGuest();
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
			genre: "research_paper",
			mood: "analytical",
			characters: {
				protagonist: {
					name: "The Impact of Social Media on Mental Health",
					traits: ["Social Media", "Psychology", "Mental Health", "Technology"],
					occupation: "Psychology",
				},
				love_interest: {
					name: "Digital Wellness Strategies",
					traits: ["Wellness", "Digital Health", "Intervention"],
					occupation: "Health Sciences",
				},
			},
			setting: {
				time_period: "undergraduate",
				location: "University",
				atmosphere: "standard",
			},
			elements: {
				tropes: ["Literature Review", "Survey Research", "Statistical Analysis"],
				heat_level: "intermediate",
				story_length: "medium",
				conflict_type: "apa",
			},
		};

		setPreferences(testPreferences);
		setFormattedPrompt(
			"# Research Paper: The Impact of Social Media on Mental Health\n\n## Abstract\nAn analytical examination of the impact of social media on mental health within the context of Psychology. This paper explores the relationship between social media usage and digital wellness strategies. The research employs literature review and survey research methodologies to provide comprehensive insights.\n\n## Introduction\n- Background and context of social media impact on mental health\n- Problem statement and research questions\n- Thesis statement\n- Significance of the study"
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
				return preferences.characters.protagonist.name; // Only primary topic required
			case 3:
				return preferences.setting.time_period && preferences.setting.location;
			case 4:
				return (
					preferences.elements.tropes.length > 0 &&
					preferences.elements.heat_level &&
					preferences.elements.story_length &&
					preferences.elements.conflict_type
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
					<PaperTypeStep preferences={preferences} onUpdate={updatePreferences} />
				);
			case 2:
				return (
					<ResearchFocusStep
						preferences={preferences}
						onUpdate={updatePreferences}
					/>
				);
			case 3:
				return (
					<AcademicContextStep preferences={preferences} onUpdate={updatePreferences} />
				);
			case 4:
				return (
					<PaperSpecsStep
						preferences={preferences}
						onUpdate={updatePreferences}
					/>
				);
			case 5:
				return (
					<OutlineStep
						preferences={preferences}
						onPromptApproval={handlePromptApproval}
						formattedPrompt={formattedPrompt}
					/>
				);
			case 6:
				return (
					<PaperReviewStep
						preferences={preferences}
						formattedPrompt={formattedPrompt}
						onGenerate={handleGenerate}
						isGenerating={isGenerating}
						isGuest={isGuest}
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
								Generate Your Paper
							</CardTitle>
							<CardDescription className="text-lg mt-2">
								Let&apos;s create your perfect academic paper together
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
