# Built using vscode-ext

import sys
import requests
import vscode
from vscode import window
from vscode.config import Config

try:
    from functools import cache
except ImportError:  # cache decorator is new at Python 3.9
    from functools import lru_cache

    def cache(func, /):
        return lru_cache(maxsize=None)(func)


config_li = [
    Config(
        name="Open Top Result",
        description="If enabled, this'll open the top result of the search.",
        input_type=bool,
        default=False,
    )
]
ext = vscode.Extension(
    name="mdn-search", display_name="MDN Search", version="0.0.1", config=config_li
)
ext.set_default_category(ext.display_name)

# session = requests.Session()
base_uri = "https://developer.mozilla.org"
base_search_uri = base_uri + "/api/v1/search?q={q}&sort=best&locale=en-US"


@ext.event
def on_activate():
    return f"{ext.display_name} has been activated"


@ext.command()
def search_mdn():
    try:
        editor = vscode.window.ActiveTextEditor()
    except AttributeError:
        options = vscode.ext.InputBoxOptions(title="Search MDN Web Docs")
        q = vscode.window.show_input_box(options)
    else:
        if not editor or editor.selection.is_empty:
            options = vscode.ext.InputBoxOptions(title="Search MDN Web Docs")
            q = vscode.window.show_input_box(options)
        else:
            q = editor.document.get_text(editor.selection)

    if not q:
        return

    res = core_search(q)
    if not len(res):
        return vscode.window.show_error_message(f'No matches found for "{q}".')

    if ext.get_config("Open Top Result"):
        return vscode.env.open_external(res[0]["mdn_url"])

    to_qp = []

    # convert results to quick pick items
    for i in res[:10]:
        to_qp.append(
            window.QuickPickItem(
                label=i["title"], detail=i["summary"], link=i["mdn_url"]
            )
        )

    pick = vscode.window.show_quick_pick(to_qp)

    if pick:
        return vscode.env.open_external(pick.link)


@cache
def core_search(query: str):

    page = requests.get(base_search_uri.format(q=query))

    res = page.json()["documents"]

    # convert mdn_url to the actual url
    for item in res:
        item["mdn_url"] = base_uri + item["mdn_url"]

    return sorted(res, key=lambda i: i["score"], reverse=True)




def ipc_main():
    globals()[sys.argv[1]]()

ipc_main()
