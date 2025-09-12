import { PeopleNotesService, CreateNoteOptions, CreateNoteResult, DEFAULT_SETTINGS, DirectoryManager, EmbeddingService } from '../types';
import { PeopleNotesServiceImpl } from '../PeopleNotesService';
import { Vault, TFile } from 'obsidian';

describe('PeopleNotesService', () => {
	let peopleNotesService: PeopleNotesService;
	let mockVault: jest.Mocked<Vault>;
	let mockDirectoryManager: jest.Mocked<DirectoryManager>;
	let mockEmbeddingService: jest.Mocked<EmbeddingService>;

	beforeEach(() => {
		mockVault = {
			create: jest.fn(),
		} as any;

		mockDirectoryManager = {
			normalizePersonName: jest.fn((name: string) => name.replace(/[/\\:*?"<>|]/g, '-').trim()),
			ensurePersonDirectory: jest.fn(),
		} as any;

		mockEmbeddingService = {
			embedInCurrentNote: jest.fn(),
			updateTableOfContents: jest.fn(),
		} as any;

		// Default mock implementations
		mockVault.create.mockResolvedValue(new (TFile as any)('test-path.md'));
		mockDirectoryManager.ensurePersonDirectory.mockResolvedValue({} as any);
		mockEmbeddingService.embedInCurrentNote.mockResolvedValue(true);
		mockEmbeddingService.updateTableOfContents.mockResolvedValue(true);

		peopleNotesService = new PeopleNotesServiceImpl(
			mockVault,
			mockDirectoryManager,
			mockEmbeddingService,
			DEFAULT_SETTINGS
		);
	});

	describe('generateFileName', () => {
		it('should generate filename with person name and timestamp', () => {
			const timestamp = new Date('2025-09-11T10:18:48');
			const fileName = peopleNotesService.generateFileName('John Doe', timestamp);
			expect(fileName).toBe('John Doe 2025-09-11--10-18-48.md');
		});

		it('should use current time when no timestamp provided', () => {
			const fileName = peopleNotesService.generateFileName('John Doe');
			expect(fileName).toMatch(/^John Doe \d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2}\.md$/);
		});

		it('should handle names with special characters', () => {
			const timestamp = new Date('2025-09-11T10:18:48');
			const fileName = peopleNotesService.generateFileName('John/Doe\\Test', timestamp);
			// Should normalize the name in the filename
			expect(fileName).toBe('John-Doe-Test 2025-09-11--10-18-48.md');
		});
	});

	describe('formatTimestamp', () => {
		it('should format timestamp in ISO format with seconds', () => {
			const timestamp = new Date('2025-09-11T10:18:48');
			const formatted = peopleNotesService.formatTimestamp(timestamp);
			expect(formatted).toBe('2025-09-11--10-18-48');
		});

		it('should pad single digits with zeros', () => {
			const timestamp = new Date('2025-01-05T09:08:07');
			const formatted = peopleNotesService.formatTimestamp(timestamp);
			expect(formatted).toBe('2025-01-05--09-08-07');
		});
	});

	describe('createNote', () => {
		it('should create a new note successfully', async () => {
			const options: CreateNoteOptions = {
				personName: 'John Doe',
				timestamp: new Date('2025-09-11T10:18:48'),
				embedInCurrentNote: true,
				updateTableOfContents: true
			};

			const result = await peopleNotesService.createNote(options);

			expect(result.success).toBe(true);
			expect(result.note).toBeDefined();
			expect(result.note?.personName).toBe('John Doe');
			expect(result.note?.fileName).toBe('John Doe 2025-09-11--10-18-48.md');
			expect(result.note?.filePath).toBe('People/John Doe/John Doe 2025-09-11--10-18-48.md');
			expect(result.embedded).toBe(true);
			expect(result.tocUpdated).toBe(true);
		});

		it('should use current timestamp when none provided', async () => {
			const options: CreateNoteOptions = {
				personName: 'Jane Smith'
			};

			const result = await peopleNotesService.createNote(options);

			expect(result.success).toBe(true);
			expect(result.note?.fileName).toMatch(/^Jane Smith \d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2}\.md$/);
		});

		it('should handle note creation failure', async () => {
			// Mock a failure scenario
			const options: CreateNoteOptions = {
				personName: '', // Invalid empty name
			};

			const result = await peopleNotesService.createNote(options);

			expect(result.success).toBe(false);
			expect(result.note).toBeUndefined();
			expect(result.error).toBeDefined();
		});

		it('should skip embedding when embedInCurrentNote is false', async () => {
			const options: CreateNoteOptions = {
				personName: 'John Doe',
				embedInCurrentNote: false,
				updateTableOfContents: true
			};

			const result = await peopleNotesService.createNote(options);

			expect(result.success).toBe(true);
			expect(result.embedded).toBe(false);
			expect(result.tocUpdated).toBe(true);
		});

		it('should skip TOC update when updateTableOfContents is false', async () => {
			const options: CreateNoteOptions = {
				personName: 'John Doe',
				embedInCurrentNote: true,
				updateTableOfContents: false
			};

			const result = await peopleNotesService.createNote(options);

			expect(result.success).toBe(true);
			expect(result.embedded).toBe(true);
			expect(result.tocUpdated).toBe(false);
		});

		it('should create person directory if it does not exist', async () => {
			const options: CreateNoteOptions = {
				personName: 'New Person'
			};

			const result = await peopleNotesService.createNote(options);

			expect(result.success).toBe(true);
			// Directory should be created automatically
		});
	});
});