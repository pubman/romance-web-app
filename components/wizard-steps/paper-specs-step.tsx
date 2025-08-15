"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { X } from "lucide-react";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface PaperSpecsStepProps {
	preferences: DatabaseStory["story_preferences"];
	onUpdate: (data: DatabaseStory["story_preferences"]) => void;
}

const researchMethods = [
	"Literature Review",
	"Survey Research",
	"Interview Study",
	"Experimental Design",
	"Case Study Analysis",
	"Statistical Analysis",
	"Qualitative Analysis",
	"Meta-Analysis",
	"Ethnographic Study",
	"Content Analysis",
	"Comparative Analysis",
	"Historical Analysis",
	"Theoretical Framework",
	"Mixed Methods",
	"Systematic Review",
	"Action Research",
];

const academicRigor = [
	{ id: "basic", name: "Basic", description: "High school level analysis" },
	{ id: "intermediate", name: "Intermediate", description: "Undergraduate level work" },
	{ id: "advanced", name: "Advanced", description: "Graduate level research" },
	{ id: "expert", name: "Expert", description: "Doctoral/Professional level" },
];

const paperLengths = [
	{ id: "short", name: "Short Paper", description: "1-3 pages" },
	{ id: "medium", name: "Medium Paper", description: "5-10 pages" },
	{ id: "long", name: "Long Paper", description: "15-20 pages" },
	{ id: "extended", name: "Extended Paper", description: "25+ pages" },
];

const citationStyles = [
	{
		id: "apa",
		name: "APA Style",
		description: "Psychology, Education, Social Sciences",
	},
	{
		id: "mla",
		name: "MLA Style",
		description: "Literature, Humanities, Arts",
	},
	{
		id: "chicago",
		name: "Chicago Style",
		description: "History, Literature, Arts",
	},
	{
		id: "harvard",
		name: "Harvard Style",
		description: "Business, Economics, Sciences",
	},
	{
		id: "ieee",
		name: "IEEE Style",
		description: "Engineering, Computer Science",
	},
	{
		id: "vancouver",
		name: "Vancouver Style",
		description: "Medicine, Life Sciences",
	},
];

export function PaperSpecsStep({ preferences, onUpdate }: PaperSpecsStepProps) {
	const updateElements = (field: string, value: string | string[]) => {
		onUpdate({
			elements: {
				...preferences?.elements,
				[field]: value,
			},
		});
	};

	const toggleMethod = (method: string) => {
		const currentMethods = preferences?.elements?.tropes || [];
		if (currentMethods.includes(method)) {
			updateElements(
				"tropes",
				currentMethods.filter((m: string) => m !== method)
			);
		} else if (currentMethods.length < 3) {
			updateElements("tropes", [...currentMethods, method]);
		}
	};

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-lg font-heading mb-2">Research Methods</h3>
				<p className="text-sm text-muted-foreground mb-4">
					Choose up to 3 research methods you&apos;d like to include
				</p>

				<div className="flex flex-wrap gap-2 mb-4">
					{preferences?.elements?.tropes?.map((method: string) => (
						<Badge
							key={method}
							variant="secondary"
							className="flex items-center gap-1"
						>
							{method}
							<X
								className="h-3 w-3 cursor-pointer"
								onClick={() => toggleMethod(method)}
							/>
						</Badge>
					))}
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
					{researchMethods.map((method) => (
						<Button
							key={method}
							variant="outline"
							size="sm"
							disabled={
								preferences?.elements?.tropes?.includes(method) ||
								(preferences?.elements?.tropes?.length || 0) >= 3
							}
							onClick={() => toggleMethod(method)}
						>
							{method}
						</Button>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Academic Rigor Level</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{academicRigor.map((level) => (
						<Card
							key={level.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								preferences?.elements?.heat_level === level.id
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
				<h3 className="text-lg font-heading mb-4">Paper Length</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{paperLengths.map((length) => (
						<Card
							key={length.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								preferences?.elements?.story_length === length.id
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
				<h3 className="text-lg font-heading mb-4">Citation Style</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{citationStyles.map((style) => (
						<Card
							key={style.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								preferences?.elements?.conflict_type === style.id
									? "ring-2 ring-primary bg-primary/5"
									: "hover:border-primary/20"
							}`}
							onClick={() => updateElements("conflict_type", style.id)}
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-base">{style.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>{style.description}</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Source Requirements</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{["3-5 sources", "6-10 sources", "11-15 sources", "16+ sources"].map((sourceCount) => (
						<Button
							key={sourceCount}
							variant={
								preferences?.elements?.source_count === sourceCount
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => updateElements("source_count", sourceCount)}
						>
							{sourceCount}
						</Button>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Academic Tone</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					{[
						{ id: "formal", name: "Formal Academic", description: "Traditional scholarly tone" },
						{ id: "semi_formal", name: "Semi-Formal", description: "Professional but accessible" },
						{ id: "technical", name: "Technical", description: "Specialized terminology" },
					].map((tone) => (
						<Card
							key={tone.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								preferences?.elements?.academic_tone === tone.id
									? "ring-2 ring-primary bg-primary/5"
									: "hover:border-primary/20"
							}`}
							onClick={() => updateElements("academic_tone", tone.id)}
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-base">{tone.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>{tone.description}</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}