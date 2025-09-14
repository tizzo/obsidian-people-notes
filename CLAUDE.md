# Claude Development Notes for People Notes Plugin

This file contains context and instructions for Claude when working on the People Notes Obsidian plugin.

## Project Overview

**People Notes** is an Obsidian plugin that creates timestamped notes for people in organized directories with automatic embedding and per-person table of contents management.

### Key Features
- Create notes for people in structured `People/{PersonName}/` directories
- Automatic timestamping: `{Name} YYYY-MM-DD--HH-mm-ss.md`
- Fuzzy search person selector with autocomplete that finds existing people or creates new ones
- Configurable embedding: Choose between linking (`[[note]]`) or embedding (`![[note]]`) in current notes
- **Clean Per-Person TOCs**: Each person gets their own automatically-maintained TOC file with matching filename format (`{Name} Meeting Notes.md`)
- **Headerless TOC Format**: TOC files contain only clean note lists without headers or metadata
- **TOC Regeneration Command**: Rebuild entire TOC files for selected persons via command palette
- **Smart TOC Self-Exclusion**: TOC files never include themselves in their own contents
- **Configurable TOC Content**: Choose between links `[[note]]` or embeds `![[note]]` in table of contents
- Clean note templates: Minimal structure with cursor positioned at end for immediate writing
- Comprehensive settings: Customizable directory paths, embedding formats, timestamp precision
- Full TypeScript with strict typing and comprehensive test coverage (73 tests)

## Architecture

The plugin follows a modular service-oriented architecture with dependency injection:

### Core Services
1. **DirectoryManager** (`src/DirectoryManager.ts`) - Manages file system operations
2. **PeopleNotesService** (`src/PeopleNotesService.ts`) - Handles note creation workflow
3. **FuzzySearchService** (`src/FuzzySearchService.ts`) - Provides intelligent person search
4. **EmbeddingService** (`src/EmbeddingService.ts`) - Manages note linking and TOC updates

### UI Components
- **PersonSelectorModal** (`src/PersonSelectorModal.ts`) - Main interaction modal
- **SettingsTab** (`src/SettingsTab.ts`) - Plugin configuration interface
- **PeopleNotesPlugin** (`src/main.ts`) - Main plugin class

### Type System
All interfaces and types are defined in `src/types.ts` with strict TypeScript configuration.

## Development Principles

### Test-Driven Development (TDD)
The project was built using strict TDD methodology:
- **Red**: Write failing tests first
- **Green**: Implement minimal code to pass tests
- **Refactor**: Clean up code while maintaining tests

### Code Quality Standards
- **TypeScript Strict Mode**: All nullable checks, no implicit any
- **ESLint Integration**: Automatic code formatting and quality checks
- **95%+ Test Coverage**: Comprehensive unit tests for all core services
- **Dependency Injection**: Services are injected for testability

## File Structure

```
src/
├── main.ts                    # Main plugin class
├── types.ts                   # All TypeScript interfaces
├── DirectoryManager.ts        # File system operations
├── PeopleNotesService.ts      # Note creation logic
├── FuzzySearchService.ts      # Person search functionality
├── EmbeddingService.ts        # Note linking and TOC management
├── PersonSelectorModal.ts     # Main UI modal
├── SettingsTab.ts            # Configuration interface
└── __tests__/                # Test files with mocks
    ├── *.test.ts             # Unit tests for each service
    ├── setup.ts              # Jest configuration
    └── __mocks__/
        └── obsidian.ts       # Mock Obsidian API
```

## Development Commands

```bash
npm run dev        # Development mode with watch
npm run build      # Production build
npm test           # Run all tests
npm test:watch     # Watch mode testing
npm test:coverage  # Coverage report
npm run lint       # Code quality check
npm run lint:fix   # Auto-fix linting issues
npm run typecheck  # TypeScript validation
```

## Testing Philosophy

### Service Layer Testing
Each service has comprehensive unit tests with mocked dependencies:
- **DirectoryManager**: 13 tests covering file operations, name normalization, person info retrieval
- **PeopleNotesService**: 11 tests covering note creation, timestamp formatting, integration
- **FuzzySearchService**: 14 tests covering search algorithms, scoring, result ranking
- **EmbeddingService**: 29 tests covering note embedding, per-person TOC management, configurable link/embed formats, TOC regeneration

### Mock Strategy
- Obsidian API is comprehensively mocked in `__tests__/__mocks__/obsidian.ts`
- Each service is tested in isolation with dependency injection
- Async operations are properly mocked and tested

## Common Development Tasks

### Adding New Features
1. **Write Tests First**: Add failing tests in appropriate `*.test.ts` file
2. **Update Types**: Add new interfaces/types in `src/types.ts` if needed
3. **Implement Service Logic**: Add functionality to appropriate service
4. **Update UI**: Modify modal or settings as needed
5. **Integration**: Wire up in main plugin class
6. **Test Coverage**: Ensure 90%+ coverage maintained

### Modifying Existing Features
1. **Check Tests**: Review existing test cases for the feature
2. **Update Tests**: Modify tests to reflect new requirements
3. **Implement Changes**: Update service logic
4. **Verify**: Run full test suite to ensure no regressions

### Debugging Issues
1. **Run Tests**: `npm test` to identify failing tests
2. **Check Types**: `npm run typecheck` for TypeScript errors
3. **Lint Code**: `npm run lint` for code quality issues
4. **Coverage**: `npm run test:coverage` to identify untested paths

## Obsidian Integration Points

### Core APIs Used
- **Vault**: File creation, modification, reading
- **Workspace**: Active file detection, view management
- **FuzzySuggestModal**: Base class for person selector
- **PluginSettingTab**: Configuration interface
- **Plugin**: Main plugin lifecycle

### File Structure Created
```
vault/
├── People/
│   ├── John Doe/
│   │   ├── John Doe Meeting Notes.md
│   │   ├── John Doe 2025-09-11--10-18-48.md
│   │   └── John Doe 2025-09-12--14-30-15.md
│   └── Jane Smith/
│       ├── Jane Smith Meeting Notes.md
│       └── Jane Smith 2025-09-11--16-45-22.md
```

## Configuration Options

The plugin supports these settings (see `src/types.ts` for full interface):
- **peopleDirectoryPath**: Base directory for people notes (default: "People")
- **tableOfContentsFileName**: TOC filename template with `{name}` placeholder (default: "{name} Meeting Notes.md")
- **embeddingFormat**: Link format - "wikilink" or "markdown-link"
- **noteEmbedType**: Embedding style - "link" or "embed" for `[[note]]` vs `![[note]]`
- **tocContentType**: TOC content format - "link" or "embed" for entries in table of contents
- **timestampFormat**: Timestamp precision - "iso-with-seconds" or "iso-without-seconds"

## Best Practices for Future Development

### Code Style
- Use strict TypeScript with no implicit any
- Follow existing naming conventions (camelCase for variables, PascalCase for classes)
- Add comprehensive JSDoc comments for all public methods
- Prefer composition over inheritance
- Use readonly properties where appropriate

### Testing
- Maintain 90%+ test coverage on core services
- Test error conditions and edge cases
- Use descriptive test names that explain the behavior
- Mock external dependencies consistently
- Test async operations properly with proper await/Promise handling

### Error Handling
- Always provide user-friendly error messages
- Log detailed errors to console for debugging
- Use try-catch blocks for all external API calls
- Fail gracefully with sensible defaults

### Performance
- Use async/await for all file operations
- Cache search results in fuzzy search modal
- Limit search results to prevent UI overload (max 10)
- Use efficient algorithms for timestamp parsing and matching

## Development Workflow Requirements

### Pre-Commit Checklist
**MANDATORY**: Always run these commands before any commit:

1. **Lint Check**: `npm run lint` - Must pass with no errors
2. **Test Suite**: `npm test` - All 73 tests must pass
3. **Build Verification**: `npm run build` - Must compile without errors

If any of these fail, fix the issues before committing. This ensures code quality and prevents broken builds.

### Git Commit Rules

**CRITICAL**: Follow these rules for all commits:

1. **Author Identity**: User must be both author and committer (no Claude attribution)
2. **Commit Messages**: Never include Claude-generated text such as:
   - "🤖 Generated with [Claude Code]"
   - "Co-Authored-By: Claude <noreply@anthropic.com>"
   - Any other Claude attribution or co-authoring
3. **Message Format**: Use clear, professional commit messages:
   ```
   <type>: <description>
   
   - <detailed change 1>
   - <detailed change 2>
   - <detailed change 3>
   ```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`

## Current Status

✅ **Completed**: Full plugin implementation with 73 passing tests, 90%+ coverage on core services
✅ **Tested**: All major workflows and edge cases covered
✅ **Ready**: Plugin builds successfully and ready for local testing

The plugin is feature-complete and ready for production use. Future development should focus on:
1. Additional configuration options based on user feedback
2. Performance optimizations for large vaults
3. Additional embedding formats or integrations
4. Enhanced UI features (keyboard shortcuts, drag-and-drop, etc.)

## Getting Help

- **README.md**: Basic setup and usage instructions
- **DEVELOPMENT.md**: Local development workflow and testing
- **Test Files**: Best examples of how each service should behave
- **TypeScript Types**: `src/types.ts` contains all interface definitions
- **Obsidian API**: https://docs.obsidian.md/ for API reference