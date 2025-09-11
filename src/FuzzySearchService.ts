import { FuzzySearchService, PersonSearchResult, DirectoryManager, PersonInfo } from './types';

export class FuzzySearchServiceImpl implements FuzzySearchService {
	constructor(private readonly directoryManager: DirectoryManager) {}

	async searchPeople(query: string): Promise<readonly PersonSearchResult[]> {
		if (!query.trim()) {
			return [];
		}

		const allPeople = await this.directoryManager.getAllPeople();
		const results: PersonSearchResult[] = [];

		// Add existing people with match scores
		for (const person of allPeople) {
			const score = this.calculateMatchScore(person.name, query);
			if (score > 0.1) { // Only include reasonable matches
				results.push({
					person,
					isNewPerson: false,
					matchScore: score
				});
			}
		}

		// Always add option to create new person if query doesn't exactly match any existing person
		const exactMatch = allPeople.some(p => 
			p.name.toLowerCase() === query.toLowerCase()
		);

		if (!exactMatch) {
			// Create a new PersonInfo for the potential new person
			const newPersonInfo: PersonInfo = {
				name: query.trim(),
				normalizedName: this.directoryManager.normalizePersonName(query.trim()),
				directoryPath: `People/${this.directoryManager.normalizePersonName(query.trim())}`,
				notes: []
			};

			results.push({
				person: newPersonInfo,
				isNewPerson: true,
				matchScore: 0.5 // Medium score for new person option
			});
		}

		// Sort by match score (highest first) and limit results
		results.sort((a, b) => b.matchScore - a.matchScore);
		return results.slice(0, 10); // Limit to top 10 results
	}

	calculateMatchScore(personName: string, query: string): number {
		if (!query.trim()) {
			return 0;
		}

		const name = personName.toLowerCase();
		const q = query.toLowerCase();

		// Exact match
		if (name === q) {
			return 1.0;
		}

		// Case-insensitive exact match (already handled above, but for clarity)
		if (personName.toLowerCase() === query.toLowerCase()) {
			return 0.95;
		}

		// Starts with query
		if (name.startsWith(q)) {
			return 0.8;
		}

		// Contains query as whole word
		if (name.includes(` ${q}`) || name.includes(`${q} `)) {
			return 0.7;
		}

		// Contains query
		if (name.includes(q)) {
			return 0.6;
		}

		// Check for initials match (e.g., "JD" matches "John Doe")
		const initials = this.extractInitials(personName);
		if (initials.toLowerCase() === q) {
			return 0.5;
		}

		// Fuzzy matching based on character overlap
		const fuzzyScore = this.calculateFuzzyScore(name, q);
		if (fuzzyScore > 0.3) {
			return fuzzyScore;
		}

		// Check if query words are all present in name
		const queryWords = q.split(/\s+/);
		const nameWords = name.split(/\s+/);
		const matchingWords = queryWords.filter(qWord => 
			nameWords.some(nWord => nWord.includes(qWord) || qWord.includes(nWord))
		);

		if (matchingWords.length === queryWords.length) {
			return 0.4; // All query words found
		}

		if (matchingWords.length > 0) {
			return 0.2 + (matchingWords.length / queryWords.length) * 0.2;
		}

		return 0;
	}

	private extractInitials(name: string): string {
		return name
			.split(/\s+/)
			.map(word => word.charAt(0))
			.join('')
			.toUpperCase();
	}

	private calculateFuzzyScore(name: string, query: string): number {
		// Simple fuzzy matching based on Levenshtein-like distance
		const nameChars = name.split('');
		const queryChars = query.split('');
		
		let matches = 0;
		let queryIndex = 0;

		for (const char of nameChars) {
			if (queryIndex < queryChars.length && char === queryChars[queryIndex]) {
				matches++;
				queryIndex++;
			}
		}

		// Score based on how many query characters were matched in order
		const sequentialMatchRatio = matches / query.length;
		
		// Bonus for shorter names (more precise matches)
		const lengthPenalty = Math.min(1, query.length / name.length);
		
		return sequentialMatchRatio * lengthPenalty;
	}
}