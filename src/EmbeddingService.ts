import { Vault, Workspace, TFile } from 'obsidian';
import { EmbeddingService, NoteInfo, EmbeddingFormat, NoteEmbedType, PeopleNotesSettings, DirectoryManager } from './types';

export class EmbeddingServiceImpl implements EmbeddingService {
	constructor(
		private readonly vault: Vault,
		private readonly workspace: Workspace,
		private readonly settings: PeopleNotesSettings,
		private readonly directoryManager?: DirectoryManager
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
			const tocFileName = this.generateTocFileName(note.personName);
			const tocPath = `${personDirectory}/${tocFileName}`;
			
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
		return `# ${personName} Meeting Notes

This file tracks all notes for ${personName}, automatically updated when new notes are created.

---

`;
	}

	private updatePersonTocWithNote(tocContent: string, note: NoteInfo): string {
		const noteLink = this.formatNoteLink(note, this.settings.embeddingFormat, this.settings.tocContentType);
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

	private generateTocFileName(personName: string): string {
		return this.settings.tableOfContentsFileName.replace('{name}', personName);
	}

	async regenerateTableOfContents(personName: string): Promise<boolean> {
		try {
			if (!this.directoryManager) {
				console.error('DirectoryManager is required for TOC regeneration');
				return false;
			}

			// Get all notes for this person
			const personInfo = await this.directoryManager.getPersonInfo(personName);
			if (!personInfo) {
				console.error(`Person not found: ${personName}`);
				return false;
			}

			// Construct path to person's TOC file
			const tocFileName = this.generateTocFileName(personName);
			const tocPath = `${personInfo.directoryPath}/${tocFileName}`;
			
			// Create fresh TOC content
			const tocContent = this.createInitialTocContent(personName);
			
			// Add all notes to the TOC
			let updatedContent = tocContent;
			for (const note of personInfo.notes) {
				updatedContent = this.updatePersonTocWithNote(updatedContent, note);
			}

			// Create or update the TOC file
			let tocFile = this.vault.getAbstractFileByPath(tocPath) as TFile;
			if (tocFile == null) {
				tocFile = await this.vault.create(tocPath, updatedContent);
			} else {
				await this.vault.modify(tocFile, updatedContent);
			}

			return true;
		} catch (error) {
			console.error('Failed to regenerate table of contents:', error);
			return false;
		}
	}

}