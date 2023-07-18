import { App, PluginSettingTab, Setting } from "obsidian";
import type RuledTemplate from "./main";
import { arraymove } from "./utils";
import { FileSuggest, FileSuggestMode } from "./FileSuggester";
import { FolderSuggest } from "./FolderSuggester";

export class RuledTemplateSettingTab extends PluginSettingTab {
	plugin: RuledTemplate;

	constructor(app: App, plugin: RuledTemplate) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display() {
		this.containerEl.empty();
		this.add_template_folder_setting();
		this.add_templates_rules_setting();
		this.add_file_check();
	}
	add_template_folder_setting(): void {
		new Setting(this.containerEl)
			.setName("Template folder location")
			.setDesc("indicate template folder easier search of templates.")
			.addSearch((cb) => {
				new FolderSuggest(cb.inputEl, this.plugin);
				cb.setPlaceholder("Example: folder1/folder2")
					.setValue(this.plugin.settings.templates_folder)
					.onChange((value) => {
						this.plugin.settings.templates_folder = value;
						this.plugin.saveSettings();
					});
			});
	}
	add_file_check(): void {
		const s = new Setting(this.containerEl)
			.setName("Test rules with a path")
			.setDesc("➖ check if a file match a rule.")
			.addSearch((cb) => {
				new FileSuggest(
					cb.inputEl,
					this.plugin,
					FileSuggestMode.AnyFiles
				);
				cb.setPlaceholder("Example: folder/file.md").onChange(
					async (path) => {
						const [msg] = await this.plugin.checkRules(path);
						s.setDesc(msg);
					}
				);
			});
	}
	add_templates_rules_setting(): void {
		const rules = this.plugin.settings.templates_rules;
		new Setting(this.containerEl)
			.setName("Template rules")
			.setDesc("list of rules to decide the template used.")
			.setHeading();

		rules.forEach((rule, index) => {
			const s = new Setting(this.containerEl)
				.addText((text) =>
					text
						.setPlaceholder("**/*.md  or  /d{4}-d{2}-d{2}.md/")
						.setValue(rule.pattern)
						.onChange(async (value) => {
							rule.pattern = value;
							await this.plugin.saveSettings();
						})
				)

				.addSearch((cb) => {
					new FileSuggest(
						cb.inputEl,
						this.plugin,
						FileSuggestMode.TemplateFiles
					);

					cb.setPlaceholder("Example: folder1/template_file")
						.setValue(rule.template)
						.onChange(async (new_template) => {
							rule.template = new_template;
							await this.plugin.saveSettings();
						});
					// @ts-ignore
				})
				.addExtraButton((cb) => {
					cb.setIcon("up-chevron-glyph")
						.setTooltip("Move up")
						.onClick(async () => {
							arraymove(rules, index, index - 1);
							await this.plugin.saveSettings();
							this.display();
						});
					if (index === 0)
						cb.extraSettingsEl.firstChild?.firstChild?.remove();
				})
				.addExtraButton((cb) => {
					cb.setIcon("down-chevron-glyph")
						.setTooltip("Move down")
						.onClick(async () => {
							arraymove(rules, index, index + 1);
							await this.plugin.saveSettings();
							this.display();
						});

					if (index === rules.length - 1)
						cb.extraSettingsEl.firstChild?.firstChild?.remove();
				})
				.addExtraButton((cb) => {
					cb.setIcon("cross")
						.setTooltip("Delete")
						.onClick(async () => {
							rules.splice(index, 1);
							if (!rules.length) this.addDefaultRule();
							await this.plugin.saveSettings();
							this.display();
						});
				});
			s.setName(`${index}`);
			s.setClass("RuledTemplate__template_rule");
			//s.setDesc("a");
		});

		new Setting(this.containerEl).addButton((cb) => {
			cb.setButtonText("Add rule")
				.setCta()
				.onClick(() => {
					this.addDefaultRule();
					this.plugin.saveSettings();
					this.display();
				});
		});
	}
	addDefaultRule() {
		const rules = this.plugin.settings.templates_rules;
		rules.push({ type: "glob", pattern: "", template: "" });
	}
}
