import { DirectoryManager, PersonInfo, DEFAULT_SETTINGS } from '../types';
import { DirectoryManagerImpl } from '../DirectoryManager';
import { TFile, TFolder, Vault } from 'obsidian';

describe('DirectoryManager', () => {
	let directoryManager: DirectoryManager;
	let mockVault: jest.Mocked<Vault>;

	beforeEach(() => {
		mockVault = {
			getAbstractFileByPath: jest.fn(),
			getFolderByPath: jest.fn(),
			createFolder: jest.fn(),
		} as any;

		// Default mock behavior
		mockVault.getAbstractFileByPath.mockReturnValue(null);
		mockVault.getFolderByPath.mockReturnValue(null);
		mockVault.createFolder.mockImplementation((path: string) => {
			const folder = new (TFolder as any)(path);
			return Promise.resolve(folder);
		});

		directoryManager = new DirectoryManagerImpl(mockVault, 'People', DEFAULT_SETTINGS);
	});

	describe('normalizePersonName', () => {
		it('should remove invalid filesystem characters', () => {
			const normalized = directoryManager.normalizePersonName('John/Doe\\Test:Name*');
			expect(normalized).toBe('John-Doe-Test-Name');
		});

		it('should trim whitespace', () => {
			const normalized = directoryManager.normalizePersonName('  John Doe  ');
			expect(normalized).toBe('John Doe');
		});

		it('should handle empty strings', () => {
			const normalized = directoryManager.normalizePersonName('');
			expect(normalized).toBe('');
		});

		it('should preserve valid characters', () => {
			const normalized = directoryManager.normalizePersonName('John Doe-Smith');
			expect(normalized).toBe('John Doe-Smith');
		});
	});

	describe('ensurePeopleDirectory', () => {
		it('should create People directory if it does not exist', async () => {
			const folder = await directoryManager.ensurePeopleDirectory();
			expect(folder).toBeInstanceOf(TFolder);
			expect(folder.path).toBe('People');
			expect(mockVault.createFolder).toHaveBeenCalledWith('People');
		});

		it('should return existing People directory if it exists', async () => {
			// Mock that directory already exists
			const existingFolder = new (TFolder as any)('People');
			mockVault.getAbstractFileByPath.mockReturnValue(existingFolder);
			
			const folder = await directoryManager.ensurePeopleDirectory();
			expect(folder).toBeInstanceOf(TFolder);
			expect(folder.path).toBe('People');
			expect(mockVault.createFolder).not.toHaveBeenCalled();
		});
	});

	describe('ensurePersonDirectory', () => {
		it('should create person subdirectory if it does not exist', async () => {
			const folder = await directoryManager.ensurePersonDirectory('John Doe');
			expect(folder).toBeInstanceOf(TFolder);
			expect(folder.path).toBe('People/John Doe');
		});

		it('should normalize person name for directory path', async () => {
			const folder = await directoryManager.ensurePersonDirectory('John/Doe\\Test');
			expect(folder).toBeInstanceOf(TFolder);
			expect(folder.path).toBe('People/John-Doe-Test');
		});
	});

	describe('getPersonInfo', () => {
		it('should return null for non-existent person', async () => {
			const personInfo = await directoryManager.getPersonInfo('Non Existent');
			expect(personInfo).toBeNull();
		});

		it('should return PersonInfo for existing person with notes', async () => {
			// Setup: mock an existing person directory
			const personFolder = new (TFolder as any)('People/John Doe');
			personFolder.children = []; // No notes for now
			mockVault.getFolderByPath.mockReturnValue(personFolder);
			
			const personInfo = await directoryManager.getPersonInfo('John Doe');
			expect(personInfo).not.toBeNull();
			expect(personInfo?.name).toBe('John Doe');
			expect(personInfo?.normalizedName).toBe('John Doe');
			expect(personInfo?.directoryPath).toBe('People/John Doe');
			expect(Array.isArray(personInfo?.notes)).toBe(true);
		});

		it('should include all notes for a person', async () => {
			// Setup: mock person directory with notes
			const personFolder = new (TFolder as any)('People/John Doe');
			const noteFile = new (TFile as any)('People/John Doe/John Doe 2025-09-11--10-18-48.md');
			personFolder.children = [noteFile];
			mockVault.getFolderByPath.mockReturnValue(personFolder);
			
			const personInfo = await directoryManager.getPersonInfo('John Doe');
			expect(personInfo?.notes.length).toBe(1);
		});
	});

	describe('getAllPeople', () => {
		it('should return empty array when no people exist', async () => {
			const people = await directoryManager.getAllPeople();
			expect(people).toEqual([]);
		});

		it('should return all people with their notes', async () => {
			// Setup: mock people directory with subdirectories
			const peopleFolder = new (TFolder as any)('People');
			const johnDoeFolder = new (TFolder as any)('People/John Doe');
			const janeSmithFolder = new (TFolder as any)('People/Jane Smith');
			johnDoeFolder.children = [];
			janeSmithFolder.children = [];
			peopleFolder.children = [johnDoeFolder, janeSmithFolder];
			
			mockVault.getFolderByPath.mockReturnValue(peopleFolder);
			
			const people = await directoryManager.getAllPeople();
			expect(people.length).toBe(2);
			
			const johnDoe = people.find(p => p.name === 'John Doe');
			const janeSmith = people.find(p => p.name === 'Jane Smith');
			
			expect(johnDoe).toBeDefined();
			expect(janeSmith).toBeDefined();
			expect(johnDoe?.directoryPath).toBe('People/John Doe');
			expect(janeSmith?.directoryPath).toBe('People/Jane Smith');
		});

		it('should exclude TOC files from person notes', async () => {
			const peopleFolder = new (TFolder as any)('People');
			const johnDoeFolder = new (TFolder as any)('People/John Doe');
			
			// Create mock files including a TOC file and regular notes
			const tocFile = new (TFile as any)('People/John Doe/John Doe Meeting Notes.md');
			const note1 = new (TFile as any)('People/John Doe/John Doe 2025-09-11--10-18-48.md');
			const note2 = new (TFile as any)('People/John Doe/John Doe 2025-09-12--14-30-15.md');
			
			// Set file properties
			tocFile.extension = 'md';
			tocFile.name = 'John Doe Meeting Notes.md';
			note1.extension = 'md';
			note1.name = 'John Doe 2025-09-11--10-18-48.md';
			note1.stat = { mtime: Date.now() };
			note2.extension = 'md';
			note2.name = 'John Doe 2025-09-12--14-30-15.md';
			note2.stat = { mtime: Date.now() };
			
			johnDoeFolder.children = [tocFile, note1, note2];
			peopleFolder.children = [johnDoeFolder];
			
			mockVault.getFolderByPath.mockReturnValue(peopleFolder);
			
			const people = await directoryManager.getAllPeople();
			expect(people.length).toBe(1);
			
			const johnDoe = people[0];
			expect(johnDoe?.name).toBe('John Doe');
			expect(johnDoe?.notes.length).toBe(2); // Should only include the 2 regular notes, not the TOC
			
			// Verify that notes don't include the TOC file
			const noteNames = johnDoe?.notes.map(note => note.fileName) || [];
			expect(noteNames).toContain('John Doe 2025-09-11--10-18-48.md');
			expect(noteNames).toContain('John Doe 2025-09-12--14-30-15.md');
			expect(noteNames).not.toContain('John Doe Meeting Notes.md');
		});
	});
});