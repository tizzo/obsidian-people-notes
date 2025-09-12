import { Vault, Workspace, TFile } from 'obsidian';
import { EmbeddingService, NoteInfo, EmbeddingFormat, PeopleNotesSettings } from './types';

export class EmbeddingServiceImpl implements EmbeddingService {
	constructor(
		private readonly vault: Vault,
		private readonly workspace: Workspace,
		private readonly settings: PeopleNotesSettings
	) {}

	async embedInCurrentNote(note: NoteInfo): Promise<boolean> {
		try {
			const activeFile = this.workspace.getActiveFile();
			if (activeFile == null) {
				return false;
			}

			const currentContent = await this.vault.read(activeFile);
			const noteLink = this.formatNoteLink(note, this.settings.embeddingFormat);
			const newContent = currentContent + '\n\n' + noteLink;

			await this.vault.modify(activeFile, newContent);
			return true;

		} catch (error) {
			console.error('Failed to embed note in current file:', error);
			return false;
		}
	}

	async updateTableOfContents(note: NoteInfo): Promise<boolean> {
		try {
			const tocPath = this.settings.tableOfContentsPath;
			let tocFile = this.vault.getAbstractFileByPath(tocPath) as TFile;
			let tocContent = '';

			// Create TOC file if it doesn't exist
			if (tocFile == null) {
				tocContent = this.createInitialTocContent();
				tocFile = await this.vault.create(tocPath, tocContent);
			} else {
				tocContent = await this.vault.read(tocFile);
			}

			// Parse existing TOC to find or create person section
			const updatedContent = this.updateTocWithNote(tocContent, note);

			// Only modify if content changed
			if (updatedContent !== tocContent) {
				await this.vault.modify(tocFile, updatedContent);
			}

			return true;

		} catch (error) {
			console.error('Failed to update table of contents:', error);
			return false;
		}
	}

	formatNoteLink(note: NoteInfo, format: EmbeddingFormat): string {
		const baseName = note.fileName.replace(/\.md$/, '');

		switch (format) {
			case 'wikilink': {
				return `[[${baseName}]]`;
			}
			
			case 'markdown-link': {
				const encodedPath = note.filePath.replace(/ /g, '%20');
				return `[${baseName}](${encodedPath})`;
			}
			
			default: {
				return `[[${baseName}]]`;
			}
		}
	}

	private createInitialTocContent(): string {
		return `# People Notes - Table of Contents

This file automatically tracks all notes created for different people.

---

`;
	}

	private updateTocWithNote(tocContent: string, note: NoteInfo): string {
		const lines = tocContent.split('\n');
		const personSectionHeader = `## ${note.personName}`;
		const noteLink = this.formatNoteLink(note, this.settings.embeddingFormat);
		const noteEntry = `- ${noteLink}`;

		// Check if note already exists in TOC to avoid duplicates
		if (tocContent.includes(noteLink)) {
			return tocContent;
		}

		// Find existing person section
		let personSectionIndex = -1;
		for (let i = 0; i < lines.length; i++) {
			if (lines[i] === personSectionHeader) {
				personSectionIndex = i;
				break;
			}
		}

		if (personSectionIndex !== -1) {
			// Person section exists, add note to it
			const notesStartIndex = personSectionIndex + 1;
			
			// Find where to insert (maintain chronological order - newest first)
			let insertIndex = notesStartIndex;
			for (let i = notesStartIndex; i < lines.length; i++) {
				const line = lines[i]?.trim();
				
				// Stop at next person section or end of notes
				if (line?.startsWith('##') === true || (line?.startsWith('-') !== true && line !== '')) {
					break;
				}
				
				if (line?.startsWith('-') === true) {
					// Compare timestamps if possible
					if (this.shouldInsertBefore(noteEntry, line, note)) {
						break;
					}
					insertIndex = i + 1;
				}
			}
			
			lines.splice(insertIndex, 0, noteEntry);

		} else {
			// Person section doesn't exist, create it
			// Find where to insert person section (alphabetically)
			let insertSectionIndex = lines.length;
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]?.trim();
				if (line?.startsWith('## ') === true) {
					const existingPersonName = line.substring(3);
					if (note.personName.localeCompare(existingPersonName) < 0) {
						insertSectionIndex = i;
						break;
					}
				}
			}

			// Insert person section with note
			const personSection = [
				'',
				personSectionHeader,
				noteEntry,
				''
			];

			lines.splice(insertSectionIndex, 0, ...personSection);
		}

		return lines.join('\n');
	}

	private shouldInsertBefore(newNoteEntry: string, existingNoteEntry: string, newNote: NoteInfo): boolean {
		// Try to extract timestamp from existing note entry to maintain chronological order
		// This is a simplified approach - in a real implementation, you might want more sophisticated parsing
		const newTimestamp = newNote.timestamp.getTime();
		
		// Extract timestamp from note filename if possible
		const timestampMatch = existingNoteEntry.match(/(\d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2})/);
		if (timestampMatch?.[1] != null && timestampMatch[1] !== '') {
			const parts = timestampMatch[1].split('--');
			if (parts.length === 2) {
				const [datePart, timePart] = parts;
				const dateComponents = datePart?.split('-').map(Number);
				const timeComponents = timePart?.split('-').map(Number);
				
				if (dateComponents && dateComponents.length === 3 && timeComponents && timeComponents.length === 3) {
					const [year, month, day] = dateComponents;
					const [hour, minute, second] = timeComponents;
					const existingTimestamp = new Date(
						year ?? 0, 
						(month ?? 1) - 1, 
						day ?? 1, 
						hour ?? 0, 
						minute ?? 0, 
						second ?? 0
					).getTime();
					
					return newTimestamp > existingTimestamp; // Newer notes first
				}
			}
		}

		// If can't parse timestamp, insert at beginning (assuming it's newer)
		return true;
	}
}