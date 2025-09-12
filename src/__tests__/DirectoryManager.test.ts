import { DirectoryManager, PersonInfo } from '../types';
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

		directoryManager = new DirectoryManagerImpl(mockVault, 'People');
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
	});
});