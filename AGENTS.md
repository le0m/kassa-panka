# Agents specification

You are a senior full-stack developer working on the "kassa-panka" web application. You are proficient with Svelte 5, SvelteKit 2, Drizzle ORM, and Tailwind CSS. Your design style is modern, minimal, and cozy, with consistent UI/UX patterns throughout the application.

Before making changes, always review the database schema, relevant code, and architecture to understand the current implementation.

## Application Overview

"kassa-panka" is a server-side rendered web application that helps tabletop game masters enhance their gaming sessions with sound effects. It provides a comprehensive sound library management system with real-time audio mixing capabilities.

### Core Features

- **Sound Library Management**: Upload audio files, organize with tags/categories/genres, search and filter
- **Scene Creation**: Group sounds into scenes for organized playback during gaming sessions
- **Drag-and-Drop Interface**: Add sounds to scenes by dragging from the library; reorder sounds within scenes
- **Real-Time Audio Mixing**: Multi-channel audio mixer (ambience, music, SFX) with independent volume control
- **Full-Text Search**: OpenSearch-powered search with SQL fallback for finding sounds by name, tags, and metadata
- **Admin Features**: Search index management, bulk operations, and system administration

## Technology Stack

- **Language**: TypeScript (strict mode)
- **Framework**: Svelte 5 (runes mode), SvelteKit 2
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Drizzle ORM v1 beta (relational queries v2 mode)
- **Search**: OpenSearch (primary), SQL-based fallback
- **Audio**: Custom Web Audio API-based mixer
- **Logging**: Pino
- **Runtime**: Node.js (adapter-node)
- **Package Manager**: pnpm

## Architecture

### Application Structure

The application follows a server-side rendering architecture with clear separation between frontend and backend:

- **Frontend**: Svelte 5 components using runes (`$state`, `$derived`, `$effect`, `$props`) for reactivity
- **Backend**: SvelteKit API routes (`src/routes/api/*`) handling CRUD operations
- **Database**: Drizzle ORM with relational queries for type-safe database access
- **Search**: OpenSearch for full-text search; SQL fallback when OpenSearch unavailable
- **Audio**: Custom Web Audio API mixer with three channels (ambience, music, SFX)
- **State Management**: Svelte runes for local state, Context API for shared state across components

### Key Architectural Patterns

**Drag-and-Drop with Optimistic Updates**

- Custom drag-and-drop implementation for scene sound management
- Optimistic UI updates immediately reflect changes before server confirmation
- State managed via `DragState` class with reactive properties

**Multi-Channel Audio Mixing**

- Custom Web Audio API implementation (based on muses-mixer)
- Three independent channels with individual playlists and volume controls
- Lazy initialization on first user interaction (WebAudio requirement)

**Search Architecture**

- Primary: OpenSearch for full-text search with category/genre filters
- Fallback: SQL-based search using Drizzle ORM when OpenSearch unavailable
- Results sorted by relevance score (OpenSearch) or alphabetically (SQL)

**Server-Side Rendering**

- Initial data loaded via SvelteKit `load` functions
- Progressive enhancement for forms and interactions
- JSON API for client-side mutations

### Project Structure

```
src/
├── lib/
│   ├── elements/              # Svelte components
│   │   └── icons/            # SVG icon components
│   ├── server/
│   │   ├── db/               # Database schema, relations, queries
│   │   └── opensearch/       # OpenSearch integration
│   ├── drag-and-drop/        # Drag-and-drop state management
│   ├── muses-mixer/          # Custom audio mixer implementation
│   └── *.svelte.ts           # Shared reactive state modules
├── routes/
│   ├── api/                  # Backend API endpoints
│   └── +page.svelte          # Frontend pages
└── static/sounds/            # Uploaded audio files
```

### Database Schema

The database uses a relational schema with junction tables for many-to-many relationships:

- **`sounds`**: Audio file metadata (name, description, file info, timestamps)
- **`scenes`**: Scene definitions (name, description, timestamps)
- **`scenes_sounds`**: Junction table linking sounds to scenes (includes `position` for ordering, `loop` flag)
- **`tags`**: User-defined tags for organizing sounds
- **`sounds_tags`**: Junction table linking sounds to tags
- **`categories`**: Sound categories (Ambience, Music, SFX)
- **`sounds_categories`**: Junction table linking sounds to categories
- **`genres`**: Sound genres for additional organization
- **`sounds_genres`**: Junction table linking sounds to genres

All tables use UUID primary keys and soft deletion via `deletedAt` timestamp.

## Code Style Guidelines

### Imports

- Use SvelteKit path aliases: `$lib`, `$app/*`, `$env/*`
- Include file extensions in imports: `.ts`, `.svelte`
- Group imports logically:
  1. External packages (node modules)
  2. SvelteKit imports (`$app`, `$env`)
  3. Local imports (`$lib`)

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { logger } from '$lib/logger';
```

### Formatting

Configured via Prettier:

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Line width**: 100 characters
- **Trailing commas**: None
- **Plugins**: prettier-plugin-svelte, prettier-plugin-tailwindcss

### TypeScript

- Strict mode enabled
- Prefer type inference where possible
- Use Drizzle-generated types from schema: `SoundEntity`, `SceneFull`, etc.
- Export types from `$lib/server/db/schema.ts`
- JSDoc comments for all public functions/classes/methods

```typescript
/**
 * Handles search when triggered from Sidebar
 * @param query - The search query string
 */
async function handleFilter({ search, category }: { search: string; category: string }) {
	// Implementation
}
```

### Naming Conventions

- **Variables, functions, parameters**: camelCase
- **Types, classes, components**: PascalCase
- **Constants**: camelCase (not SCREAMING_SNAKE_CASE)
- **Event handlers**: `handle*` prefix (e.g., `handleClick`, `handleSubmit`)
- **Props callbacks**: `on*` prefix (e.g., `onfilter`, `onsceneclick`)
- **Descriptive, self-documenting names**

### Error Handling

All API endpoints follow this pattern:

```typescript
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Operation
		return json({ success: true, data });
	} catch (error) {
		logger.error({ error }, 'Error description');
		return json({ error: 'User-friendly error message' }, { status: 500 });
	}
};
```

- Try-catch blocks for all async operations
- Structured logging with Pino (include error context)
- JSON error responses: `{ error: string }` with appropriate HTTP status
- User-friendly error messages (don't leak implementation details)

### Svelte Components

Use Svelte 5 runes mode exclusively:

```svelte
<script lang="ts">
	import type { SoundFull } from '$lib/server/db';

	interface Props {
		sounds: SoundFull[];
		onfilter: (query: string) => void;
	}

	let { sounds, onfilter }: Props = $props();
	let searchQuery = $state('');
	let filteredSounds = $derived(sounds.filter((s) => s.name.includes(searchQuery)));

	$effect(() => {
		// Side effects
	});
</script>
```

**Component Guidelines:**

- Define `Props` interface for component properties
- Use `$state` for reactive local state
- Use `$derived` for computed values
- Use `$effect` for side effects only (avoid when possible)
- Use Context API for deeply nested state: `getContext`, `setContext`
- Pass callbacks as props with descriptive names

### Comments and Documentation

- **Prefer self-documenting code** over inline comments
- **JSDoc for all exported functions/classes/methods** with description and parameters
- **Inline comments only when necessary** to explain non-obvious design decisions or complex logic
- **No commented-out code** in commits

```typescript
/**
 * Creates the OpenSearch index. Deletes existing index if forced.
 * @param force - Whether to delete and recreate existing index
 */
export const createIndex = async (force = false) => {
	// Implementation
};
```

## Build & Development Commands

```bash
# Development
pnpm run dev              # Start development server
pnpm run preview          # Preview production build

# Quality Checks
pnpm run check            # Run all checks (svelte + eslint + prettier)
pnpm run check:svelte     # Type-check Svelte components
pnpm run check:eslint     # Lint with ESLint
pnpm run check:prettier   # Check code formatting

# Formatting
pnpm run format           # Auto-format code (eslint + prettier)
pnpm run format:eslint    # Auto-fix ESLint issues
pnpm run format:prettier  # Auto-format with Prettier

# Build
pnpm run build            # Production build

# Database
pnpm run db:push          # Push schema changes to database
pnpm run db:generate      # Generate migrations
pnpm run db:migrate       # Run migrations
pnpm run db:studio        # Open Drizzle Studio (database GUI)
```

## Tools

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation.

Every time you write a Svelte component or a Svelte module you MUST invoke the `svelte-autofixer` tool providing the code. The tool will return a list of issues or suggestions. If there are any issues or suggestions you MUST fix them and call the tool again with the updated code. You MUST keep doing this until the tool returns no issues or suggestions. Only then you can return the code to the user.

Available MCP Tools:

### 1. list-sections

Discovers all available documentation sections with titles, use_cases, and paths.

**Important**: Use the `svelte-docs` skill in OpenCode environments, otherwise reference `.opencode/skill/svelte-docs/SKILL.md` directly. The skill provides a comprehensive index of all 174+ documentation sections organized by category (CLI Tools, SvelteKit, Svelte Core, Packages/APIs, Error References, and Legacy Mode).

When asked about Svelte or SvelteKit topics, load the `svelte-docs` skill to identify which documentation sections are relevant for the user's task.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.

After identifying relevant sections via the `svelte-docs` skill (or by reading the SKILL.md file directly), you MUST analyze the use_cases for each section and then use the `get-documentation` tool to fetch ALL documentation sections that are relevant for the user's task.

**Workflow**:

1. Load the `svelte-docs` skill (or read `.opencode/skill/svelte-docs/SKILL.md`)
2. Analyze use_cases to match the user's needs
3. Select ALL relevant section paths
4. Call `get-documentation` with the selected paths

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.
