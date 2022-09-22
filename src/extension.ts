import axios from 'axios';
import * as vscode from 'vscode';

async function coreSearch(query: String) {
	const baseUri = 'https://developer.mozilla.org';
	let page: Object = await axios.get(
		`${baseUri}/api/v1/search?q=${query}&sort=best&locale=en-US`
	);
	let res: Array<Object> = page.documents.map(
		(docObj: Object) => `${baseUri}${docObj.mdn_url}`
	);

	return res.sort((a, b) => a.score - b.score).reverse();
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"mdn-search" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'mdn-search.helloWorld',
		() => {
			// The code you place here will be executed every time your command is executed
			// Display a message box to the user
			vscode.window.showInformationMessage(
				'Hello World from mdn-search!'
			);
		}
	);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
