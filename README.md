# People Notes Plugin

An Obsidian plugin for creating timestamped notes for people in organized directories with automatic embedding and per-person table of contents.

## Features

- **Structured Organization**: Create notes for people in organized directories (`People/{PersonName}/`)
- **Automatic Timestamping**: Notes are automatically named with timestamps (`${Name} YYYY-MM-DD--HH-mm-ss.md`)
- **Fuzzy Search**: Smart person selection with autocomplete that finds existing people or creates new ones
- **Flexible Embedding**: Choose between linking (`[[note]]`) or embedding (`![[note]]`) in current notes
- **Per-Person TOCs**: Each person gets their own automatically-maintained table of contents
- **Clean Templates**: Notes start ready for writing with minimal structure and cursor positioned at the end
- **Configurable Settings**: Customize directory paths, embedding formats, and timestamp precision
- **Full TypeScript**: Strict typing throughout with comprehensive test coverage (64+ tests)

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
2. Build the plugin: `npm run build`
3. Copy the built files (`main.js`, `manifest.json`, `styles.css`) to `.obsidian/plugins/people-notes/` in your test vault
4. Enable the plugin in Obsidian settings
5. Use the "Create People Note" command (default hotkey: `Cmd/Ctrl+Shift+U`) or click the ribbon icon

For hot reload during development, install the Hot Reload plugin in your test vault and use `npm run dev`.

## Usage

### Creating Notes

1. **Open the selector**: Use `Cmd/Ctrl+Shift+U` or click the ribbon icon
2. **Search for a person**: Start typing a name - existing people will appear with autocomplete
3. **Select or create**: Choose an existing person or create a new one
4. **Start writing**: The note opens with cursor positioned at the end, ready for bullet points

### File Structure

The plugin creates a clean, organized structure:

```
People/
├── John Doe/
│   ├── Table of Contents.md
│   ├── John Doe 2025-09-11--10-18-48.md
│   └── John Doe 2025-09-12--14-30-15.md
└── Jane Smith/
    ├── Table of Contents.md
    └── Jane Smith 2025-09-11--16-45-22.md
```

### Settings

Configure the plugin in Settings → People Notes:

- **People directory path**: Where person directories are created (default: `People`)
- **TOC filename**: Name for per-person table of contents files (default: `Table of Contents.md`)
- **Note link format**: Wikilink `[[name]]` or Markdown `[name](path)` format
- **Note embedding style**: Link to notes `[[name]]` or embed them inline `![[name]]`
- **Timestamp format**: Include or exclude seconds in filenames

## Architecture

The plugin follows a modular service-oriented architecture:

- **DirectoryManager**: Handles file system operations and person directory management
- **PeopleNotesService**: Creates timestamped notes with clean templates
- **FuzzySearchService**: Provides intelligent person search with scoring algorithms
- **EmbeddingService**: Manages note embedding and per-person table of contents
- **PersonSelectorModal**: UI for person selection with fuzzy search
- **SettingsTab**: Configuration interface for all plugin options

All services use dependency injection and are fully tested with 64+ comprehensive unit tests.