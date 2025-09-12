import { TFile, TFolder } from 'obsidian';

/**
 * Represents information about a person
 */
export interface PersonInfo {
	readonly name: string;
	readonly normalizedName: string; // For filesystem safety
	readonly directoryPath: string;  // People/{PersonName}
	readonly notes: readonly NoteInfo[];
}

/**
 * Represents information about a specific note for a person
 */
export interface NoteInfo {
	readonly personName: string;
	readonly fileName: string;      // {Name} YYYY-MM-DD--HH-mm-ss.md
	readonly filePath: string;      // People/{PersonName}/{fileName}
	readonly timestamp: Date;
	readonly file?: TFile;
}

/**
 * Configuration settings for the People Notes plugin
 */
export interface PeopleNotesSettings {
	peopleDirectoryPath: string;
	tableOfContentsPath: string;
	embeddingFormat: EmbeddingFormat;
	timestampFormat: TimestampFormat;
	noteEmbedType: NoteEmbedType;
}

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: PeopleNotesSettings = {
	peopleDirectoryPath: 'People',
	tableOfContentsPath: 'People/Table of Contents.md',
	embeddingFormat: 'wikilink',
	timestampFormat: 'iso-with-seconds',
	noteEmbedType: 'link'
} as const;

/**
 * Format options for embedding notes
 */
export type EmbeddingFormat = 'wikilink' | 'markdown-link';

/**
 * Format options for timestamps in filenames
 */
export type TimestampFormat = 'iso-with-seconds' | 'iso-without-seconds';

/**
 * Options for how notes are embedded in current document
 */
export type NoteEmbedType = 'link' | 'embed';

/**
 * Result of a person search operation
 */
export interface PersonSearchResult {
	readonly person: PersonInfo;
	readonly isNewPerson: boolean;
	readonly matchScore: number; // 0-1, higher is better match
}

/**
 * Options for creating a new note
 */
export interface CreateNoteOptions {
	readonly personName: string;
	readonly timestamp?: Date;
	readonly embedInCurrentNote?: boolean;
	readonly updateTableOfContents?: boolean;
}

/**
 * Result of a note creation operation
 */
export interface CreateNoteResult {
	readonly success: boolean;
	readonly note?: NoteInfo;
	readonly error?: string;
	readonly embedded: boolean;
	readonly tocUpdated: boolean;
}

/**
 * Interface for managing the People directory structure
 */
export interface DirectoryManager {
	/**
	 * Ensures the People directory exists
	 */
	ensurePeopleDirectory(): Promise<TFolder>;

	/**
	 * Ensures a person's subdirectory exists
	 */
	ensurePersonDirectory(personName: string): Promise<TFolder>;

	/**
	 * Gets all existing people from the directory
	 */
	getAllPeople(): Promise<readonly PersonInfo[]>;

	/**
	 * Gets information about a specific person
	 */
	getPersonInfo(personName: string): Promise<PersonInfo | null>;

	/**
	 * Normalizes a person name for filesystem usage
	 */
	normalizePersonName(name: string): string;
}

/**
 * Interface for creating timestamped notes
 */
export interface PeopleNotesService {
	/**
	 * Creates a new note for a person
	 */
	createNote(options: CreateNoteOptions): Promise<CreateNoteResult>;

	/**
	 * Generates a filename for a person's note
	 */
	generateFileName(personName: string, timestamp?: Date): string;

	/**
	 * Formats a timestamp for use in filenames
	 */
	formatTimestamp(date: Date): string;
}

/**
 * Interface for searching and selecting people
 */
export interface FuzzySearchService {
	/**
	 * Searches for people by name with fuzzy matching
	 */
	searchPeople(query: string): Promise<readonly PersonSearchResult[]>;

	/**
	 * Calculates match score for a person name against a query
	 */
	calculateMatchScore(personName: string, query: string): number;
}

/**
 * Interface for embedding notes in other files
 */
export interface EmbeddingService {
	/**
	 * Embeds a note link in the currently active note
	 */
	embedInCurrentNote(note: NoteInfo): Promise<boolean>;

	/**
	 * Updates the table of contents with a new note
	 */
	updateTableOfContents(note: NoteInfo): Promise<boolean>;

	/**
	 * Formats a note link for embedding
	 */
	formatNoteLink(note: NoteInfo, format: EmbeddingFormat, embedType?: NoteEmbedType): string;
}