"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2, Eye, EyeOff, RotateCcw } from "lucide-react";
import { StoryPreferences } from "@/components/story-wizard";
import {
	generatePromptFromPreferences,
	formatPromptWithAPI,
	FormatPromptError,
} from "@/lib/format-prompt";

interface OutlineStepProps {
	preferences: StoryPreferences;
	onPromptApproval: (prompt: string) => void;
	formattedPrompt?: string;
}

export function OutlineStep({
	preferences,
	onPromptApproval,
	formattedPrompt,
}: OutlineStepProps) {
	const [generatedOutline, setGeneratedOutline] = useState("");
	const [editedOutline, setEditedOutline] = useState("");
	const [isFormatting, setIsFormatting] = useState(false);
	const [showPreferences, setShowPreferences] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isApproved, setIsApproved] = useState(false);
	const [formatError, setFormatError] = useState<FormatPromptError | null>(
		null
	);

	// Generate initial outline when component mounts or use existing formatted outline
	useEffect(() => {
		if (formattedPrompt) {
			setEditedOutline(formattedPrompt);
			setIsApproved(true);
		} else {
			const outline = generateAcademicOutline(preferences);
			setGeneratedOutline(outline);
			setEditedOutline(outline);
		}
	}, [preferences, formattedPrompt]);

	const generateAcademicOutline = (prefs: StoryPreferences) => {
		// Convert story preferences to academic outline
		const paperType = getPaperTypeName(prefs.genre);
		const approach = getApproachName(prefs.mood);
		const primaryTopic = prefs.characters?.protagonist?.name || "Research Topic";
		const secondaryTopic = prefs.characters?.love_interest?.name;
		const academicLevel = prefs.setting?.time_period || "undergraduate";
		const field = prefs.characters?.protagonist?.occupation || "General Studies";
		const methods = prefs.elements?.tropes || [];
		const citationStyle = prefs.elements?.conflict_type || "apa";
		const length = prefs.elements?.story_length || "medium";

		let outline = `# ${paperType}: ${primaryTopic}\n\n`;
		outline += `## Abstract\n`;
		outline += `A ${approach.toLowerCase()} examination of ${primaryTopic.toLowerCase()} within the context of ${field}. `;
		if (secondaryTopic) {
			outline += `This paper explores the relationship between ${primaryTopic.toLowerCase()} and ${secondaryTopic.toLowerCase()}. `;
		}
		outline += `The research employs ${methods.slice(0, 2).join(" and ").toLowerCase()} methodologies to provide comprehensive insights.\n\n`;

		outline += `## Introduction\n`;
		outline += `- Background and context of ${primaryTopic.toLowerCase()}\n`;
		outline += `- Problem statement and research questions\n`;
		outline += `- Thesis statement\n`;
		outline += `- Significance of the study\n\n`;

		outline += `## Literature Review\n`;
		outline += `- Current state of research on ${primaryTopic.toLowerCase()}\n`;
		outline += `- Key theories and frameworks\n`;
		outline += `- Research gaps identified\n\n`;

		if (methods.length > 0) {
			outline += `## Methodology\n`;
			outline += `- Research approach: ${methods[0] || "Literature Review"}\n`;
			if (methods.length > 1) {
				outline += `- Secondary method: ${methods[1]}\n`;
			}
			outline += `- Data collection and analysis procedures\n`;
			outline += `- Limitations and ethical considerations\n\n`;
		}

		outline += `## Main Analysis\n`;
		outline += `- Key findings and arguments\n`;
		outline += `- Supporting evidence and data\n`;
		if (secondaryTopic) {
			outline += `- Analysis of ${secondaryTopic.toLowerCase()} in relation to main topic\n`;
		}
		outline += `- Critical evaluation and interpretation\n\n`;

		outline += `## Discussion\n`;
		outline += `- Implications of findings\n`;
		outline += `- Connections to existing literature\n`;
		outline += `- Practical applications\n`;
		outline += `- Areas for future research\n\n`;

		outline += `## Conclusion\n`;
		outline += `- Summary of key points\n`;
		outline += `- Restatement of thesis\n`;
		outline += `- Final thoughts and recommendations\n\n`;

		outline += `## References\n`;
		outline += `- Academic sources in ${citationStyle.toUpperCase()} format\n`;
		outline += `- Minimum 8-12 peer-reviewed sources recommended\n\n`;

		outline += `---\n`;
		outline += `**Paper Specifications:**\n`;
		outline += `- Academic Level: ${academicLevel.replace("_", " ")}\n`;
		outline += `- Citation Style: ${citationStyle.toUpperCase()}\n`;
		outline += `- Target Length: ${getPaperLengthName(length)}\n`;
		outline += `- Academic Field: ${field}`;

		return outline;
	};

	const getPaperTypeName = (id: string) => {
		const types: { [key: string]: string } = {
			research_paper: "Research Paper",
			analytical_essay: "Analytical Essay",
			lab_report: "Lab Report",
			case_study: "Case Study",
			literature_review: "Literature Review",
			thesis_chapter: "Thesis Chapter",
		};
		return types[id] || "Academic Paper";
	};

	const getApproachName = (id: string) => {
		const approaches: { [key: string]: string } = {
			analytical: "Analytical",
			argumentative: "Argumentative", 
			comparative: "Comparative",
			descriptive: "Descriptive",
			expository: "Expository",
			persuasive: "Persuasive",
		};
		return approaches[id] || "Academic";
	};

	const getPaperLengthName = (id: string) => {
		const lengths: { [key: string]: string } = {
			short: "1-3 pages",
			medium: "5-10 pages",
			long: "15-20 pages",
			extended: "25+ pages",
		};
		return lengths[id] || "Medium length";
	};

	const handleFormatOutline = async () => {
		setIsFormatting(true);
		setFormatError(null);

		try {
			const result = await formatPromptWithAPI(editedOutline);

			if (result.success) {
				setEditedOutline(result.formattedPrompt);
				// Show warning for mock responses
				if (result.mock && result.warning) {
					setFormatError({
						message: result.warning,
						retryable: false,
						suggestion:
							"Configure DeepWriter API credentials for production use.",
					});
				}
			} else {
				setFormatError(result.error);
			}
		} catch (error) {
			console.error("Unexpected error formatting outline:", error);
			setFormatError({
				message: "An unexpected error occurred.",
				retryable: true,
				suggestion: "Please try again.",
			});
		} finally {
			setIsFormatting(false);
		}
	};

	const handleApproveOutline = () => {
		setIsApproved(true);
		onPromptApproval(editedOutline);
	};

	const handleReset = () => {
		setEditedOutline(generatedOutline);
		setIsEditing(false);
		setIsApproved(false);
		setFormatError(null);
	};

	const handleOutlineChange = (value: string) => {
		setEditedOutline(value);
		setIsEditing(true);
		setIsApproved(false);
		setFormatError(null);
	};

	const handleDismissError = () => {
		setFormatError(null);
	};

	return (
		<div className="space-y-6">
			{/* Preferences Summary */}
			<Card className="bg-muted/50">
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-heading text-lg">Paper Specifications Summary</h3>
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
						<Badge variant="secondary">{getPaperTypeName(preferences.genre)}</Badge>
						<Badge variant="secondary">{getApproachName(preferences.mood)}</Badge>
						<Badge variant="outline">{preferences.elements?.heat_level || "intermediate"}</Badge>
						<Badge variant="outline">{getPaperLengthName(preferences.elements?.story_length || "medium")}</Badge>
					</div>

					{showPreferences && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p>
									<strong>Primary Topic:</strong>{" "}
									{preferences.characters?.protagonist?.name || "Not specified"}
								</p>
								{preferences.characters?.love_interest?.name && (
									<p>
										<strong>Secondary Topic:</strong>{" "}
										{preferences.characters?.love_interest?.name}
									</p>
								)}
								<p>
									<strong>Academic Field:</strong>{" "}
									{preferences.characters?.protagonist?.occupation || "General"}
								</p>
							</div>
							<div>
								<p>
									<strong>Research Methods:</strong>{" "}
									{preferences.elements?.tropes?.join(", ") || "Literature Review"}
								</p>
								<p>
									<strong>Citation Style:</strong>{" "}
									{preferences.elements?.conflict_type?.toUpperCase() || "APA"}
								</p>
								<p>
									<strong>Academic Level:</strong>{" "}
									{preferences.setting?.time_period?.replace("_", " ") || "Undergraduate"}
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Error Alert */}
			{formatError && (
				<Alert
					variant={formatError.retryable ? "warning" : "destructive"}
					dismissible
					onDismiss={handleDismissError}
				>
					<AlertTitle>
						{formatError.retryable ? "Enhancement Failed" : "Enhancement Error"}
					</AlertTitle>
					<AlertDescription>
						<p className="mb-2">{formatError.message}</p>
						{formatError.suggestion && (
							<p className="text-sm opacity-90">{formatError.suggestion}</p>
						)}
						{formatError.retryable && (
							<div className="mt-3">
								<Button
									variant="outline"
									size="sm"
									onClick={handleFormatOutline}
									disabled={isFormatting}
									className="h-8"
								>
									<RotateCcw className="h-3 w-3 mr-1" />
									Try Again
								</Button>
							</div>
						)}
					</AlertDescription>
				</Alert>
			)}

			{/* Outline Editor */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-heading text-lg">Academic Paper Outline</h3>
						<div className="flex gap-2">
							{editedOutline !== generatedOutline && (
								<Button variant="outline" size="sm" onClick={handleReset}>
									Reset
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={handleFormatOutline}
								disabled={isFormatting}
							>
								{isFormatting ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : (
									<Wand2 className="h-4 w-4 mr-2" />
								)}
								{isFormatting ? "Enhancing..." : "Enhance Outline"}
							</Button>
						</div>
					</div>

					<Textarea
						value={editedOutline}
						onChange={(e) => handleOutlineChange(e.target.value)}
						placeholder="Your paper outline will appear here..."
						className="min-h-[400px] resize-none font-mono text-sm"
					/>

					<div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
						<p>{editedOutline?.length || "0"} characters</p>
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
					onClick={handleApproveOutline}
					disabled={!editedOutline.trim() || isApproved}
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