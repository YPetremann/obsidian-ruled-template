// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";
import RuledTemplate from "./main.js";

export class FolderSuggest extends TextInputSuggest<TFolder> {
	constructor(public inputEl: HTMLInputElement, plugin: RuledTemplate) {
		super(inputEl, plugin);
	}

	getSuggestions(inputStr: string): TFolder[] {
		const abstractFiles = this.plugin.app.vault.getAllLoadedFiles();
		const lowerCaseInputStr = inputStr.toLowerCase();

		const folders: TFolder[] = [];
		for (const folder of abstractFiles) {
			if (!(folder instanceof TFolder)) continue;
			if (!folder.path.toLowerCase().contains(lowerCaseInputStr))
				continue;
			folders.push(folder);
		}
		return folders;
	}

	renderSuggestion(file: TFolder, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFolder): void {
		this.inputEl.value = file.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
