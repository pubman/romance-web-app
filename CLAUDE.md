# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Romance by Me is a Next.js application for creating personalized romantic stories. It's built on the Next.js + Supabase starter template with authentication, story creation wizard, and user dashboard functionality.

## Development Commands

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build production version
- `bun run start` - Start production server
- `bun run lint` - Run ESLint checks

## Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth with SSR cookies
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Fonts**: Playfair Display (headings) and Inter (body text)
- **Theme**: next-themes for dark/light mode support

### Key Directories Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components
  - `ui/` - shadcn/ui base components
  - `wizard-steps/` - Story creation wizard steps
- `lib/` - Utility functions and Supabase client configurations
- `hooks/` - Custom React hooks

### Authentication Flow

- Uses Supabase Auth with cookie-based sessions via `@supabase/ssr`
- Three Supabase clients: `client.ts` (browser), `server.ts` (server), middleware handled separately
- Middleware at root level handles session updates across all routes
- Protected routes use `app/protected/layout.tsx` wrapper

### Story Creation System

The core feature is a multi-step wizard (`StoryWizard` component) that collects:

1. Genre & Mood selection
2. Character details (protagonist and love interest)
3. Setting (time period, location, atmosphere)
4. Story elements (tropes, heat level, length, conflict type)
5. Review and generation step

Story preferences are managed in a single state object with TypeScript interface `StoryPreferences`.

### Database Structure

Info on the db schema can be found in `SCHEMA_SUMMARY`

### Component Architecture

- Uses shadcn/ui design system with New York style variant
- Components follow compound pattern (Card, CardHeader, CardContent, etc.)
- Icons from Lucide React
- Custom color palette includes romance, coral, and lavender themed colors

### Styling Approach

- Tailwind configured with CSS variables for theming
- Custom font configuration with CSS variables (`--font-inter`, `--font-playfair`)
- Theme-aware components using `next-themes`
- Custom romantic color gradients defined in Tailwind config

### Environment Requirements

Requires these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` (note: different from standard ANON_KEY)
