"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Eye, EyeOff } from "lucide-react";
import { StoryPreferences } from "@/components/story-wizard";
import {
	generatePromptFromPreferences,
	formatPromptWithAPI,
} from "@/lib/format-prompt";

interface PromptStepProps {
	preferences: StoryPreferences;
	onPromptApproval: (prompt: string) => void;
	formattedPrompt?: string;
}

export function PromptStep({
	preferences,
	onPromptApproval,
	formattedPrompt,
}: PromptStepProps) {
	const [generatedPrompt, setGeneratedPrompt] = useState("");
	const [editedPrompt, setEditedPrompt] = useState("");
	const [isFormatting, setIsFormatting] = useState(false);
	const [showPreferences, setShowPreferences] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isApproved, setIsApproved] = useState(false);

	// Generate initial prompt when component mounts or use existing formatted prompt
	useEffect(() => {
		if (formattedPrompt) {
			setEditedPrompt(formattedPrompt);
			setIsApproved(true);
		} else {
			const prompt = generatePromptFromPreferences(preferences);
			setGeneratedPrompt(prompt);
			setEditedPrompt(prompt);
		}
	}, [preferences, formattedPrompt]);

	const handleFormatPrompt = async () => {
		setIsFormatting(true);
		try {
			const formattedPrompt = await formatPromptWithAPI(editedPrompt);
			setEditedPrompt(formattedPrompt);
		} catch (error) {
			console.error("Failed to format prompt:", error);
			// Continue with unformatted prompt
		} finally {
			setIsFormatting(false);
		}
	};

	const handleApprovePrompt = () => {
		setIsApproved(true);
		onPromptApproval(editedPrompt);
	};

	const handleReset = () => {
		setEditedPrompt(generatedPrompt);
		setIsEditing(false);
		setIsApproved(false);
	};

	const handlePromptChange = (value: string) => {
		setEditedPrompt(value);
		setIsEditing(true);
		setIsApproved(false);
	};

	return (
		<div className="space-y-6">
			{/* Preferences Summary */}
			<Card className="bg-muted/50">
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-heading text-lg">Preferences Summary</h3>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowPreferences(!showPreferences)}
						>
							{showPreferences ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
							{showPreferences ? "Hide" : "Show"} Details
						</Button>
					</div>

					<div className="flex flex-wrap gap-2 mb-4">
						<Badge variant="secondary">{preferences.genre}</Badge>
						<Badge variant="secondary">{preferences.mood}</Badge>
						<Badge variant="outline">{preferences.elements.heat_level}</Badge>
						<Badge variant="outline">{preferences.elements.story_length}</Badge>
					</div>

					{showPreferences && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p>
									<strong>Protagonist:</strong>{" "}
									{preferences.characters.protagonist.name}
								</p>
								<p>
									<strong>Love Interest:</strong>{" "}
									{preferences.characters.love_interest.name}
								</p>
								<p>
									<strong>Setting:</strong> {preferences.setting.location},{" "}
									{preferences.setting.time_period}
								</p>
							</div>
							<div>
								<p>
									<strong>Tropes:</strong>{" "}
									{preferences.elements.tropes.join(", ")}
								</p>
								<p>
									<strong>Conflict:</strong>{" "}
									{preferences.elements.conflict_type}
								</p>
								<p>
									<strong>Atmosphere:</strong> {preferences.setting.atmosphere}
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Prompt Editor */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-heading text-lg">Story Outline</h3>
						<div className="flex gap-2">
							{editedPrompt !== generatedPrompt && (
								<Button variant="outline" size="sm" onClick={handleReset}>
									Reset
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={handleFormatPrompt}
								disabled={isFormatting}
							>
								{isFormatting ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<Wand2 className="h-4 w-4 mr-2" />
								)}
								{isFormatting ? "Formatting..." : "Enhance Outline"}
							</Button>
						</div>
					</div>

					<Textarea
						value={editedPrompt}
						onChange={(e) => handlePromptChange(e.target.value)}
						placeholder="Your story outline will appear here..."
						className="min-h-[300px] resize-none"
					/>

					<div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
						<p>{editedPrompt.length} characters</p>
						<div className="flex items-center gap-2">
							{isEditing && <p>Outline has been modified</p>}
							{isApproved && (
								<p className="text-green-600 dark:text-green-400">✓ Approved</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Approve Button */}
			<div className="flex justify-center">
				<Button
					onClick={handleApprovePrompt}
					disabled={!editedPrompt.trim() || isApproved}
					size="lg"
					className="bg-primary hover:bg-primary/90"
				>
					{isApproved ? "✓ Approved" : "Approve Outline"}
				</Button>
			</div>

			{isApproved && (
				<div className="text-center text-sm text-muted-foreground">
					<p>
						Your outline has been approved. Click &quot;Next&quot; to continue
						to the final review.
					</p>
				</div>
			)}
		</div>
	);
}
