import axios from 'axios';
import * as LRU from 'lru-cache';
import * as vscode from 'vscode';
import * as intf from './interfaces';

const cache: LRU<String, intf.SearchDocumentData[]> = new LRU({
	max: 60,
	ttl: 18000000, // 5 hours
});

async function coreSearch(query: String): Promise<intf.SearchDocumentData[]> {
	query = query.toLowerCase(); // for better querying in cache
	if (cache.has(query)) {
		// extra lines of code bc TypeScript is annoying me
		let i: intf.SearchDocumentData[] | undefined;
		if ((i = cache.get(query)) !== undefined) return i;
	}
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

	cache.set(query, page.documents);

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

	const search = vscode.commands.registerCommand(
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
					const toQP: Array<vscode.QuickPickItem> = res.map((i) => {
						return {
							label: i.title,
							description: i.slug,
							detail: i.summary,
						};
					});

					const pick = await vscode.window.showQuickPick(toQP);

					if (pick && pick.description) {
						const callableUri = await convertUrlToCallableUri(
							`https://developer.mozilla.org/en-US/docs/${pick.description}`
						);
						await vscode.env.openExternal(callableUri);
					}
				}
			}
		}
	);

	const clearCache = vscode.commands.registerCommand(
		'mdn-search.clearCache',
		async () => {
			cache.clear();
			await vscode.window.showInformationMessage('Cache Cleared');
		}
	);

	context.subscriptions.push(search, clearCache);
}

// this method is called when your extension is deactivated
export function deactivate() {
	cache.clear();
}
