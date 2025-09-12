import { Vault, TFile, TFolder } from 'obsidian';
import { DirectoryManager, PersonInfo, NoteInfo } from './types';

export class DirectoryManagerImpl implements DirectoryManager {
	constructor(
		private readonly vault: Vault,
		private readonly peopleDirectoryPath: string
	) {}

	normalizePersonName(name: string): string {
		return name
			.trim()
			.replace(/[/\\:*?"<>|]/g, '-') // Replace invalid filesystem characters with hyphens
			.replace(/\s+/g, ' ') // Normalize multiple spaces to single spaces
			.replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
	}

	async ensurePeopleDirectory(): Promise<TFolder> {
		const existingFolder = this.vault.getAbstractFileByPath(this.peopleDirectoryPath);
		
		if (existingFolder instanceof TFolder) {
			return existingFolder;
		}
		
		return await this.vault.createFolder(this.peopleDirectoryPath);
	}

	async ensurePersonDirectory(personName: string): Promise<TFolder> {
		const normalizedName = this.normalizePersonName(personName);
		const personPath = `${this.peopleDirectoryPath}/${normalizedName}`;
		
		// Ensure the people directory exists first
		await this.ensurePeopleDirectory();
		
		const existingFolder = this.vault.getAbstractFileByPath(personPath);
		
		if (existingFolder instanceof TFolder) {
			return existingFolder;
		}
		
		return await this.vault.createFolder(personPath);
	}

	async getPersonInfo(personName: string): Promise<PersonInfo | null> {
		const normalizedName = this.normalizePersonName(personName);
		const personPath = `${this.peopleDirectoryPath}/${normalizedName}`;
		
		const personFolder = this.vault.getFolderByPath(personPath);
		
		if (!personFolder) {
			return null;
		}

		const notes = await this.getNotesInFolder(personFolder, personName);
		
		return {
			name: personName,
			normalizedName,
			directoryPath: personPath,
			notes
		};
	}

	async getAllPeople(): Promise<readonly PersonInfo[]> {
		const peopleFolder = this.vault.getFolderByPath(this.peopleDirectoryPath);
		
		if (!peopleFolder) {
			return [];
		}

		const people: PersonInfo[] = [];
		
		for (const child of peopleFolder.children) {
			if (child instanceof TFolder) {
				const notes = await this.getNotesInFolder(child, child.name);
				
				people.push({
					name: child.name, // Use the actual folder name as the person name
					normalizedName: child.name,
					directoryPath: child.path,
					notes
				});
			}
		}
		
		return people;
	}

	private async getNotesInFolder(folder: TFolder, personName: string): Promise<readonly NoteInfo[]> {
		const notes: NoteInfo[] = [];
		
		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === 'md') {
				const noteInfo = this.parseNoteInfo(child, personName);
				if (noteInfo) {
					notes.push(noteInfo);
				}
			}
		}
		
		// Sort notes by timestamp (newest first)
		return notes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
	}

	private parseNoteInfo(file: TFile, personName: string): NoteInfo | null {
		// Expected format: "{PersonName} YYYY-MM-DD--HH-mm-ss.md"
		const timestampRegex = /(\d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2})\.md$/;
		const match = file.name.match(timestampRegex);
		
		if (!match) {
			// If filename doesn't match expected format, use file modification time
			return {
				personName,
				fileName: file.name,
				filePath: file.path,
				timestamp: new Date(file.stat.mtime),
				file
			};
		}
		
		const timestampStr = match[1];
		if (timestampStr == null || timestampStr === '') {
			return {
				personName,
				fileName: file.name,
				filePath: file.path,
				timestamp: new Date(file.stat.mtime),
				file
			};
		}
		
		const timestamp = this.parseTimestamp(timestampStr);
		
		return {
			personName,
			fileName: file.name,
			filePath: file.path,
			timestamp,
			file
		};
	}

	private parseTimestamp(timestampStr: string): Date {
		// Parse format: YYYY-MM-DD--HH-mm-ss
		const parts = timestampStr.split('--');
		if (parts.length !== 2) {
			return new Date(); // Fallback to current time
		}
		
		const [datePart, timePart] = parts;
		const dateComponents = datePart?.split('-').map(Number);
		const timeComponents = timePart?.split('-').map(Number);
		
		if (!dateComponents || dateComponents.length !== 3 || !timeComponents || timeComponents.length !== 3) {
			return new Date(); // Fallback to current time
		}
		
		const [year, month, day] = dateComponents;
		const [hour, minute, second] = timeComponents;
		
		return new Date(
			year ?? 0, 
			(month ?? 1) - 1, 
			day ?? 1, 
			hour ?? 0, 
			minute ?? 0, 
			second ?? 0
		);
	}
}