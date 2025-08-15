"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ResearchFocusStepProps {
	preferences: DatabaseStory["story_preferences"];
	onUpdate: (data: DatabaseStory["story_preferences"]) => void;
}

const researchKeywords = [
	"Social Media",
	"Climate Change",
	"Artificial Intelligence",
	"Healthcare",
	"Education",
	"Technology",
	"Psychology",
	"Economics",
	"Politics",
	"Environment",
	"History",
	"Literature",
	"Science",
	"Business",
	"Culture",
	"Society",
	"Innovation",
	"Ethics",
];

const academicFields = [
	"Biology",
	"Chemistry",
	"Physics",
	"Computer Science",
	"Engineering",
	"Mathematics",
	"Psychology",
	"Sociology",
	"Political Science",
	"Economics",
	"History",
	"Literature",
	"Philosophy",
	"Anthropology",
	"Business Administration",
	"Education",
];

const researchMethodologies = [
	"Qualitative Research",
	"Quantitative Research", 
	"Mixed Methods",
	"Literature Review",
	"Case Study",
	"Survey Research",
	"Experimental Design",
	"Meta-Analysis",
];

// Research topic card component
interface ResearchCardProps {
	title: string;
	type: "protagonist" | "love_interest";
	// @ts-expect-error - character is a string (keeping original structure for compatibility)
	character: DatabaseStory["story_preferences"]["characters"][keyof DatabaseStory["story_preferences"]["characters"]];
	onUpdateCharacter: (
		type: "protagonist" | "love_interest",
		field: string,
		value: string
	) => void;
	onAddTrait: (type: "protagonist" | "love_interest", trait: string) => void;
	onRemoveTrait: (type: "protagonist" | "love_interest", trait: string) => void;
}

function ResearchCard({
	title,
	type,
	character,
	onUpdateCharacter,
	onAddTrait,
	onRemoveTrait,
}: ResearchCardProps) {
	const isSecondary = type === "love_interest";
	
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">{title}</CardTitle>
				<CardDescription>
					{isSecondary 
						? "Define a secondary research focus (optional)" 
						: "Define your main research topic and scope"
					}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label htmlFor={`${type}-name`}>
						{isSecondary ? "Secondary Topic" : "Primary Research Topic"}
					</Label>
					<Input
						id={`${type}-name`}
						value={character.name || ""}
						onChange={(e) => onUpdateCharacter(type, "name", e.target.value)}
						placeholder={isSecondary ? "Enter secondary topic (optional)" : "Enter your main research topic"}
					/>
				</div>

				<div>
					<Label htmlFor={`${type}-occupation`}>Academic Field</Label>
					<div className="grid grid-cols-2 gap-2 mt-2 mb-3">
						{academicFields.slice(0, 8).map((field) => (
							<Button
								key={field}
								variant={
									character.occupation === field ? "default" : "outline"
								}
								size="sm"
								onClick={() =>
									onUpdateCharacter(type, "occupation", field)
								}
							>
								{field}
							</Button>
						))}
					</div>
					<Input
						id={`${type}-occupation`}
						value={character.occupation || ""}
						onChange={(e) =>
							onUpdateCharacter(type, "occupation", e.target.value)
						}
						placeholder="Or enter custom academic field"
					/>
				</div>

				<div>
					<Label>Research Keywords (Choose up to 4)</Label>
					<div className="flex flex-wrap gap-1 mt-2 mb-3">
						{character.traits?.map((keyword: string) => (
							<Badge
								key={keyword}
								variant="secondary"
								className="flex items-center gap-1"
							>
								{keyword}
								<X
									className="h-3 w-3 cursor-pointer"
									onClick={() => onRemoveTrait(type, keyword)}
								/>
							</Badge>
						))}
					</div>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
						{researchKeywords.map((keyword) => (
							<Button
								key={keyword}
								variant="outline"
								size="sm"
								disabled={
									character.traits?.includes(keyword) ||
									character.traits?.length >= 4
								}
								onClick={() => onAddTrait(type, keyword)}
							>
								{keyword}
							</Button>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function ResearchFocusStep({ preferences, onUpdate }: ResearchFocusStepProps) {
	const updateCharacter = (
		type: "protagonist" | "love_interest",
		field: string,
		value: string
	) => {
		onUpdate({
			characters: {
				...preferences?.characters,
				[type]: {
					...preferences?.characters?.[type],
					[field]: value,
				},
			},
		});
	};

	const addTrait = (type: "protagonist" | "love_interest", trait: string) => {
		const currentTraits = preferences?.characters?.[type]?.traits || [];
		if (!currentTraits.includes(trait) && currentTraits.length < 4) {
			// @ts-expect-error - currentTraits is an array of strings
			updateCharacter(type, "traits", [...currentTraits, trait]);
		}
	};

	const removeTrait = (
		type: "protagonist" | "love_interest",
		trait: string
	) => {
		const currentTraits = preferences?.characters?.[type]?.traits || [];
		updateCharacter(
			type,
			"traits",
			// @ts-expect-error - currentTraits is an array of strings
			currentTraits.filter((t: string) => t !== trait)
		);
	};

	return (
		<div className="space-y-6">
			<ResearchCard
				title="Primary Research Focus"
				type="protagonist"
				character={preferences?.characters?.protagonist}
				onUpdateCharacter={updateCharacter}
				onAddTrait={addTrait}
				onRemoveTrait={removeTrait}
			/>
			<ResearchCard
				title="Secondary Research Focus"
				type="love_interest"
				character={preferences?.characters?.love_interest}
				onUpdateCharacter={updateCharacter}
				onAddTrait={addTrait}
				onRemoveTrait={removeTrait}
			/>
			
			{/* Research Methodology Selection */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Research Methodology</CardTitle>
					<CardDescription>
						Select the primary methodology for your research approach
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{researchMethodologies.map((methodology) => (
							<Button
								key={methodology}
								variant="outline"
								className="h-auto p-4 text-left"
								onClick={() => {
									// Store methodology in a way that's compatible with existing structure
									onUpdate({
										setting: {
											...preferences?.setting,
											methodology: methodology,
										},
									});
								}}
							>
								<span className="font-medium">{methodology}</span>
							</Button>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}