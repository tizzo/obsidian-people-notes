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
		const noteLink = this.formatNoteLink(note, this.settings.embeddingFormat, 'link'); // TOC always uses links, not embeds
		const noteEntry = `- ${noteLink}`;

		// Check if note already exists in TOC to avoid duplicates
		if (tocContent.includes(noteLink)) {
			return tocContent;
		}

		const lines = tocContent.split('\n');
		let insertIndex = -1;
		
		// Find the line after "---" to insert the note
		for (let i = 0; i < lines.length; i++) {
			if (lines[i]?.trim() === '---') {
				// Insert after the divider line
				insertIndex = i + 1;
				
				// Skip any empty lines after the divider
				while (insertIndex < lines.length && lines[insertIndex]?.trim() === '') {
					insertIndex++;
				}
				break;
			}
		}

		// If we couldn't find the divider, append at the end
		if (insertIndex === -1) {
			insertIndex = lines.length;
		}

		// Insert the new note at the beginning of the list (newest first)
		lines.splice(insertIndex, 0, noteEntry);
		return lines.join('\n');
	}

}