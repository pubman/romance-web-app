"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Play, Loader2, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface JobStatusResponse {
	id: string;
	status: string;
	progress: number;
	message: string;
	created_at?: string;
	updated_at?: string;
}

export function JobStatusTest() {
	const [isOpen, setIsOpen] = useState(false);
	const [jobId, setJobId] = useState("01d43fcc-21f6-4b87-9743-d1aad09cba13");
	const [storyId, setStoryId] = useState(
		"ffa877d3-98e0-423b-93b1-31d73e79a899"
	);
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<JobStatusResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const testJobStatus = async () => {
		if (!jobId.trim()) {
			setError("Please enter a job ID");
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);

		try {
			const supabase = createClient();
			const {
				data: { session },
				error: authError,
			} = await supabase.auth.getSession();

			if (authError || !session) {
				throw new Error("Authentication required");
			}

			const response = await fetch(
				`/api/stories/${storyId}/status?jobId=${jobId}`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${session.access_token}`,
						Accept: "*/*",
					},
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || `HTTP ${response.status}: ${response.statusText}`
				);
			}

			// Extract job data from story response for consistency with old interface
			const jobData = data.job || data.story;
			setResponse({
				id: jobData.id,
				status: jobData.status,
				progress: jobData.progress,
				message: jobData.message || "No message",
				created_at: undefined,
				updated_at: undefined,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		} finally {
			setLoading(false);
		}
	};

	const copyResponse = async () => {
		if (response) {
			await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 text-green-800";
			case "failed":
				return "bg-red-100 text-red-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "generating":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<Card className="bg-card/60 backdrop-blur-sm">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
						<CardTitle className="flex items-center justify-between">
							<span className="text-lg">Job Status API Test</span>
							<ChevronDown
								className={`h-4 w-4 transition-transform ${
									isOpen ? "rotate-180" : ""
								}`}
							/>
						</CardTitle>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Input
								placeholder="Enter story ID..."
								value={storyId}
								onChange={(e) => setStoryId(e.target.value)}
								className="w-full"
							/>
							<div className="flex gap-2">
								<Input
									placeholder="Enter job ID to test..."
									value={jobId}
									onChange={(e) => setJobId(e.target.value)}
									className="flex-1"
								/>
								<Button
									onClick={testJobStatus}
									disabled={loading}
									className="flex items-center gap-2"
								>
									{loading ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Play className="h-4 w-4" />
									)}
									Test
								</Button>
							</div>
						</div>

						{error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-sm text-red-800 font-medium">Error:</p>
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}

						{response && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-semibold">Response:</h4>
									<Button
										variant="outline"
										size="sm"
										onClick={copyResponse}
										className="flex items-center gap-2"
									>
										{copied ? (
											<Check className="h-3 w-3" />
										) : (
											<Copy className="h-3 w-3" />
										)}
										{copied ? "Copied!" : "Copy"}
									</Button>
								</div>

								<div className="space-y-4">
									<div className="space-y-2">
										<h5 className="text-sm font-medium text-muted-foreground">
											Job Status
										</h5>
										<div className="p-3 bg-muted/50 rounded-md space-y-2">
											<div className="flex justify-between items-center">
												<span className="text-sm">Job ID:</span>
												<span className="text-sm font-mono">{response.id}</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-sm">Status:</span>
												<Badge className={getStatusColor(response.status)}>
													{response.status}
												</Badge>
											</div>
											<div className="flex justify-between">
												<span className="text-sm">Progress:</span>
												<span className="text-sm font-mono">
													{response.progress}%
												</span>
											</div>
											<div className="space-y-1">
												<span className="text-sm">Message:</span>
												<p className="text-xs bg-background p-2 rounded border font-mono">
													{response.message}
												</p>
											</div>
											{response.created_at && (
												<div className="flex justify-between">
													<span className="text-sm">Created:</span>
													<span className="text-sm font-mono">
														{new Date(response.created_at).toLocaleString()}
													</span>
												</div>
											)}
											{response.updated_at && (
												<div className="flex justify-between">
													<span className="text-sm">Updated:</span>
													<span className="text-sm font-mono">
														{new Date(response.updated_at).toLocaleString()}
													</span>
												</div>
											)}
										</div>
									</div>

									<div className="space-y-2">
										<h5 className="text-sm font-medium text-muted-foreground">
											Raw JSON Response
										</h5>
										<pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
											{JSON.stringify(response, null, 2)}
										</pre>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
