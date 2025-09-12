import { App, PluginSettingTab, Setting } from 'obsidian';
import { EmbeddingFormat, TimestampFormat, NoteEmbedType } from './types';
import PeopleNotesPlugin from './main';

export class PeopleNotesSettingTab extends PluginSettingTab {
	plugin: PeopleNotesPlugin;

	constructor(app: App, plugin: PeopleNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Header
		containerEl.createEl('h2', { text: 'People Notes Settings' });

		containerEl.createEl('p', {
			text: 'Configure how People Notes organizes and creates your person-related notes.'
		});

		// People Directory Path Setting
		new Setting(containerEl)
			.setName('People directory path')
			.setDesc('The directory where people subdirectories will be created')
			.addText(text => text
				.setPlaceholder('People')
				.setValue(this.plugin.settings.peopleDirectoryPath)
				.onChange(async (value) => {
					this.plugin.settings.peopleDirectoryPath = value.trim() || 'People';
					await this.plugin.saveSettings();
				}));

		// Table of Contents Path Setting
		new Setting(containerEl)
			.setName('Table of Contents path')
			.setDesc('The path to the file that will contain the table of contents for all people notes')
			.addText(text => text
				.setPlaceholder('People/Table of Contents.md')
				.setValue(this.plugin.settings.tableOfContentsPath)
				.onChange(async (value) => {
					this.plugin.settings.tableOfContentsPath = value.trim() || 'People/Table of Contents.md';
					await this.plugin.saveSettings();
				}));

		// Embedding Format Setting
		new Setting(containerEl)
			.setName('Note link format')
			.setDesc('Choose how note links are formatted when embedded in other notes')
			.addDropdown(dropdown => dropdown
				.addOption('wikilink', 'Wikilink ([[Note Name]])')
				.addOption('markdown-link', 'Markdown Link ([Note Name](path))')
				.setValue(this.plugin.settings.embeddingFormat)
				.onChange(async (value: string) => {
					this.plugin.settings.embeddingFormat = value as EmbeddingFormat;
					await this.plugin.saveSettings();
				}));

		// Note Embed Type Setting
		new Setting(containerEl)
			.setName('Note embedding style')
			.setDesc('Choose whether to link to notes or embed them inline. Embedding shows note content directly in the current note.')
			.addDropdown(dropdown => dropdown
				.addOption('link', 'Link ([[Note Name]]) - References the note')
				.addOption('embed', 'Embed (![[Note Name]]) - Shows note content inline')
				.setValue(this.plugin.settings.noteEmbedType)
				.onChange(async (value: string) => {
					this.plugin.settings.noteEmbedType = value as NoteEmbedType;
					await this.plugin.saveSettings();
				}));

		// Timestamp Format Setting
		new Setting(containerEl)
			.setName('Timestamp format')
			.setDesc('Choose the timestamp format for note filenames')
			.addDropdown(dropdown => dropdown
				.addOption('iso-with-seconds', 'With seconds (YYYY-MM-DD--HH-mm-ss)')
				.addOption('iso-without-seconds', 'Without seconds (YYYY-MM-DD--HH-mm)')
				.setValue(this.plugin.settings.timestampFormat)
				.onChange(async (value: string) => {
					this.plugin.settings.timestampFormat = value as TimestampFormat;
					await this.plugin.saveSettings();
				}));

		// Divider
		containerEl.createEl('hr');

		// Usage Instructions
		const instructionsContainer = containerEl.createEl('div');
		instructionsContainer.createEl('h3', { text: 'How to Use' });

		const usageList = instructionsContainer.createEl('ol');
		
		usageList.createEl('li').innerHTML = 
			'Use <strong>Ctrl/Cmd + Shift + P</strong> and search for "Create People Note" or click the ribbon icon';
		
		usageList.createEl('li').innerHTML = 
			'Type a person\'s name in the fuzzy search modal';
		
		usageList.createEl('li').innerHTML = 
			'Select an existing person or create a new one';
		
		usageList.createEl('li').innerHTML = 
			'The note will be created with a timestamp and automatically embedded in your current note and table of contents';

		// Available Commands
		const commandsContainer = containerEl.createEl('div');
		commandsContainer.createEl('h3', { text: 'Available Commands' });

		const commandsList = commandsContainer.createEl('ul');
		
		commandsList.createEl('li').innerHTML = 
			'<strong>Create People Note</strong> - Opens the person selector modal';
		
		commandsList.createEl('li').innerHTML = 
			'<strong>Open People Directory</strong> - Navigates to the people directory';
		
		commandsList.createEl('li').innerHTML = 
			'<strong>Open People Notes Table of Contents</strong> - Opens the TOC file';

		// File Structure Example
		const structureContainer = containerEl.createEl('div');
		structureContainer.createEl('h3', { text: 'File Structure' });

		const exampleContainer = structureContainer.createEl('pre');
		exampleContainer.style.backgroundColor = 'var(--background-secondary)';
		exampleContainer.style.padding = '12px';
		exampleContainer.style.borderRadius = '4px';
		exampleContainer.style.fontFamily = 'var(--font-monospace)';
		exampleContainer.style.fontSize = '12px';
		
		exampleContainer.textContent = `${this.plugin.settings.peopleDirectoryPath}/
├── Table of Contents.md
├── John Doe/
│   ├── John Doe 2025-09-11--10-18-48.md
│   └── John Doe 2025-09-12--14-30-15.md
└── Jane Smith/
    └── Jane Smith 2025-09-11--16-45-22.md`;

		// Reset to Defaults Button
		new Setting(containerEl)
			.setName('Reset to defaults')
			.setDesc('Reset all settings to their default values')
			.addButton(button => button
				.setButtonText('Reset')
				.setWarning()
				.onClick(async () => {
					this.plugin.settings = { ...this.plugin.settings, ...{
						peopleDirectoryPath: 'People',
						tableOfContentsPath: 'People/Table of Contents.md',
						embeddingFormat: 'wikilink' as EmbeddingFormat,
						timestampFormat: 'iso-with-seconds' as TimestampFormat,
						noteEmbedType: 'link' as NoteEmbedType
					}};
					await this.plugin.saveSettings();
					this.display(); // Refresh the settings display
				}));
	}
}