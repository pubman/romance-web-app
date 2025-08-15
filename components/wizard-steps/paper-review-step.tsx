"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, FileText, Crown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DatabaseStory } from "@/hooks/use-user-stories";

interface PaperReviewStepProps {
	preferences: DatabaseStory["story_preferences"];
	formattedPrompt: string;
	onGenerate: () => void;
	isGenerating: boolean;
	isGuest: boolean;
}

export function PaperReviewStep({
	preferences,
	formattedPrompt,
	onGenerate,
	isGenerating,
	isGuest,
}: PaperReviewStepProps) {
	const getPaperTypeName = (id: string) => {
		const types: { [key: string]: string } = {
			research_paper: "Research Paper",
			analytical_essay: "Analytical Essay",
			lab_report: "Lab Report",
			case_study: "Case Study",
			literature_review: "Literature Review",
			thesis_chapter: "Thesis Chapter",
		};
		return types[id] || id;
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
		return approaches[id] || id;
	};

	const getAcademicLevelName = (id: string) => {
		const levels: { [key: string]: string } = {
			high_school: "High School",
			undergraduate: "Undergraduate",
			graduate: "Graduate",
			doctoral: "Doctoral",
			professional: "Professional",
			continuing_ed: "Continuing Education",
		};
		return levels[id] || id;
	};

	const getTimeConstraintName = (id: string) => {
		const constraints: { [key: string]: string } = {
			rush: "Rush (1-2 days)",
			standard: "Standard (1 week)",
			extended: "Extended (2-3 weeks)",
			semester: "Semester Project",
			thesis: "Thesis/Dissertation",
			flexible: "Flexible Timeline",
		};
		return constraints[id] || id;
	};

	const getAcademicRigorName = (id: string) => {
		const levels: { [key: string]: string } = {
			basic: "Basic",
			intermediate: "Intermediate",
			advanced: "Advanced",
			expert: "Expert",
		};
		return levels[id] || id;
	};

	const getPaperLengthName = (id: string) => {
		const lengths: { [key: string]: string } = {
			short: "Short Paper (1-3 pages)",
			medium: "Medium Paper (5-10 pages)",
			long: "Long Paper (15-20 pages)",
			extended: "Extended Paper (25+ pages)",
		};
		return lengths[id] || id;
	};

	const getCitationStyleName = (id: string) => {
		const styles: { [key: string]: string } = {
			apa: "APA Style",
			mla: "MLA Style",
			chicago: "Chicago Style",
			harvard: "Harvard Style",
			ieee: "IEEE Style",
			vancouver: "Vancouver Style",
		};
		return styles[id] || id;
	};

	return (
		<div className="space-y-6">
			<div className="text-center mb-8">
				<h3 className="text-xl font-heading mb-2">Final Review</h3>
				<p className="text-muted-foreground">
					Review your paper specifications and approved outline before generation
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Paper Type & Approach</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">Paper Type:</span>
							<p className="font-medium">
								{getPaperTypeName(preferences?.genre || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Academic Approach:</span>
							<p className="font-medium">
								{getApproachName(preferences?.mood || "")}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Research Focus</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">
								Primary Topic:
							</span>
							<p className="font-medium">
								{preferences?.characters?.protagonist?.name || "Not specified"}
							</p>
							<p className="text-sm text-muted-foreground">
								{preferences?.characters?.protagonist?.occupation || "General Studies"}
							</p>
							<div className="flex flex-wrap gap-1 mt-1">
								{preferences?.characters?.protagonist?.traits?.map(
									(keyword: string) => (
										<Badge key={keyword} variant="outline" className="text-xs">
											{keyword}
										</Badge>
									)
								)}
							</div>
						</div>
						{preferences?.characters?.love_interest?.name && (
							<div>
								<span className="text-sm text-muted-foreground">
									Secondary Topic:
								</span>
								<p className="font-medium">
									{preferences?.characters?.love_interest?.name}
								</p>
								<p className="text-sm text-muted-foreground">
									{preferences?.characters?.love_interest?.occupation}
								</p>
								<div className="flex flex-wrap gap-1 mt-1">
									{preferences?.characters?.love_interest?.traits?.map(
										(keyword: string) => (
											<Badge key={keyword} variant="outline" className="text-xs">
												{keyword}
											</Badge>
										)
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Academic Context</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">
								Academic Level:
							</span>
							<p className="font-medium">
								{getAcademicLevelName(preferences?.setting?.time_period || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Institution:</span>
							<p className="font-medium">{preferences?.setting?.location || "Not specified"}</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Timeline:</span>
							<p className="font-medium">
								{getTimeConstraintName(preferences?.setting?.atmosphere || "")}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Paper Specifications</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-sm text-muted-foreground">Research Methods:</span>
							<div className="flex flex-wrap gap-1 mt-1">
								{preferences?.elements?.tropes?.map((method: string) => (
									<Badge key={method} variant="secondary" className="text-xs">
										{method}
									</Badge>
								))}
							</div>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Academic Rigor:</span>
							<p className="font-medium">
								{getAcademicRigorName(preferences?.elements?.heat_level || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Length:</span>
							<p className="font-medium">
								{getPaperLengthName(preferences?.elements?.story_length || "")}
							</p>
						</div>
						<div>
							<span className="text-sm text-muted-foreground">Citation Style:</span>
							<p className="font-medium">
								{getCitationStyleName(preferences?.elements?.conflict_type || "")}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Approved Outline Preview */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center">
						<FileText className="mr-2 h-5 w-5" />
						Approved Paper Outline
					</CardTitle>
					<CardDescription>
						This is the outline that will be used to generate your academic paper
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Textarea
						value={formattedPrompt}
						readOnly
						className="min-h-[200px] resize-none bg-muted/50 font-mono text-sm"
					/>
					<div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
						<p>{formattedPrompt.length} characters</p>
						<p className="text-green-600 dark:text-green-400">
							✓ Approved and ready for generation
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Academic Integrity Notice */}
			<Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
				<CardHeader>
					<CardTitle className="text-lg flex items-center text-amber-800 dark:text-amber-200">
						<AlertTriangle className="mr-2 h-5 w-5" />
						Academic Integrity Notice
					</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-amber-700 dark:text-amber-300">
					<p className="mb-2">
						This tool generates academic content to help with research and writing. Please ensure that:
					</p>
					<ul className="list-disc pl-5 space-y-1">
						<li>You properly cite all sources and give credit where due</li>
						<li>You review and verify all generated content for accuracy</li>
						<li>You follow your institution's academic integrity policies</li>
						<li>You use this as a starting point and add your own analysis and insights</li>
					</ul>
				</CardContent>
			</Card>

			<div className="text-center pt-6">
				{isGuest ? (
					<div className="space-y-4">
						<div className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
							<Crown className="h-8 w-8 text-primary mx-auto mb-3" />
							<h3 className="text-lg font-heading mb-2">Ready to Generate Your Paper?</h3>
							<p className="text-muted-foreground text-sm mb-4">
								Create an account to generate your personalized academic paper and save it to your library.
							</p>
							<Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
								<Link href="/auth/sign-up">
									<Crown className="mr-2 h-5 w-5" />
									Create Account to Generate Paper
								</Link>
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Your paper specifications have been saved and will be ready when you create your account.
						</p>
					</div>
				) : (
					<>
						<Button
							onClick={onGenerate}
							disabled={isGenerating}
							size="lg"
							className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
						>
							{isGenerating ? (
								<>
									<Loader2 className="mr-2 h-5 w-5 animate-spin" />
									Generating Your Paper...
								</>
							) : (
								<>
									<Sparkles className="mr-2 h-5 w-5" />
									Generate My Paper
								</>
							)}
						</Button>

						{isGenerating && (
							<p className="text-sm text-muted-foreground mt-4">
								Our AI is crafting your academic paper... This may take a few moments.
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}