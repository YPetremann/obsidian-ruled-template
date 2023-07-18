import { TemplaterError } from "./Error";
import { normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";

export function resolve_tfolder(folder_str: string): TFolder {
	folder_str = normalizePath(folder_str);

	const folder = app.vault.getAbstractFileByPath(folder_str);
	if (!folder)
		throw new TemplaterError(`Folder "${folder_str}" doesn't exist`);

	if (!(folder instanceof TFolder))
		throw new TemplaterError(`${folder_str} is a file, not a folder`);

	return folder;
}

export function get_tfiles_from_folder(folder_str: string): Array<TFile> {
	const folder = resolve_tfolder(folder_str);

	const files: Array<TFile> = [];
	Vault.recurseChildren(folder, (file: TAbstractFile) => {
		if (file instanceof TFile) {
			files.push(file);
		}
	});

	files.sort((a, b) => {
		return a.basename.localeCompare(b.basename);
	});

	return files;
}

export function arraymove<T>(
	arr: T[],
	fromIndex: number,
	toIndex: number
): void {
	if (toIndex < 0 || toIndex === arr.length) {
		return;
	}
	const element = arr[fromIndex];
	arr[fromIndex] = arr[toIndex];
	arr[toIndex] = element;
}
