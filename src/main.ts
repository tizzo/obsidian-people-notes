import { Plugin, TFile, Notice } from 'obsidian';
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
			this.settings.peopleDirectoryPath
		);

		this.embeddingService = new EmbeddingServiceImpl(
			this.app.vault,
			this.app.workspace,
			this.settings
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

		// Command to open table of contents
		this.addCommand({
			id: 'open-table-of-contents',
			name: 'Open People Notes Table of Contents',
			callback: async () => {
				const tocFile = this.app.vault.getAbstractFileByPath(this.settings.tableOfContentsPath) as TFile;
				if (tocFile != null) {
					this.app.workspace.getLeaf().openFile(tocFile);
				} else {
					// Create TOC file if it doesn't exist
					const dummyNote = {
						personName: 'Example',
						fileName: 'example.md',
						filePath: 'example.md',
						timestamp: new Date()
					};
					await this.embeddingService.updateTableOfContents(dummyNote);

					const newTocFile = this.app.vault.getAbstractFileByPath(this.settings.tableOfContentsPath) as TFile;
					if (newTocFile != null) {
						this.app.workspace.getLeaf().openFile(newTocFile);
					}
				}
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
					await this.app.workspace.getLeaf().openFile(result.note.file);
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