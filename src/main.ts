import { Plugin, TAbstractFile } from "obsidian";
import { TemplateRulesSettingTab } from "./TemplateRulesSettingTab";
import micromatch from "micromatch";

export interface TemplateRule {
	type: string;
	pattern: string;
	template: string;
}

export interface MyPluginSettings {
	templates_folder: string;
	templates_rules: TemplateRule[];
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	templates_folder: "",
	templates_rules: [{ type: "glob", pattern: "", template: "" }],
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	isReady = false;

	async loadSettings() {
		const settings = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();
		this.app.workspace.onLayoutReady(() => {
			this.isReady = true;
		});
		//*
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				console.log("file-open", file?.path);
				const reason = this.blockProcessFile(file);
				console.log("reason", reason);
				if (!reason) this.insertTemplate(file);
			})
		);
		/*/
		this.registerEvent(
			this.app.workspace.on("file-open", async (file) => {
				console.log("file-open", file?.path);
				const reason = this.blockProcessFile(file);
				console.log("reason", reason);
				if (!reason) this.insertTemplate(file);
			})
		);
		// */
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TemplateRulesSettingTab(this.app, this));
	}
	onunload() {}
	blockProcessFile(file: TAbstractFile): string | false {
		if (!file) return "no file";
		if (!this.isReady) return "not ready";
		if (!file.path.endsWith(".md")) return "not a markdown file";
		//if (file.stat.ctime !== file.stat.mtime)
		//	return "file has only been modified";
		//if (file.stat.size !== 0) return "file is not empty";
		//const activeFile = this.app.workspace.getActiveFile();
		//if (activeFile?.path !== file.path) return "file is not active";
		const templates_folder = this.settings.templates_folder;
		if (!templates_folder) return "no template folder";
		if (file.path.startsWith(templates_folder))
			return "file is in template folder";
		return false;
	}
	async insertTemplate(file: TAbstractFile | null): Promise<void> {
		if (!file) return;
		console.log("insertTemplate");
		const path = file.path;
		console.log("path", path);
		const match = this.settings.templates_rules.find(({ pattern }) => {
			console.log("rule", pattern);
			try {
				return new RegExp(pattern).test(path);
			} catch {
				console.error("invalid regex");
			}
			try {
				return micromatch.isMatch(path, pattern);
			} catch {
				console.error("invalid glob");
			}
		});
		if (!match) return;
		console.log("matched ${match.template}");
		const content = await file.vault.adapter.read(match.template);
		//await file.vault.adapter.write(path, content);
		await file.vault.adapter.append(path, content);
		//this.app.commands.executeCommandById("insert-template");
	}
}
