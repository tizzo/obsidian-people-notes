import { App, FuzzySuggestModal } from 'obsidian';
import { PersonSearchResult, FuzzySearchService, PersonInfo } from './types';

export class PersonSelectorModal extends FuzzySuggestModal<PersonSearchResult> {
	private fuzzySearchService: FuzzySearchService;
	private onSelectCallback: (person: PersonInfo, isNewPerson: boolean) => void;
	private lastQuery = '';

	constructor(
		app: App, 
		fuzzySearchService: FuzzySearchService,
		onSelect: (person: PersonInfo, isNewPerson: boolean) => void
	) {
		super(app);
		this.fuzzySearchService = fuzzySearchService;
		this.onSelectCallback = onSelect;
		
		this.setPlaceholder('Start typing a person\'s name...');
		this.setInstructions([
			{ command: '↑↓', purpose: 'navigate' },
			{ command: '↵', purpose: 'select person' },
			{ command: 'esc', purpose: 'dismiss' }
		]);
	}

	getItems(): PersonSearchResult[] {
		const query = this.inputEl.value;
		
		// Don't search for very short or empty queries
		if (query.length < 1) {
			return [];
		}
		
		// Cache the query to avoid redundant API calls
		if (query === this.lastQuery) {
			return this.cachedResults;
		}
		
		this.lastQuery = query;
		
		// Provide immediate "new person" option while async search loads
		const trimmedQuery = query.trim();
		if (trimmedQuery.length > 0) {
			this.cachedResults = [{
				person: {
					name: trimmedQuery,
					normalizedName: trimmedQuery.replace(/[/\\:*?"<>|]/g, '-').trim(),
					directoryPath: `People/${trimmedQuery.replace(/[/\\:*?"<>|]/g, '-').trim()}`,
					notes: []
				},
				isNewPerson: true,
				matchScore: 0.5
			}];
		}
		
		// Start async search to get real results
		this.performAsyncSearch(query);
		
		return this.cachedResults;
	}

	private async performAsyncSearch(query: string): Promise<void> {
		try {
			const results = await this.fuzzySearchService.searchPeople(query);
			this.cachedResults = [...results];
			
			// Force the modal to update by triggering input event
			this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
		} catch (error) {
			console.error('Error searching for people:', error);
			this.cachedResults = [];
		}
	}

	private cachedResults: PersonSearchResult[] = [];

	getItemText(result: PersonSearchResult): string {
		const person = result.person;
		const prefix = result.isNewPerson ? '+ New: ' : '';
		
		// Show person name with note count for existing people
		if (!result.isNewPerson && person.notes.length > 0) {
			return `${prefix}${person.name} (${person.notes.length} note${person.notes.length === 1 ? '' : 's'})`;
		}
		
		return `${prefix}${person.name}`;
	}

	override renderSuggestion(item: { item: PersonSearchResult }, el: HTMLElement): void {
		const result = item.item;
		const person = result.person;
		
		// Create the main container
		const container = el.createDiv({ cls: 'people-notes-suggestion' });
		
		// Create the title section
		const titleContainer = container.createDiv({ cls: 'people-notes-suggestion-title' });
		
		if (result.isNewPerson) {
			titleContainer.createSpan({ 
				cls: 'people-notes-new-badge',
				text: 'NEW'
			});
		}
		
		titleContainer.createSpan({ 
			cls: 'people-notes-suggestion-name',
			text: person.name 
		});
		
		// Add note count for existing people
		if (!result.isNewPerson && person.notes.length > 0) {
			titleContainer.createSpan({ 
				cls: 'people-notes-note-count',
				text: `${person.notes.length} note${person.notes.length === 1 ? '' : 's'}`
			});
		}
		
		// Show recent notes for existing people (max 3)
		if (!result.isNewPerson && person.notes.length > 0) {
			const recentContainer = container.createDiv({ cls: 'people-notes-recent-notes' });
			const recentNotes = person.notes.slice(0, 3);
			
			recentNotes.forEach(note => {
				const noteEl = recentContainer.createDiv({ cls: 'people-notes-recent-note' });
				
				// Format the timestamp
				const timeStr = note.timestamp.toLocaleDateString() + 
					' ' + note.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
				
				noteEl.createSpan({ 
					cls: 'people-notes-recent-note-time',
					text: timeStr 
				});
			});
		}
		
		// Add match score indicator for debugging (only in dev mode)
		if (process.env.NODE_ENV === 'development') {
			container.createDiv({ 
				cls: 'people-notes-match-score',
				text: `Score: ${result.matchScore.toFixed(2)}`
			});
		}
	}

	override onChooseItem(result: PersonSearchResult): void {
		this.onSelectCallback(result.person, result.isNewPerson);
	}

	override onNoSuggestion(): void {
		// This should rarely be called since we provide immediate "new person" suggestions
		// If it is called, don't automatically create anything - let the user decide
	}

	override open(): void {
		super.open();
		
		// Focus on the input and select any existing text
		this.inputEl.focus();
		this.inputEl.select();
	}
}