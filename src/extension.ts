import axios from 'axios';
import * as vscode from 'vscode';
import * as intf from './interfaces';

async function coreSearch(query: String) {
	const baseUri = 'https://developer.mozilla.org';
	const res = await axios.get(
		`${baseUri}/api/v1/search?q=${query}&sort=best&locale=en-US`
	);

	let page: intf.SearchData = res.data;
	page.documents.map((docObj: intf.SearchDocumentData) => {
		let newUrl = `https://developer.mozilla.org${docObj.mdn_url}`;
		docObj.mdn_url = newUrl;
	});
	page.documents.sort((a, b) => a.score - b.score).reverse();

	return page.documents;
}

async function convertUrlToCallableUri(url: string) {
	return await vscode.env.asExternalUri(vscode.Uri.parse(url));
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"mdn-search" is now active!');

	let disposable = vscode.commands.registerCommand(
		'mdn-search.search',
		async () => {
			let editor = vscode.window.activeTextEditor;
			const config = vscode.workspace.getConfiguration('mdn-search');
			let q: string | undefined;

			if (editor === undefined || editor.selection.isEmpty) {
				q = await vscode.window.showInputBox({
					title: 'Search MDN Web Docs',
				});
			} else {
				q = editor.document.getText(editor.selection);
			}

			if (q !== undefined) {
				const res = await coreSearch(q);
				if (res.length === 0) {
					await vscode.window.showErrorMessage(
						`No matches found for "${q}".`
					);
				} else {
					if (config.get('openTopResult')) {
						const callableUri = await convertUrlToCallableUri(
							res[0].mdn_url
						);
						await vscode.env.openExternal(callableUri);
						return;
					}
					let toQP: Array<vscode.QuickPickItem> = [];

					for (let index in res) {
						let i = res[index];
						toQP.push({
							label: i.title,
							description: i.summary,
							detail: i.mdn_url,
						});
					}
					const pick = await vscode.window.showQuickPick(toQP);

					if (pick && pick.detail) {
						const callableUri = await convertUrlToCallableUri(
							pick.detail
						);
						await vscode.env.openExternal(callableUri);
					}
				}
			}
		}
	);

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
