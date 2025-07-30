# Story Generation Flow Documentation

This document provides a comprehensive overview of the story creation and generation flow in the Romance by Me application. It covers the complete process from user input to finished story generation, including UI components, API routes, database interactions, and implementation details.

## Table of Contents

1. [Flow Overview](#flow-overview)
2. [UI Components and Flow](#ui-components-and-flow)
3. [API Integration](#api-integration)
4. [Database Schema](#database-schema)
5. [Code Implementation Details](#code-implementation-details)
6. [Replication Guide](#replication-guide)

## Flow Overview

The story generation process follows this high-level flow:

```
User Input (6-step wizard) → Story Creation → DeepWriter Project → Story Generation → Content Delivery
```

### Key Stages:

1. **User Input Collection** - 6-step wizard form
2. **Story Record Creation** - Database entry with user preferences
3. **DeepWriter Project Creation** - External API project setup
4. **Project Configuration** - Prompt generation and project updates
5. **Work Generation** - Actual story generation via DeepWriter API
6. **Status Monitoring** - Real-time progress tracking
7. **Content Retrieval** - Finished story content delivery

## UI Components and Flow

### Primary Screens

#### 1. CreateScreen.tsx (`screens/CreateScreen.tsx`)

The main wizard interface with 6 distinct steps:

**Step 1: Protagonist Setup**

- Character name input
- Location setting
- Time period selection (Historical, Modern, Futuristic, Fantasy)
- Character interests (up to 3 selections)
- Optional character image upload

**Step 2: Love Interest Configuration**

- Love interest type selection:
  - Brooding Bad Boy
  - Sweet Next Door
  - Powerful CEO
  - Mysterious Supernatural
- Optional love interest name

**Step 3: Story Style**

- Genre blend selection (Contemporary, Fantasy, Historical, Paranormal, Comedy)
- Spice level (Sweet, Spicy, Steamy, Explicit)

**Step 4: Story Elements**

- Romantic tropes selection (Enemies to Lovers, Friends to Lovers, Fake Dating, etc.)
- Plot pace (Slow Burn, Moderate, Fast Paced)

**Step 5: Setting Details**

- Setting type (Small Town, Big City, Castle, Space Station, Fantasy World, Tropical Beach)
- Novel length (Short ~100 pages, Medium ~200 pages, Long ~300 pages)

**Step 6: Review & Customize**

- Summary of all selections
- Optional story title input
- Optional additional notes

#### 2. StoryStatusScreen.tsx (`screens/StoryStatusScreen.tsx`)

Real-time generation monitoring interface featuring:

- Progress bar with percentage completion
- Step-by-step status tracking
- Creation timeline with timestamps
- Cancel generation option
- Notification preferences
- Educational content while waiting

### UI Components

#### WizardProgress (`components/WizardProgress.tsx`)

```typescript
type WizardProgressProps = {
	currentStep: number;
	totalSteps: number;
};
```

- Visual progress indicator
- Step counter display
- Animated progress bar

#### InterestChip (`components/InterestChip.tsx`)

```typescript
type InterestChipProps = {
	icon: string;
	label: string;
	selected: boolean;
	onPress: () => void;
};
```

- Selectable interest tags
- Icon + text display
- Selection state management

## API Integration

### DeepWriter API Client (`services/DeepwriterApiClient.ts`)

**Configuration:**

```typescript
interface DeepwriterApiConfig {
	baseURL: string; // 'https://www.deepwriter.com/api'
	apiKey: string;
	timeout?: number;
}
```

**Key Methods:**

- `get<T>(endpoint: string, params?: any)`
- `post<T>(endpoint: string, data?: any)`
- `patch<T>(endpoint: string, data?: any, params?: any)`

### DeepWriter Service (`services/DeepwriterService.ts`)

**Core API Endpoints:**

1. **Create Project** - `/createProject`

   ```typescript
   POST /createProject
   Body: {
     newProjectName: string,
     email: string
   }
   Response: { id: string }
   ```

2. **Update Project** - `/updateProject`

   ```typescript
   PATCH /updateProject?projectId={id}
   Body: {
     prompt: string,
     author?: string,
     title?: string
   }
   ```

3. **Generate Work** - `/generateWork`

   ```typescript
   POST /generateWork
   Body: {
     projectId: string,
     is_default: boolean
   }
   Response: { message: string, jobId: string }
   ```

4. **Check Job Status** - `/jobs/{jobId}/status`

   ```typescript
   GET / jobs / { jobId } / status;
   Response: DeepwriterJob;
   ```

5. **Get Job Content** - `/jobs/{jobId}/content`
   ```typescript
   GET / jobs / { jobId } / content;
   Response: DeepwriterContent;
   ```

### React Hooks

#### useDeepwriter (`hooks/useDeepwriter.ts`)

```typescript
interface UseDeepwriterResult {
	createProject: (
		userId: string,
		storyId: string,
		name: string,
		description?: string
	) => Promise<DeepwriterProject | null>;
	updateProject: (
		projectId: string,
		prompt: string,
		author?: string,
		title?: string
	) => Promise<DeepwriterProject | null>;
	generateWork: (
		userId: string,
		storyId: string,
		projectId: string
	) => Promise<DeepwriterJob | null>;
	checkJobStatus: (jobId: string) => Promise<DeepwriterJob | null>;
	getJobContent: (jobId: string) => Promise<DeepwriterContent | null>;
	startStatusPolling: (jobId: string, interval?: number) => void;
	stopStatusPolling: () => void;
	// ... other methods
}
```

#### useStories (`hooks/useStories.ts`)

```typescript
interface UseStoriesResult {
	createStory: (
		userId: string,
		title: string,
		preferences: any
	) => Promise<Story | null>;
	updateStoryStatus: (storyId: string, status: StoryStatus) => Promise<void>;
	getStoryById: (storyId: string) => Promise<Story | null>;
	getStoryContent: (storyId: string) => Promise<StoryContent | null>;
	// ... other methods
}
```

## Database Schema

### Key Tables

#### 1. romance_by_me_stories

```sql
- id: string (primary key)
- user_id: string (foreign key)
- title: string
- preferences: json (StoryPreferences)
- status: enum (draft, generating, completed, failed)
- word_count: integer
- read_time: integer
- is_public: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### 2. romance_by_me_jobs

```sql
- id: string (primary key)
- user_id: string (foreign key)
- story_id: string (foreign key)
- deepwriter_project_id: string
- deepwriter_job_id: string
- status: string
- progress: integer
- created_at: timestamp
- updated_at: timestamp
```

#### 3. romance_by_me_story_content

```sql
- id: string (primary key)
- story_id: string (foreign key)
- content: json (chapters and metadata)
- created_at: timestamp
```

### Data Types

#### StoryPreferences

```typescript
interface StoryPreferences {
	genre: string;
	setting: string;
	era: string;
	protagonistGender: string;
	loveInterestGender: string;
	tropes: string[];
	spiceLevel: number; // 1-5
	length: "short" | "medium" | "long";
	style: string;
	additionalNotes?: string;
}
```

#### StoryContent

```typescript
interface StoryContent {
	id: string;
	storyId: string;
	chapters: StoryChapter[];
	metadata: {
		wordCount: number;
		readingTime: number;
		lastUpdated: string;
	};
}
```

## Code Implementation Details

### Story Generation Process (`screens/CreateScreen.tsx:627-696`)

```typescript
const handleGenerateStory = async () => {
	if (!user) {
		alert("Please log in to generate a story");
		return;
	}

	try {
		setIsGenerating(true);

		// 1. Generate story preferences for DeepWriter
		const storyPreferences = await generateDeepWriterPrompt(formData);

		// 2. Create a new story in the database
		const storyTitle = formData.title || `${formData.characterName}'s Romance`;
		const story = await createStory(user.id, storyTitle, storyPreferences);

		if (!story) {
			throw new Error("Failed to create story");
		}

		// 3. Create a project in DeepWriter
		const project = await createProject(
			user.id,
			story.id,
			storyTitle,
			`A romance story about ${
				formData.characterName || "a protagonist"
			} and their love interest`
		);

		if (!project) {
			throw new Error("Failed to create DeepWriter project");
		}

		// 4. Generate super prompt
		const superPrompt = storyPreferences.additionalNotes || "";

		// 5. Update project with prompt and user data
		const updatedProject = await updateProject(
			project.id,
			superPrompt,
			user.email || user.id,
			storyTitle
		);

		if (!updatedProject) {
			throw new Error("Failed to update project with prompt");
		}

		// 6. Generate work using the updated project
		const job = await generateWork(user.id, story.id, project.id);

		if (!job) {
			throw new Error("Failed to start story generation");
		}

		// 7. Navigate to the story status screen
		navigation.navigate("StoryStatus", { storyId: story.id, jobId: job.id });
	} catch (error) {
		console.error("Error generating story:", error);
		alert("Failed to generate story. Please try again.");
	} finally {
		setIsGenerating(false);
	}
};
```

### Prompt Generation (`screens/CreateScreen.tsx:548-622`)

The system generates a comprehensive prompt by combining:

- Character details (name, location, time period, interests)
- Love interest specifications (type, name)
- Story style preferences (genres, spice level, tropes, pace, setting, length)
- Additional user notes

### Status Polling (`hooks/useDeepwriter.ts:226-248`)

```typescript
const startStatusPolling = useCallback(
	(jobId: string, interval: number = 5000) => {
		// Clear any existing polling
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}

		// Start new polling
		const intervalId = setInterval(async () => {
			const job = await checkJobStatus(jobId);

			// Stop polling if job is completed or failed
			if (job && (job.status === "completed" || job.status === "failed")) {
				stopStatusPolling();

				// If job is completed, fetch content
				if (job.status === "completed") {
					await getJobContent(jobId);
				}
			}
		}, interval);

		setPollingInterval(intervalId);
	},
	[checkJobStatus, getJobContent, pollingInterval]
);
```

### Database Operations

**Story Creation:**

```typescript
const createStoryMutation = useMutation({
	mutationFn: async ({
		userId,
		title,
		preferences,
	}: {
		userId: string;
		title: string;
		preferences: any;
	}) => {
		const { data, error } = await storyService.createStory(
			userId,
			title,
			preferences
		);
		if (error) throw error;
		return data;
	},
	onSuccess: (newStory: Story | null) => {
		if (newStory) {
			queryClient.setQueryData(["userData", authUser?.id], (oldData: any) => ({
				...oldData,
				stories: [...(oldData?.stories || []), newStory],
			}));
		}
	},
});
```

## Replication Guide

### Dependencies Required

```json
{
	"react": "^18.x",
	"react-native": "^0.72.x",
	"@tanstack/react-query": "^4.x",
	"@supabase/supabase-js": "^2.x",
	"@react-navigation/native": "^6.x",
	"@react-navigation/stack": "^6.x",
	"@expo/vector-icons": "^13.x",
	"react-native-safe-area-context": "^4.x",
	"date-fns": "^2.x"
}
```

### Environment Variables

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPWRITER_API_URL=https://www.deepwriter.com/api
DEEPWRITER_API_KEY=your_deepwriter_api_key
```

### Database Setup

1. **Create Supabase Tables:**

   - romance_by_me_stories
   - romance_by_me_jobs
   - romance_by_me_story_content

2. **Set up Row Level Security (RLS)**
3. **Create necessary indexes for performance**

### Key Files to Implement

1. **Core Components:**

   - screens/CreateScreen.tsx
   - screens/StoryStatusScreen.tsx
   - components/WizardProgress.tsx
   - components/InterestChip.tsx

2. **Services:**

   - services/DeepwriterApiClient.ts
   - services/DeepwriterService.ts

3. **Hooks:**

   - hooks/useDeepwriter.ts
   - hooks/useStories.ts

4. **Types:**
   - types/schema.ts (StoryPreferences, StoryContent, etc.)

### API Integration Steps

1. **Configure DeepWriter API Client**
2. **Implement authentication flow**
3. **Set up error handling and loading states**
4. **Implement real-time status polling**
5. **Handle content storage and retrieval**

### Navigation Setup

```typescript
// Add to your navigation stack
<Stack.Screen
  name="Create"
  component={CreateScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="StoryStatus"
  component={StoryStatusScreen}
  options={{ headerShown: false }}
/>
```

### State Management

- Uses React Query for server state management
- Local component state for form data
- Real-time subscriptions for database changes
- Polling mechanism for external API status updates

This documentation provides the complete blueprint for replicating the story generation flow in any React Native application with the same feature requirements.
