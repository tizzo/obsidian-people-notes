# Development Workflow for People Notes Plugin

This document explains how to set up and use a local development environment for the People Notes plugin.

## Prerequisites

- Node.js (v16 or higher)
- Obsidian installed
- Git

## Initial Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd people-notes
   npm install
   ```

2. **Create Test Vault**
   - Create a new folder for your test vault (e.g., `test-vault`)
   - Open this folder in Obsidian as a new vault
   - This keeps your development separate from your production notes

## Development Commands

- `npm run dev` - Start development mode with file watching
- `npm run build` - Build for production
- `npm test` - Run all tests
- `npm test:watch` - Run tests in watch mode
- `npm test:coverage` - Run tests with coverage report
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues automatically
- `npm run typecheck` - Run TypeScript type checking

## Local Testing Setup

### Method 1: Manual Installation

1. **Start Development Mode**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

2. **Install in Test Vault**
   ```bash
   # Create the plugin directory in your test vault
   mkdir -p "test-vault/.obsidian/plugins/people-notes"
   
   # Copy built files to test vault
   cp main.js manifest.json styles.css "test-vault/.obsidian/plugins/people-notes/"
   ```

3. **Enable Plugin**
   - Open Obsidian with your test vault
   - Go to Settings → Community Plugins
   - Disable Safe Mode if not already done
   - Find "People Notes" and enable it

### Method 2: Symlink for Hot Reloading

1. **Create Symlink** (Recommended for active development)
   ```bash
   # From the plugin root directory
   ln -sf "$(pwd)" "test-vault/.obsidian/plugins/people-notes"
   ```

2. **Install Hot Reload Plugin** (Optional but recommended)
   - Install the "Hot Reload" plugin from Obsidian Community Plugins
   - This will automatically reload your plugin when files change

### Method 3: Development Script

Create a `dev-install.sh` script:

```bash
#!/bin/bash
# Build and install to test vault
npm run build
cp main.js manifest.json styles.css "test-vault/.obsidian/plugins/people-notes/"
echo "Plugin installed to test vault"
```

Make it executable and use:
```bash
chmod +x dev-install.sh
./dev-install.sh
```

## Testing Your Changes

1. **Make Changes** to any TypeScript file in `src/`
2. **Development Mode** will automatically rebuild
3. **Reload Plugin** in Obsidian:
   - If using Hot Reload: automatic
   - Manual: Disable and re-enable the plugin, or restart Obsidian
4. **Test Features**:
   - Try the "Create People Note" command (Ctrl/Cmd+Shift+P)
   - Use the ribbon icon
   - Test the person selector modal
   - Verify settings work correctly

## Directory Structure During Development

```
people-notes/
├── src/                          # TypeScript source files
├── test-vault/                   # Your test vault
│   └── .obsidian/
│       └── plugins/
│           └── people-notes/     # Installed plugin
├── main.js                       # Compiled output
├── manifest.json                 # Plugin metadata
├── styles.css                    # Plugin styles
└── ...
```

## Debugging

1. **Console Logging**: Use `console.log()` in your TypeScript code
2. **Developer Tools**: Open with `Ctrl/Cmd+Shift+I` in Obsidian
3. **Network Tab**: Check for file loading issues
4. **Source Maps**: Available in development mode for easier debugging

## Common Issues and Solutions

### Plugin Not Loading
- Check that all three files (main.js, manifest.json, styles.css) are in the plugin directory
- Verify the manifest.json has the correct plugin ID
- Check the browser console for error messages

### Changes Not Appearing
- Make sure `npm run dev` is running and rebuilding
- If using Hot Reload, check that `.hotreload` file exists in plugin directory
- Try manually reloading the plugin or restarting Obsidian

### TypeScript Errors
- Run `npm run typecheck` to see all type errors
- Fix errors before building
- Use strict TypeScript settings for better code quality

### Test Failures
- Run `npm test` to see what's failing
- Use `npm test:watch` for continuous testing during development
- Update tests when changing functionality

## Release Preparation

1. **Run Full Test Suite**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

2. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Test in Clean Environment**
   - Create a fresh test vault
   - Install the built plugin
   - Test all features thoroughly

## Tips for Effective Development

1. **Use TypeScript Strict Mode** - Catches errors early
2. **Write Tests First** - Follow TDD principles
3. **Small Commits** - Make frequent, focused commits
4. **Test Early and Often** - Don't wait until the end to test
5. **Use the Hot Reload Plugin** - Saves time during development
6. **Keep Test Vault Separate** - Avoid corrupting your real notes
7. **Use Browser Dev Tools** - Essential for debugging
8. **Check Obsidian API Changes** - Update when Obsidian updates

## VSCode Setup (Optional)

If using VSCode, create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "node_modules": true,
    "main.js": true,
    "*.js.map": true
  }
}
```

This workflow ensures you can develop efficiently while maintaining code quality and thorough testing.