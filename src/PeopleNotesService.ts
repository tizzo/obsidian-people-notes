import { Vault } from 'obsidian';
import { PeopleNotesService, CreateNoteOptions, CreateNoteResult, NoteInfo, DirectoryManager, EmbeddingService, PeopleNotesSettings } from './types';

export class PeopleNotesServiceImpl implements PeopleNotesService {
	constructor(
		private readonly vault: Vault,
		private readonly directoryManager: DirectoryManager,
		private readonly embeddingService: EmbeddingService,
		private readonly settings: PeopleNotesSettings
	) {}

	async createNote(options: CreateNoteOptions): Promise<CreateNoteResult> {
		try {
			// Validate person name
			if (!options.personName.trim()) {
				return {
					success: false,
					error: 'Person name cannot be empty',
					embedded: false,
					tocUpdated: false
				};
			}

			// Generate the file name and path
			const timestamp = options.timestamp ?? new Date();
			const fileName = this.generateFileName(options.personName, timestamp);
			const normalizedPersonName = this.directoryManager.normalizePersonName(options.personName);
			const filePath = `${this.settings.peopleDirectoryPath}/${normalizedPersonName}/${fileName}`;

			// Ensure person directory exists
			await this.directoryManager.ensurePersonDirectory(options.personName);

			// Create the note file
			const noteContent = this.generateNoteContent(options.personName, timestamp);
			const file = await this.vault.create(filePath, noteContent);

			// Create NoteInfo object
			const noteInfo: NoteInfo = {
				personName: options.personName,
				fileName,
				filePath,
				timestamp,
				file
			};

			// Handle embedding and TOC updates
			let embedded = false;
			let tocUpdated = false;

			if (options.embedInCurrentNote !== false) { // Default to true if not specified
				embedded = await this.embeddingService.embedInCurrentNote(noteInfo);
			}

			if (options.updateTableOfContents !== false) { // Default to true if not specified
				tocUpdated = await this.embeddingService.updateTableOfContents(noteInfo);
			}

			return {
				success: true,
				note: noteInfo,
				embedded,
				tocUpdated
			};

		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred',
				embedded: false,
				tocUpdated: false
			};
		}
	}

	generateFileName(personName: string, timestamp?: Date): string {
		const normalizedName = this.directoryManager.normalizePersonName(personName);
		const ts = timestamp ?? new Date();
		const formattedTimestamp = this.formatTimestamp(ts);
		return `${normalizedName} ${formattedTimestamp}.md`;
	}

	formatTimestamp(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hour = String(date.getHours()).padStart(2, '0');
		const minute = String(date.getMinutes()).padStart(2, '0');
		const second = String(date.getSeconds()).padStart(2, '0');

		if (this.settings.timestampFormat === 'iso-without-seconds') {
			return `${year}-${month}-${day}--${hour}-${minute}`;
		}

		// Default: iso-with-seconds
		return `${year}-${month}-${day}--${hour}-${minute}-${second}`;
	}

	private generateNoteContent(personName: string, timestamp: Date): string {
		const formattedDate = timestamp.toLocaleDateString();
		const formattedTime = timestamp.toLocaleTimeString();

		return `*Created: ${formattedDate} at ${formattedTime}*

- `;
	}
}