import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('debug-shortcuts.print_debug', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { return; }

		const doc = editor.document;
		const sel = editor.selection;

		// Determine language
		const lang = doc.languageId;  // "go", "c", "cpp", "javascript", etc.

		// 1. Selected text has priority
		let text = doc.getText(sel);

		// 2. If nothing selected, get word under cursor
		if (!text) {
			const wordRange = doc.getWordRangeAtPosition(sel.active, /[A-Za-z0-9_.]+/);
			if (wordRange) {
				text = doc.getText(wordRange);
			} else {
				vscode.window.showInformationMessage("No variable or text selected.");
				return;
			}
		}

		// Build debug line based on language
		const logLine = buildDebugLine(lang, text) + "\n";

		editor.edit(editBuilder => {
			const insertionLine = sel.end.line;
			const lastLine = doc.lineCount - 1;

			if (insertionLine === lastLine) {
				const lineText = doc.lineAt(insertionLine).text;
				editBuilder.insert(
					new vscode.Position(insertionLine, lineText.length),
					"\n" + logLine
				);
			} else {
				editBuilder.insert(
					new vscode.Position(insertionLine + 1, 0),
					logLine
				);
			}
		});
	});

	context.subscriptions.push(disposable);
}
function buildDebugLine(lang: string, variable: string): string {
	switch (lang) {
		case "go":
			return `log.Debug("${variable}: %#v", ${variable})`;

		case "c":
		case "cpp":
			return `printf("${variable}: %d\\n", ${variable});`;

		case "javascript":
		case "typescript":
			return `console.log("${variable}: ", ${variable});`;

		case "python":
			return `print("${variable}: ", ${variable})`;

		default:
			// fallback generic output
			return `DEBUG: ${variable}`;
	}
}
export function deactivate() { }
