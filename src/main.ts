import {Editor, MarkdownView, Plugin} from 'obsidian';

export default class SumPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'sum-values',
			name: 'Sum values',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getValue());
			}
		});
	}
}
