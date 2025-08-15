"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface AcademicContextStepProps {
	preferences: DatabaseStory["story_preferences"];
	onUpdate: (data: DatabaseStory["story_preferences"]) => void;
}

const academicLevels = [
	{ id: "high_school", name: "High School", description: "9th-12th grade academic writing" },
	{ id: "undergraduate", name: "Undergraduate", description: "College/University bachelor's level" },
	{ id: "graduate", name: "Graduate", description: "Master's degree level work" },
	{ id: "doctoral", name: "Doctoral", description: "PhD/Doctorate level research" },
	{ id: "professional", name: "Professional", description: "Industry or professional writing" },
	{ id: "continuing_ed", name: "Continuing Education", description: "Adult learning programs" },
];

const institutionTypes = [
	"University",
	"Community College",
	"Liberal Arts College",
	"Research Institution",
	"Technical School",
	"Online University",
	"Private School",
	"Public School",
	"Graduate School",
	"Professional School",
	"Trade School",
	"Ivy League",
];

const timeConstraints = [
	{
		id: "rush",
		name: "Rush (1-2 days)",
		description: "Quick turnaround needed",
	},
	{
		id: "standard",
		name: "Standard (1 week)",
		description: "Normal assignment timeline",
	},
	{
		id: "extended",
		name: "Extended (2-3 weeks)",
		description: "Longer research period",
	},
	{
		id: "semester",
		name: "Semester Project",
		description: "Major project over several months",
	},
	{
		id: "thesis",
		name: "Thesis/Dissertation",
		description: "Long-term research project",
	},
	{
		id: "flexible",
		name: "Flexible Timeline",
		description: "No specific deadline pressure",
	},
];

export function AcademicContextStep({ preferences, onUpdate }: AcademicContextStepProps) {
	const updateSetting = (field: string, value: string) => {
		onUpdate({
			setting: {
				...preferences?.setting,
				[field]: value,
			},
		});
	};

	return (
		<div className="space-y-8">
			<div>
				<h3 className="text-lg font-heading mb-4">Academic Level</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{academicLevels.map((level) => (
						<Button
							key={level.id}
							variant={
								preferences?.setting?.time_period === level.id
									? "default"
									: "outline"
							}
							className="h-auto p-4 flex flex-col items-start text-left"
							onClick={() => updateSetting("time_period", level.id)}
						>
							<span className="font-medium">{level.name}</span>
							<span className="text-xs text-muted-foreground mt-1">
								{level.description}
							</span>
						</Button>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Institution Type</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
					{institutionTypes.map((institution) => (
						<Button
							key={institution}
							variant={
								preferences?.setting?.location === institution
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => updateSetting("location", institution)}
						>
							{institution}
						</Button>
					))}
				</div>
				<div>
					<Label htmlFor="custom-institution">Or enter a specific institution</Label>
					<Input
						id="custom-institution"
						value={preferences?.setting?.location || ""}
						onChange={(e) => updateSetting("location", e.target.value)}
						placeholder="Enter your school name"
					/>
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Course Context</h3>
				<div className="space-y-4">
					<div>
						<Label htmlFor="course-name">Course Name (Optional)</Label>
						<Input
							id="course-name"
							value={preferences?.setting?.course_name || ""}
							onChange={(e) => updateSetting("course_name", e.target.value)}
							placeholder="e.g., English 101, Psychology 200, etc."
						/>
					</div>
					<div>
						<Label htmlFor="professor-name">Professor/Instructor (Optional)</Label>
						<Input
							id="professor-name"
							value={preferences?.setting?.professor || ""}
							onChange={(e) => updateSetting("professor", e.target.value)}
							placeholder="Professor's name or specific requirements"
						/>
					</div>
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Timeline & Urgency</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{timeConstraints.map((constraint) => (
						<Card
							key={constraint.id}
							className={`cursor-pointer transition-all hover:shadow-md ${
								preferences?.setting?.atmosphere === constraint.id
									? "ring-2 ring-primary bg-primary/5"
									: "hover:border-primary/20"
							}`}
							onClick={() => updateSetting("atmosphere", constraint.id)}
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-base">{constraint.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>{constraint.description}</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			<div>
				<h3 className="text-lg font-heading mb-4">Special Requirements</h3>
				<div className="space-y-4">
					<div>
						<Label htmlFor="special-requirements">Additional Requirements or Notes</Label>
						<Input
							id="special-requirements"
							value={preferences?.setting?.special_requirements || ""}
							onChange={(e) => updateSetting("special_requirements", e.target.value)}
							placeholder="e.g., specific formatting, minimum sources, etc."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}