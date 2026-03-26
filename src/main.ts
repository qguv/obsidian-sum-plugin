import {Editor, MarkdownView, Plugin} from 'obsidian';

const display_sum_re = /(?<before>\(€)(?<value>[0-9.,]*)(?<after>( total)?\))\s*$/;
const header_re = /^#+/;

function get_header_depth(s: string): number | undefined {
	return header_re.exec(s)?.[0]?.length ?? undefined;
}

function get_sum(s: string): number {
	const value_str = display_sum_re.exec(s)?.groups?.value ?? '';
	return s2cents(value_str);
}

function s2cents(s: string): number {
	s = s.replace(',', '.');
	const factor = (
		(s.at(-3) === '.') ? 1 :
		(s.at(-2) === '.') ? 10 :
		100
	);
	return factor * +s.replace('.', '');
}

function cents2s(n: number): string {
	const s = (n + 49).toString();
	return s.slice(0, s.length - 2).padStart(1, '0');
}

function sum_downward(depth: number, lines: string[]): [number, string[]] {
	let sum = 0;
	let our_lines = [];
	while (0 < lines.length) {

		const new_depth = get_header_depth(lines[0] as string);

		// handle regular line
		if (new_depth === undefined) {
			const line = lines.shift() as string;
			sum += get_sum(line);
			our_lines.push(line);
			continue;
		}

		// handle return to parent section
		if (new_depth <= depth) {
			break;
		}

		// handle child section
		let new_header = lines.shift() as string;
		const [new_sum, new_lines] = sum_downward(new_depth, lines);
		new_header = new_header.replace(display_sum_re, `$<before>${cents2s(new_sum)}$<after>`);
		our_lines.push(new_header, ...new_lines);
		sum += new_sum;
	}

	return [sum, our_lines];
}

export default class SumPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: 'sum-values',
			name: 'Sum values',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const lines = editor.getValue().split('\n');
				const [n, new_lines] = sum_downward(0, lines);
				console.log("total:", cents2s(n));
				editor.setValue(new_lines.join('\n'));
			}
		});
	}
}
