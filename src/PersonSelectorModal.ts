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
		
		// Use synchronous search by converting async to sync with a cached approach
		// This is a simplified implementation - in a real scenario, you might want to 
		// implement debouncing and async loading states
		this.fuzzySearchService.searchPeople(query).then(results => {
			this.cachedResults = [...results];
			// Note: updateSuggestions() is not available on the base class
			// The modal will automatically refresh when getItems() is called again
		}).catch(error => {
			console.error('Error searching for people:', error);
			this.cachedResults = [];
		});
		
		return this.cachedResults;
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
			const newBadge = titleContainer.createSpan({ 
				cls: 'people-notes-new-badge',
				text: 'NEW'
			});
		}
		
		const nameEl = titleContainer.createSpan({ 
			cls: 'people-notes-suggestion-name',
			text: person.name 
		});
		
		// Add note count for existing people
		if (!result.isNewPerson && person.notes.length > 0) {
			const noteCount = titleContainer.createSpan({ 
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
			const scoreEl = container.createDiv({ 
				cls: 'people-notes-match-score',
				text: `Score: ${result.matchScore.toFixed(2)}`
			});
		}
	}

	override onChooseItem(result: PersonSearchResult): void {
		this.onSelectCallback(result.person, result.isNewPerson);
	}

	override onNoSuggestion(): void {
		// Show a helpful message when no suggestions are found
		const query = this.inputEl.value.trim();
		
		if (query.length > 0) {
			// Automatically create option for new person
			const newPersonInfo: PersonInfo = {
				name: query,
				normalizedName: query.replace(/[/\\:*?"<>|]/g, '-').trim(),
				directoryPath: `People/${query.replace(/[/\\:*?"<>|]/g, '-').trim()}`,
				notes: []
			};
			
			this.onSelectCallback(newPersonInfo, true);
		}
	}

	override open(): void {
		super.open();
		
		// Focus on the input and select any existing text
		this.inputEl.focus();
		this.inputEl.select();
	}
}