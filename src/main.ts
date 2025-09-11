import { Plugin } from 'obsidian';

export default class PeopleNotesPlugin extends Plugin {
	async onload(): Promise<void> {
		console.log('Loading People Notes plugin');
	}

	onunload(): void {
		console.log('Unloading People Notes plugin');
	}
}