import { Plugin, Notice } from 'obsidian';
import { PeopleNotesSettings, DEFAULT_SETTINGS, PersonInfo } from './types';
import { DirectoryManagerImpl } from './DirectoryManager';
import { PeopleNotesServiceImpl } from './PeopleNotesService';
import { FuzzySearchServiceImpl } from './FuzzySearchService';
import { EmbeddingServiceImpl } from './EmbeddingService';
import { PersonSelectorModal } from './PersonSelectorModal';
import { PeopleNotesSettingTab } from './SettingsTab';

export default class PeopleNotesPlugin extends Plugin {
	settings: PeopleNotesSettings = DEFAULT_SETTINGS;

	// Services
	private directoryManager!: DirectoryManagerImpl;
	private peopleNotesService!: PeopleNotesServiceImpl;
	private fuzzySearchService!: FuzzySearchServiceImpl;
	private embeddingService!: EmbeddingServiceImpl;

	override async onload(): Promise<void> {
		console.log('Loading People Notes plugin');

		// Load settings
		await this.loadSettings();

		// Initialize services
		this.initializeServices();

		// Add commands
		this.addCommands();

		// Add settings tab
		this.addSettingTab(new PeopleNotesSettingTab(this.app, this));

		// Add ribbon icon
		this.addRibbonIcon('user-plus', 'Create People Note', () => {
			this.showPersonSelector();
		});
	}

	override onunload(): void {
		console.log('Unloading People Notes plugin');
	}

	private initializeServices(): void {
		this.directoryManager = new DirectoryManagerImpl(
			this.app.vault,
			this.settings.peopleDirectoryPath,
			this.settings
		);

		this.embeddingService = new EmbeddingServiceImpl(
			this.app.vault,
			this.app.workspace,
			this.settings,
			this.directoryManager
		);

		this.peopleNotesService = new PeopleNotesServiceImpl(
			this.app.vault,
			this.directoryManager,
			this.embeddingService,
			this.settings
		);

		this.fuzzySearchService = new FuzzySearchServiceImpl(
			this.directoryManager
		);
	}

	private addCommands(): void {
		// Main command to create a people note
		this.addCommand({
			id: 'create-people-note',
			name: 'Create People Note',
			hotkeys: [
				{
					modifiers: ['Mod', 'Shift'],
					key: 'u'
				}
			],
			callback: () => {
				this.showPersonSelector();
			}
		});

		// Command to open people directory
		this.addCommand({
			id: 'open-people-directory',
			name: 'Open People Directory',
			callback: async () => {
				await this.directoryManager.ensurePeopleDirectory();
				// Focus on the people directory in file explorer
				const peopleFolder = this.app.vault.getFolderByPath(this.settings.peopleDirectoryPath);
				if (peopleFolder) {
					this.app.workspace.getLeaf().setViewState({
						type: 'file-explorer',
						state: { folder: peopleFolder }



					});
				}
			}
		});

		// Command to regenerate TOC for a selected person
		this.addCommand({
			id: 'regenerate-person-toc',
			name: 'Regenerate Person TOC',
			callback: () => {
				this.showPersonSelectorForTocRegeneration();
			}
		});

	}

	private showPersonSelector(): void {
		const modal = new PersonSelectorModal(
			this.app,
			this.fuzzySearchService,
			(person: PersonInfo, isNewPerson: boolean) => {
				this.createNoteForPerson(person, isNewPerson);
			}
		);
		modal.open();
	}

	private showPersonSelectorForTocRegeneration(): void {
		const modal = new PersonSelectorModal(
			this.app,
			this.fuzzySearchService,
			(person: PersonInfo, isNewPerson: boolean) => {
				this.regenerateTocForPerson(person, isNewPerson);
			}
		);
		modal.open();
	}

	private async createNoteForPerson(person: PersonInfo, isNewPerson: boolean): Promise<void> {
		try {
			const result = await this.peopleNotesService.createNote({
				personName: person.name,
				embedInCurrentNote: true,
				updateTableOfContents: true
			});

			if (result.success && result.note) {
				// Open the newly created note
				if (result.note.file) {
					const leaf = this.app.workspace.getLeaf();
					await leaf.openFile(result.note.file);
					
					// Position cursor at the end of the file
					// Use setTimeout to ensure the editor is fully loaded
					setTimeout(() => {
						const view = leaf.view;
						if (view != null && 'editor' in view) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const editor = (view as any).editor;
							if (editor != null) {
								const lastLine = editor.lastLine();
								const lastLineLength = editor.getLine(lastLine).length;
								editor.setCursor({ line: lastLine, ch: lastLineLength });
							}
						}
					}, 50);
				}

				// Show success notification
				const action = isNewPerson ? 'created' : 'added';
				const message = `${action.charAt(0).toUpperCase() + action.slice(1)} note for ${person.name}`;

				if (result.embedded && result.tocUpdated) {
					this.showNotice(`${message} and updated references`);
				} else if (result.embedded) {
					this.showNotice(`${message} and embedded in current note`);
				} else if (result.tocUpdated) {
					this.showNotice(`${message} and updated table of contents`);
				} else {
					this.showNotice(message);
				}

			} else {
				this.showNotice(`Failed to create note: ${result.error ?? 'Unknown error'}`, true);
			}

		} catch (error) {
			console.error('Error creating people note:', error);
			this.showNotice('Failed to create people note', true);
		}
	}

	private async regenerateTocForPerson(person: PersonInfo, isNewPerson: boolean): Promise<void> {
		if (isNewPerson) {
			this.showNotice('Cannot regenerate TOC for new person - create a note first', true);
			return;
		}

		try {
			const success = await this.embeddingService.regenerateTableOfContents(person.name);
			
			if (success) {
				this.showNotice(`Regenerated table of contents for ${person.name}`);
			} else {
				this.showNotice(`Failed to regenerate table of contents for ${person.name}`, true);
			}
		} catch (error) {
			console.error('Error regenerating TOC:', error);
			this.showNotice('Failed to regenerate table of contents', true);
		}
	}

	private showNotice(message: string, isError = false): void {
		// Create a notice with appropriate styling
		const notice = new Notice(message, isError ? 10000 : 5000);

		if (isError) {
			// Add error styling to notice
			notice.noticeEl.addClass('people-notes-error');
		}
	}

	async loadSettings(): Promise<void> {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);

		// Reinitialize services with new settings
		this.initializeServices();
	}
}