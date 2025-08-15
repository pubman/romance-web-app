"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FileText, BookOpen, Search, BarChart3, Users, GraduationCap } from "lucide-react";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface PaperTypeStepProps {
	preferences: DatabaseStory["story_preferences"];
	onUpdate: (data: DatabaseStory["story_preferences"]) => void;
}

const paperTypes = [
	{
		id: "research_paper",
		name: "Research Paper",
		description: "In-depth analysis with original research and sources",
		icon: Search,
		color: "text-blue-500",
	},
	{
		id: "analytical_essay",
		name: "Analytical Essay",
		description: "Critical analysis and interpretation of a topic",
		icon: FileText,
		color: "text-green-500",
	},
	{
		id: "lab_report",
		name: "Lab Report",
		description: "Scientific experiment documentation and analysis",
		icon: BarChart3,
		color: "text-purple-500",
	},
	{
		id: "case_study",
		name: "Case Study",
		description: "Detailed examination of a specific instance or example",
		icon: Users,
		color: "text-orange-500",
	},
	{
		id: "literature_review",
		name: "Literature Review",
		description: "Comprehensive survey of existing research on a topic",
		icon: BookOpen,
		color: "text-indigo-500",
	},
	{
		id: "thesis_chapter",
		name: "Thesis Chapter",
		description: "Academic chapter for thesis or dissertation",
		icon: GraduationCap,
		color: "text-red-500",
	},
];

const approaches = [
	{
		id: "analytical",
		name: "Analytical",
		description: "Break down and examine components systematically",
	},
	{
		id: "argumentative",
		name: "Argumentative",
		description: "Present and defend a clear position with evidence",
	},
	{
		id: "comparative",
		name: "Comparative",
		description: "Compare and contrast different perspectives or items",
	},
	{
		id: "descriptive",
		name: "Descriptive",
		description: "Provide detailed explanation and description",
	},
	{
		id: "expository",
		name: "Expository",
		description: "Explain concepts clearly and objectively",
	},
	{
		id: "persuasive",
		name: "Persuasive",
		description: "Convince readers to adopt a particular viewpoint",
	},
];

export function PaperTypeStep({ preferences, onUpdate }: PaperTypeStepProps) {
	const handlePaperTypeSelect = (typeId: string) => {
		onUpdate({ genre: typeId });
	};

	const handleApproachSelect = (approachId: string) => {
		onUpdate({ mood: approachId });
	};

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-lg font-heading mb-4">Choose Your Paper Type</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{paperTypes.map((type) => {
						const Icon = type.icon;
						return (
							<Card
								key={type.id}
								className={`cursor-pointer transition-all hover:shadow-md ${
									preferences?.genre === type.id
										? "ring-2 ring-primary bg-primary/5"
										: "hover:border-primary/20"
								}`}
								onClick={() => handlePaperTypeSelect(type.id)}
							>
								<CardHeader className="pb-2">
									<div className="flex items-center gap-3">
										<Icon className={`h-6 w-6 ${type.color}`} />
										<CardTitle className="text-base">{type.name}</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<CardDescription>{type.description}</CardDescription>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Select Your Academic Approach</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{approaches.map((approach) => (
						<Button
							key={approach.id}
							variant={preferences?.mood === approach.id ? "default" : "outline"}
							className="h-auto p-4 flex flex-col items-start text-left"
							onClick={() => handleApproachSelect(approach.id)}
						>
							<span className="font-medium">{approach.name}</span>
							<span className="text-xs text-muted-foreground mt-1">
								{approach.description}
							</span>
						</Button>
					))}
				</div>
			</div>
		</div>
	);
}