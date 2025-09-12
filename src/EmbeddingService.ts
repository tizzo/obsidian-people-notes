import { Vault, Workspace, TFile } from 'obsidian';
import { EmbeddingService, NoteInfo, EmbeddingFormat, NoteEmbedType, PeopleNotesSettings } from './types';

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
			const noteLink = this.formatNoteLink(note, this.settings.embeddingFormat, this.settings.noteEmbedType);
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
			// Construct path to person's TOC file
			const personDirectory = note.filePath.substring(0, note.filePath.lastIndexOf('/'));
			const tocPath = `${personDirectory}/${this.settings.tableOfContentsFileName}`;
			let tocFile = this.vault.getAbstractFileByPath(tocPath) as TFile;
			let tocContent = '';

			// Create TOC file if it doesn't exist
			if (tocFile == null) {
				tocContent = this.createInitialTocContent(note.personName);
				tocFile = await this.vault.create(tocPath, tocContent);
			} else {
				tocContent = await this.vault.read(tocFile);
			}

			// Add the note to the TOC
			const updatedContent = this.updatePersonTocWithNote(tocContent, note);

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

	formatNoteLink(note: NoteInfo, format: EmbeddingFormat, embedType: NoteEmbedType = 'link'): string {
		const baseName = note.fileName.replace(/\.md$/, '');
		
		// Determine the prefix based on embed type (only applies to wikilinks)
		const embedPrefix = (embedType === 'embed' && format === 'wikilink') ? '!' : '';

		switch (format) {
			case 'wikilink': {
				return `${embedPrefix}[[${baseName}]]`;
			}
			
			case 'markdown-link': {
				// Markdown links don't support embedding with ! syntax, so embedType is ignored
				const encodedPath = note.filePath.replace(/ /g, '%20');
				return `[${baseName}](${encodedPath})`;
			}
			
			default: {
				return `${embedPrefix}[[${baseName}]]`;
			}
		}
	}

	private createInitialTocContent(personName: string): string {
		return `# Notes for ${personName}

This file tracks all notes for ${personName}, automatically updated when new notes are created.

---

`;
	}

	private updatePersonTocWithNote(tocContent: string, note: NoteInfo): string {
		const lines = tocContent.split('\n');
		const noteLink = this.formatNoteLink(note, this.settings.embeddingFormat, 'link'); // TOC always uses links, not embeds
		const noteEntry = `- ${noteLink}`;

		// Check if note already exists in TOC to avoid duplicates
		if (tocContent.includes(noteLink)) {
			return tocContent;
		}

		// Find where to insert the note (after the header and divider)
		let insertIndex = lines.length;
		
		// Look for the end of the header section (after "---")
		for (let i = 0; i < lines.length; i++) {
			if (lines[i]?.trim() === '---') {
				insertIndex = i + 2; // Insert after the divider and empty line
				break;
			}
		}

		// Find where to insert (maintain chronological order - newest first)
		for (let i = insertIndex; i < lines.length; i++) {
			const line = lines[i]?.trim();
			
			if (line?.startsWith('-') === true) {
				// Compare timestamps if possible
				if (this.shouldInsertBefore(noteEntry, line, note)) {
					insertIndex = i;
					break;
				}
				insertIndex = i + 1;
			} else if (line !== '') {
				// Stop at any non-empty, non-list line
				break;
			}
		}

		lines.splice(insertIndex, 0, noteEntry);
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