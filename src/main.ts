import { Notice, Plugin, TFile } from "obsidian";
import { RuledTemplateSettingTab } from "./TemplateRulesSettingTab";
import micromatch from "micromatch";

export interface TemplateRule {
	type: string;
	pattern: string;
	template: string;
}

export interface RuledTemplateSettings {
	templates_folder: string;
	templates_rules: TemplateRule[];
}

export const DEFAULT_SETTINGS: RuledTemplateSettings = {
	templates_folder: "",
	templates_rules: [{ type: "glob", pattern: "", template: "" }],
};

export default class RuledTemplate extends Plugin {
	settings: RuledTemplateSettings;

	async loadSettings() {
		const settings = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();
		//*
		this.addSettingTab(new RuledTemplateSettingTab(this.app, this));
		this.registerEvent(
			this.app.vault.on("create", async (file) => {
				if (!file || !(file instanceof TFile)) return;
				if (file.stat.size > 0) return;
				const [, template] = await this.checkRules(file.path);
				if (!template) return;
				new Notice(
					`Auto selected ${template.path} for ${file.path}`,
					5000
				);
				this.insertTemplate(file, template);
			})
		);
	}
	onunload() {}
	async checkRules(path: string): Promise<[string, TFile?]> {
		try {
			if (!path) throw "➖ give a path to check rules";
			const rules = this.settings.templates_rules;
			let file: TFile | undefined = undefined;
			const match = rules.find(({ pattern, template }) => {
				if (pattern.startsWith("/") && pattern.endsWith("/")) {
					try {
						const regex = new RegExp(pattern.slice(1, -1));
						if (!regex.test(path)) return false;
					} catch {
						throw `❌ ${pattern} is not a valid regex`;
					}
				} else {
					try {
						if (!micromatch.isMatch(path, pattern)) return false;
					} catch {
						throw `❌ ${pattern} is not a valid glob`;
					}
				}
				const tfile = this.app.vault.getAbstractFileByPath(template);
				if (tfile instanceof TFile) {
					file = tfile;
					return true;
				}
				throw `❌ ${template} is not a file`;
			});
			if (!match || !file) throw `➖ ${path} match nothing`;
			const { template } = match;
			const index = rules.indexOf(match) + 1;
			return [`✔️ ${path} matched ${index} ${template}`, file];
		} catch (msg) {
			return [msg];
		}
	}
	async insertTemplate(file: TFile, template: TFile): Promise<void> {
		const content = await file.vault.read(template);
		await file.vault.append(file, content);
	}
}
