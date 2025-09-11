import { DirectoryManager, PersonInfo } from '../types';
import { TFile, TFolder } from 'obsidian';

// This is a failing test - we haven't implemented DirectoryManager yet
describe('DirectoryManager', () => {
	let directoryManager: DirectoryManager;

	beforeEach(() => {
		// This will fail until we implement DirectoryManagerImpl
		// directoryManager = new DirectoryManagerImpl(mockVault, 'People');
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
		});

		it('should return existing People directory if it exists', async () => {
			// Mock that directory already exists
			const folder = await directoryManager.ensurePeopleDirectory();
			expect(folder).toBeInstanceOf(TFolder);
			expect(folder.path).toBe('People');
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
			// Setup: create a person directory with some notes
			await directoryManager.ensurePersonDirectory('John Doe');
			
			const personInfo = await directoryManager.getPersonInfo('John Doe');
			expect(personInfo).not.toBeNull();
			expect(personInfo?.name).toBe('John Doe');
			expect(personInfo?.normalizedName).toBe('John Doe');
			expect(personInfo?.directoryPath).toBe('People/John Doe');
			expect(Array.isArray(personInfo?.notes)).toBe(true);
		});

		it('should include all notes for a person', async () => {
			// This test will verify that all notes in person directory are included
			const personInfo = await directoryManager.getPersonInfo('John Doe');
			expect(personInfo?.notes.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('getAllPeople', () => {
		it('should return empty array when no people exist', async () => {
			const people = await directoryManager.getAllPeople();
			expect(people).toEqual([]);
		});

		it('should return all people with their notes', async () => {
			// Setup: create multiple person directories
			await directoryManager.ensurePersonDirectory('John Doe');
			await directoryManager.ensurePersonDirectory('Jane Smith');
			
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