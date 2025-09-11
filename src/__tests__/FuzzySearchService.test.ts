import { FuzzySearchService, PersonSearchResult } from '../types';

// This is a failing test - we haven't implemented FuzzySearchService yet
describe('FuzzySearchService', () => {
	let fuzzySearchService: FuzzySearchService;

	beforeEach(() => {
		// This will fail until we implement FuzzySearchServiceImpl
		// fuzzySearchService = new FuzzySearchServiceImpl(mockDirectoryManager);
	});

	describe('calculateMatchScore', () => {
		it('should return 1.0 for exact matches', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', 'John Doe');
			expect(score).toBe(1.0);
		});

		it('should return high score for case-insensitive exact matches', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', 'john doe');
			expect(score).toBeGreaterThan(0.9);
		});

		it('should return good score for partial matches', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', 'john');
			expect(score).toBeGreaterThan(0.5);
			expect(score).toBeLessThan(1.0);
		});

		it('should return decent score for fuzzy matches', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', 'jon do');
			expect(score).toBeGreaterThan(0.3);
			expect(score).toBeLessThan(0.8);
		});

		it('should return low score for poor matches', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', 'xyz');
			expect(score).toBeLessThan(0.2);
		});

		it('should return 0 for empty query', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', '');
			expect(score).toBe(0);
		});

		it('should handle initials matching', () => {
			const score = fuzzySearchService.calculateMatchScore('John Doe', 'JD');
			expect(score).toBeGreaterThan(0.4);
		});
	});

	describe('searchPeople', () => {
		beforeEach(() => {
			// Mock some existing people for testing
			// This would be setup by mocking the directoryManager.getAllPeople() method
		});

		it('should return empty array for no matches', async () => {
			const results = await fuzzySearchService.searchPeople('zzzznonexistent');
			expect(results).toEqual([]);
		});

		it('should return exact matches first', async () => {
			// Assume we have people: 'John Doe', 'John Smith', 'Jane Doe'
			const results = await fuzzySearchService.searchPeople('John Doe');
			
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.person.name).toBe('John Doe');
			expect(results[0]?.matchScore).toBe(1.0);
			expect(results[0]?.isNewPerson).toBe(false);
		});

		it('should return results sorted by match score', async () => {
			const results = await fuzzySearchService.searchPeople('john');
			
			// Should return results in descending order of match score
			for (let i = 1; i < results.length; i++) {
				expect(results[i]?.matchScore).toBeLessThanOrEqual(results[i-1]?.matchScore || 0);
			}
		});

		it('should include new person option for non-matching queries', async () => {
			const results = await fuzzySearchService.searchPeople('Completely New Person');
			
			// Should include option to create new person
			const newPersonResult = results.find(r => r.isNewPerson);
			expect(newPersonResult).toBeDefined();
			expect(newPersonResult?.person.name).toBe('Completely New Person');
		});

		it('should limit results to reasonable number', async () => {
			const results = await fuzzySearchService.searchPeople('j'); // Very broad search
			
			// Should not return too many results to avoid overwhelming UI
			expect(results.length).toBeLessThanOrEqual(10);
		});

		it('should handle partial name matches', async () => {
			const results = await fuzzySearchService.searchPeople('doe');
			
			// Should match both 'John Doe' and 'Jane Doe'
			const matchingNames = results.map(r => r.person.name);
			expect(matchingNames.some(name => name.includes('Doe'))).toBe(true);
		});

		it('should be case insensitive', async () => {
			const resultsLower = await fuzzySearchService.searchPeople('john doe');
			const resultsUpper = await fuzzySearchService.searchPeople('JOHN DOE');
			const resultsMixed = await fuzzySearchService.searchPeople('John Doe');
			
			// All should return the same person
			expect(resultsLower.length).toBeGreaterThan(0);
			expect(resultsUpper.length).toBeGreaterThan(0);
			expect(resultsMixed.length).toBeGreaterThan(0);
			
			expect(resultsLower[0]?.person.name).toBe(resultsUpper[0]?.person.name);
			expect(resultsLower[0]?.person.name).toBe(resultsMixed[0]?.person.name);
		});
	});
});