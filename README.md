# People Notes Plugin

An Obsidian plugin for creating timestamped notes for people in organized directories with automatic embedding.

## Features

- Create notes for people in structured directories (`People/{PersonName}/`)
- Automatic timestamping of notes (`${Name} YYYY-MM-DD--HH-mm-ss.md`)
- Fuzzy search for person selection with autocomplete
- Automatic embedding in current note and table of contents
- Full TypeScript with strict typing
- Comprehensive test coverage

## Development

### Setup

```bash
npm install
```

### Development Commands

```bash
npm run dev          # Start development with watch mode
npm run build        # Build for production
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint         # Lint code
npm run lint:fix     # Lint and fix code automatically
npm run typecheck    # TypeScript type checking
```

### Local Testing

1. Create a test vault separate from your production notes
2. Copy the plugin files to `.obsidian/plugins/people-notes/` in your test vault
3. Enable the plugin in Obsidian settings
4. Use the "Create People Note" command from the command palette

For hot reload during development, install the Hot Reload plugin in your test vault.

## Architecture

The plugin follows a modular architecture with clear separation of concerns:

- **DirectoryManager**: Handles file system operations for People directories
- **PeopleNotesService**: Creates timestamped notes with proper naming
- **FuzzySearchService**: Provides person selection with autocomplete
- **EmbeddingService**: Manages note embedding in current note and TOC
- **SettingsService**: Manages plugin configuration

All services are fully tested with comprehensive unit and integration tests.