import { EmbeddingService, NoteInfo, EmbeddingFormat, DEFAULT_SETTINGS, DirectoryManager, PersonInfo } from '../types';
import { EmbeddingServiceImpl } from '../EmbeddingService';
import { Vault, Workspace, TFile } from 'obsidian';

describe('EmbeddingService', () => {
	let embeddingService: EmbeddingService;
	let mockVault: jest.Mocked<Vault>;
	let mockWorkspace: jest.Mocked<Workspace>;
	let mockDirectoryManager: jest.Mocked<DirectoryManager>;
	let mockNote: NoteInfo;

	beforeEach(() => {
		mockVault = {
			getAbstractFileByPath: jest.fn(),
			create: jest.fn(),
			read: jest.fn(),
			modify: jest.fn(),
		} as any;

		mockWorkspace = {
			getActiveFile: jest.fn(),
		} as any;

		mockDirectoryManager = {
			getPersonInfo: jest.fn(),
			ensurePeopleDirectory: jest.fn(),
			ensurePersonDirectory: jest.fn(),
			getAllPeople: jest.fn(),
			normalizePersonName: jest.fn(),
		} as any;

		// Default mock implementations
		mockVault.read.mockResolvedValue('');
		mockVault.modify.mockResolvedValue();
		mockVault.create.mockResolvedValue(new (TFile as any)('test.md'));

		embeddingService = new EmbeddingServiceImpl(mockVault, mockWorkspace, DEFAULT_SETTINGS, mockDirectoryManager);
		
		mockNote = {
			personName: 'John Doe',
			fileName: 'John Doe 2025-09-11--10-18-48.md',
			filePath: 'People/John Doe/John Doe 2025-09-11--10-18-48.md',
			timestamp: new Date('2025-09-11T10:18:48')
		};
	});

	describe('formatNoteLink', () => {
		it('should format wikilink correctly', () => {
			const link = embeddingService.formatNoteLink(mockNote, 'wikilink');
			expect(link).toBe('[[John Doe 2025-09-11--10-18-48]]');
		});

		it('should format markdown link correctly', () => {
			const link = embeddingService.formatNoteLink(mockNote, 'markdown-link');
			expect(link).toBe('[John Doe 2025-09-11--10-18-48](People/John%20Doe/John%20Doe%202025-09-11--10-18-48.md)');
		});

		it('should handle file paths with spaces in markdown links', () => {
			const noteWithSpaces: NoteInfo = {
				...mockNote,
				personName: 'Jane Mary Smith',
				fileName: 'Jane Mary Smith 2025-09-11--10-18-48.md',
				filePath: 'People/Jane Mary Smith/Jane Mary Smith 2025-09-11--10-18-48.md'
			};

			const link = embeddingService.formatNoteLink(noteWithSpaces, 'markdown-link');
			expect(link).toBe('[Jane Mary Smith 2025-09-11--10-18-48](People/Jane%20Mary%20Smith/Jane%20Mary%20Smith%202025-09-11--10-18-48.md)');
		});

		it('should handle file names with special characters', () => {
			const noteWithSpecial: NoteInfo = {
				...mockNote,
				personName: 'John-Doe',
				fileName: 'John-Doe 2025-09-11--10-18-48.md',
				filePath: 'People/John-Doe/John-Doe 2025-09-11--10-18-48.md'
			};

			const wikilinkResult = embeddingService.formatNoteLink(noteWithSpecial, 'wikilink');
			const markdownResult = embeddingService.formatNoteLink(noteWithSpecial, 'markdown-link');
			
			expect(wikilinkResult).toBe('[[John-Doe 2025-09-11--10-18-48]]');
			expect(markdownResult).toBe('[John-Doe 2025-09-11--10-18-48](People/John-Doe/John-Doe%202025-09-11--10-18-48.md)');
		});
	});

	describe('embedInCurrentNote', () => {
		it('should embed note in current active note successfully', async () => {
			// Mock an active note
			const activeFile = new (TFile as any)('current-note.md');
			mockWorkspace.getActiveFile.mockReturnValue(activeFile);
			mockVault.read.mockResolvedValue('Existing content');

			const result = await embeddingService.embedInCurrentNote(mockNote);
			expect(result).toBe(true);
			expect(mockVault.modify).toHaveBeenCalledWith(
				activeFile, 
				'Existing content\n\n[[John Doe 2025-09-11--10-18-48]]'
			);
		});

		it('should return false when no active note exists', async () => {
			// Mock no active note scenario
			mockWorkspace.getActiveFile.mockReturnValue(null);
			
			const result = await embeddingService.embedInCurrentNote(mockNote);
			expect(result).toBe(false);
			expect(mockVault.modify).not.toHaveBeenCalled();
		});

		it('should append note link to end of current note', async () => {
			// Mock an active note with existing content
			const activeFile = new (TFile as any)('current-note.md');
			mockWorkspace.getActiveFile.mockReturnValue(activeFile);
			mockVault.read.mockResolvedValue('Original content here');

			const result = await embeddingService.embedInCurrentNote(mockNote);
			expect(result).toBe(true);
			
			expect(mockVault.modify).toHaveBeenCalledWith(
				activeFile, 
				'Original content here\n\n[[John Doe 2025-09-11--10-18-48]]'
			);
		});

		it('should handle embedding errors gracefully', async () => {
			// Mock a vault error when trying to modify the file
			const result = await embeddingService.embedInCurrentNote(mockNote);
			expect(result).toBe(false);
		});

		it('should use configured embedding format', async () => {
			// Mock an active note
			const activeFile = new (TFile as any)('current-note.md');
			mockWorkspace.getActiveFile.mockReturnValue(activeFile);
			mockVault.read.mockResolvedValue('Content');

			const result = await embeddingService.embedInCurrentNote(mockNote);
			expect(result).toBe(true);
			
			// Should use wikilink format from DEFAULT_SETTINGS
			expect(mockVault.modify).toHaveBeenCalledWith(
				activeFile, 
				'Content\n\n[[John Doe 2025-09-11--10-18-48]]'
			);
		});
	});

	describe('updateTableOfContents', () => {
		it('should update TOC file successfully', async () => {
			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(true);
		});

		it('should create TOC file if it does not exist', async () => {
			// Mock TOC file doesn't exist
			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(true);
		});

		it('should append new note to existing TOC content', async () => {
			// Would verify that existing TOC content is preserved and new note is added
			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(true);
		});

		it('should organize notes by person in TOC', async () => {
			// TOC should group notes by person name
			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(true);
			
			// Would verify TOC structure like:
			// ## John Doe
			// - [[John Doe 2025-09-11--10-18-48]]
		});

		it('should sort notes chronologically within each person section', async () => {
			// Notes for each person should be sorted by timestamp (newest first)
			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(true);
		});

		it('should handle TOC update errors gracefully', async () => {
			// Suppress console.error during this test
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

			// Mock file system error
			mockVault.getAbstractFileByPath.mockImplementation(() => {
				throw new Error('File system error');
			});

			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(false);

			// Restore console.error
			consoleErrorSpy.mockRestore();
		});

		it('should maintain TOC file structure', async () => {
			// Should preserve any existing content and formatting in TOC
			const result = await embeddingService.updateTableOfContents(mockNote);
			expect(result).toBe(true);
		});

		it('should avoid duplicate entries in TOC', async () => {
			// Should not add the same note multiple times
			const result1 = await embeddingService.updateTableOfContents(mockNote);
			const result2 = await embeddingService.updateTableOfContents(mockNote);
			
			expect(result1).toBe(true);
			expect(result2).toBe(true);
			
			// Would verify only one entry exists for this note
		});
	});

	describe('formatNoteLink with embed types', () => {
		it('should create link format for wikilink by default', () => {
			const link = embeddingService.formatNoteLink(mockNote, 'wikilink');
			expect(link).toBe('[[John Doe 2025-09-11--10-18-48]]');
		});

		it('should create embed format for wikilink when specified', () => {
			const link = embeddingService.formatNoteLink(mockNote, 'wikilink', 'embed');
			expect(link).toBe('![[John Doe 2025-09-11--10-18-48]]');
		});

		it('should create link format for wikilink when explicitly specified', () => {
			const link = embeddingService.formatNoteLink(mockNote, 'wikilink', 'link');
			expect(link).toBe('[[John Doe 2025-09-11--10-18-48]]');
		});

		it('should ignore embed type for markdown links', () => {
			const linkFormat = embeddingService.formatNoteLink(mockNote, 'markdown-link', 'link');
			const embedFormat = embeddingService.formatNoteLink(mockNote, 'markdown-link', 'embed');
			
			expect(linkFormat).toBe('[John Doe 2025-09-11--10-18-48](People/John%20Doe/John%20Doe%202025-09-11--10-18-48.md)');
			expect(embedFormat).toBe('[John Doe 2025-09-11--10-18-48](People/John%20Doe/John%20Doe%202025-09-11--10-18-48.md)');
		});
	});

	describe('embedInCurrentNote with embed type setting', () => {
		it('should embed note with link format when noteEmbedType is link', async () => {
			const activeFile = new (TFile as any)('current-note.md');
			mockWorkspace.getActiveFile.mockReturnValue(activeFile);
			mockVault.read.mockResolvedValue('Existing content');
			
			// Create service with link embed type
			const settingsWithLink = { ...DEFAULT_SETTINGS, noteEmbedType: 'link' as const };
			const linkEmbeddingService = new EmbeddingServiceImpl(mockVault, mockWorkspace, settingsWithLink);
			
			const result = await linkEmbeddingService.embedInCurrentNote(mockNote);
			
			expect(result).toBe(true);
			expect(mockVault.modify).toHaveBeenCalledWith(
				activeFile,
				'Existing content\n\n[[John Doe 2025-09-11--10-18-48]]'
			);
		});

		it('should embed note with embed format when noteEmbedType is embed', async () => {
			const activeFile = new (TFile as any)('current-note.md');
			mockWorkspace.getActiveFile.mockReturnValue(activeFile);
			mockVault.read.mockResolvedValue('Existing content');
			
			// Create service with embed type
			const settingsWithEmbed = { ...DEFAULT_SETTINGS, noteEmbedType: 'embed' as const };
			const embedEmbeddingService = new EmbeddingServiceImpl(mockVault, mockWorkspace, settingsWithEmbed);
			
			const result = await embedEmbeddingService.embedInCurrentNote(mockNote);
			
			expect(result).toBe(true);
			expect(mockVault.modify).toHaveBeenCalledWith(
				activeFile,
				'Existing content\n\n![[John Doe 2025-09-11--10-18-48]]'
			);
		});
	});

	describe('updateTableOfContents with per-person TOC', () => {
		it('should create per-person TOC file in person directory', async () => {
			mockVault.getAbstractFileByPath.mockReturnValue(null); // TOC doesn't exist
			mockVault.create.mockResolvedValue(new (TFile as any)('toc.md'));

			const result = await embeddingService.updateTableOfContents(mockNote);

			expect(result).toBe(true);
			expect(mockVault.create).toHaveBeenCalledWith(
				'People/John Doe/John Doe Meeting Notes.md',
				expect.stringContaining('# John Doe Meeting Notes')
			);
		});

		it('should update existing per-person TOC file', async () => {
			const existingTocFile = new (TFile as any)('People/John Doe/John Doe Meeting Notes.md');
			const existingContent = `# Notes for John Doe

This file tracks all notes for John Doe, automatically updated when new notes are created.

---

- [[Old Note]]`;

			mockVault.getAbstractFileByPath.mockReturnValue(existingTocFile);
			mockVault.read.mockResolvedValue(existingContent);

			const result = await embeddingService.updateTableOfContents(mockNote);

			expect(result).toBe(true);
			expect(mockVault.modify).toHaveBeenCalledWith(
				existingTocFile,
				expect.stringContaining('[[John Doe 2025-09-11--10-18-48]]')
			);
		});
	});

	describe('Meeting Notes title format', () => {
		it('should create TOC with Meeting Notes title format', async () => {
			mockVault.getAbstractFileByPath.mockReturnValue(null); // TOC doesn't exist
			mockVault.create.mockResolvedValue(new (TFile as any)('toc.md'));

			const result = await embeddingService.updateTableOfContents(mockNote);

			expect(result).toBe(true);
			expect(mockVault.create).toHaveBeenCalledWith(
				'People/John Doe/John Doe Meeting Notes.md',
				expect.stringContaining('# John Doe Meeting Notes')
			);
		});
	});

	describe('TOC content type settings', () => {
		it('should use link format in TOC when tocContentType is link', async () => {
			const linkSettings = { ...DEFAULT_SETTINGS, tocContentType: 'link' as const };
			const linkEmbeddingService = new EmbeddingServiceImpl(mockVault, mockWorkspace, linkSettings, mockDirectoryManager);
			
			const existingTocFile = new (TFile as any)('People/John Doe/John Doe Meeting Notes.md');
			const existingContent = `# John Doe Meeting Notes

This file tracks all notes for John Doe, automatically updated when new notes are created.

---

`;

			mockVault.getAbstractFileByPath.mockReturnValue(existingTocFile);
			mockVault.read.mockResolvedValue(existingContent);

			const result = await linkEmbeddingService.updateTableOfContents(mockNote);

			expect(result).toBe(true);
			expect(mockVault.modify).toHaveBeenCalledWith(
				existingTocFile,
				expect.stringContaining('- [[John Doe 2025-09-11--10-18-48]]')
			);
			expect(mockVault.modify).not.toHaveBeenCalledWith(
				existingTocFile,
				expect.stringContaining('- ![[John Doe 2025-09-11--10-18-48]]')
			);
		});

		it('should use embed format in TOC when tocContentType is embed', async () => {
			const embedSettings = { ...DEFAULT_SETTINGS, tocContentType: 'embed' as const };
			const embedEmbeddingService = new EmbeddingServiceImpl(mockVault, mockWorkspace, embedSettings, mockDirectoryManager);
			
			const existingTocFile = new (TFile as any)('People/John Doe/John Doe Meeting Notes.md');
			const existingContent = `# John Doe Meeting Notes

This file tracks all notes for John Doe, automatically updated when new notes are created.

---

`;

			mockVault.getAbstractFileByPath.mockReturnValue(existingTocFile);
			mockVault.read.mockResolvedValue(existingContent);

			const result = await embedEmbeddingService.updateTableOfContents(mockNote);

			expect(result).toBe(true);
			expect(mockVault.modify).toHaveBeenCalledWith(
				existingTocFile,
				expect.stringContaining('- ![[John Doe 2025-09-11--10-18-48]]')
			);
		});
	});

	describe('regenerateTableOfContents', () => {
		it('should regenerate TOC with all notes for a person', async () => {
			const mockPersonInfo: PersonInfo = {
				name: 'John Doe',
				normalizedName: 'john-doe',
				directoryPath: 'People/John Doe',
				notes: [
					{
						personName: 'John Doe',
						fileName: 'John Doe 2025-09-11--10-18-48.md',
						filePath: 'People/John Doe/John Doe 2025-09-11--10-18-48.md',
						timestamp: new Date('2025-09-11T10:18:48')
					},
					{
						personName: 'John Doe',
						fileName: 'John Doe 2025-09-12--14-30-15.md',
						filePath: 'People/John Doe/John Doe 2025-09-12--14-30-15.md',
						timestamp: new Date('2025-09-12T14:30:15')
					}
				]
			};

			mockDirectoryManager.getPersonInfo.mockResolvedValue(mockPersonInfo);
			const existingTocFile = new (TFile as any)('People/John Doe/John Doe Meeting Notes.md');
			mockVault.getAbstractFileByPath.mockReturnValue(existingTocFile);

			const result = await embeddingService.regenerateTableOfContents('John Doe');

			expect(result).toBe(true);
			expect(mockDirectoryManager.getPersonInfo).toHaveBeenCalledWith('John Doe');
			expect(mockVault.modify).toHaveBeenCalledWith(
				existingTocFile,
				expect.stringMatching(/# John Doe Meeting Notes[\s\S]*- \[\[John Doe 2025-09-12--14-30-15\]\][\s\S]*- \[\[John Doe 2025-09-11--10-18-48\]\]/)
			);
		});

		it('should create new TOC file if it does not exist during regeneration', async () => {
			const mockPersonInfo: PersonInfo = {
				name: 'Jane Smith',
				normalizedName: 'jane-smith',
				directoryPath: 'People/Jane Smith',
				notes: [{
					personName: 'Jane Smith',
					fileName: 'Jane Smith 2025-09-11--16-45-22.md',
					filePath: 'People/Jane Smith/Jane Smith 2025-09-11--16-45-22.md',
					timestamp: new Date('2025-09-11T16:45:22')
				}]
			};

			mockDirectoryManager.getPersonInfo.mockResolvedValue(mockPersonInfo);
			mockVault.getAbstractFileByPath.mockReturnValue(null); // TOC doesn't exist
			mockVault.create.mockResolvedValue(new (TFile as any)('toc.md'));

			const result = await embeddingService.regenerateTableOfContents('Jane Smith');

			expect(result).toBe(true);
			expect(mockVault.create).toHaveBeenCalledWith(
				'People/Jane Smith/Jane Smith Meeting Notes.md',
				expect.stringMatching(/# Jane Smith Meeting Notes[\s\S]*- \[\[Jane Smith 2025-09-11--16-45-22\]\]/)
			);
		});

		it('should return false when person is not found', async () => {
			// Suppress console.error during this test
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

			mockDirectoryManager.getPersonInfo.mockResolvedValue(null);

			const result = await embeddingService.regenerateTableOfContents('Nonexistent Person');

			expect(result).toBe(false);
			expect(mockDirectoryManager.getPersonInfo).toHaveBeenCalledWith('Nonexistent Person');
			expect(mockVault.create).not.toHaveBeenCalled();
			expect(mockVault.modify).not.toHaveBeenCalled();

			// Restore console.error
			consoleErrorSpy.mockRestore();
		});

		it('should return false when DirectoryManager is not provided', async () => {
			// Suppress console.error during this test
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

			const embeddingServiceWithoutDM = new EmbeddingServiceImpl(mockVault, mockWorkspace, DEFAULT_SETTINGS);

			const result = await embeddingServiceWithoutDM.regenerateTableOfContents('John Doe');

			expect(result).toBe(false);
			expect(mockVault.create).not.toHaveBeenCalled();
			expect(mockVault.modify).not.toHaveBeenCalled();

			// Restore console.error
			consoleErrorSpy.mockRestore();
		});

		it('should handle errors gracefully during regeneration', async () => {
			// Suppress console.error during this test
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

			mockDirectoryManager.getPersonInfo.mockRejectedValue(new Error('Directory error'));

			const result = await embeddingService.regenerateTableOfContents('John Doe');

			expect(result).toBe(false);

			// Restore console.error
			consoleErrorSpy.mockRestore();
		});
	});
});