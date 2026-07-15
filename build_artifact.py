#!/usr/bin/env python3
"""Build an Artifact-compatible single page (body-content only: no doctype/html/head/body).
All CSS in a <style>, all JS in a <script>, both logos embedded as data URIs."""
import base64, re, pathlib
root = pathlib.Path(__file__).parent
def read(p): return (root / p).read_text(encoding="utf-8")
def data_uri(path, mime):
    b = base64.b64encode((root / path).read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b}"

badge = data_uri("assets/logo-badge.png", "image/png")
full  = data_uri("assets/logo-full.jpeg", "image/jpeg")

css_files = ["css/main.css", "css/components.css", "css/animations.css"]
js_files = ["js/data.js","js/storage.js","js/audio.js","js/ui.js",
            "js/games/quiz.js","js/games/connect.js","js/games/order.js",
            "js/games/rapid.js","js/games/strategy.js","js/games/daily.js","js/main.js"]
css = "\n".join(read(f) for f in css_files)
js  = "\n".join(read(f) for f in js_files)

src = read("index.src.html")
# extract inner <body>...</body>
body = re.search(r"<body>(.*)</body>", src, re.S).group(1)
# strip the external <script src> tags
body = re.sub(r'\s*<script src="[^"]*"></script>', "", body)
# convert static asset refs to data-logo hooks
body = body.replace('src="assets/logo-badge.png"', 'src="" data-logo="badge"')
body = body.replace('src="assets/logo-full.jpeg"', 'src="" data-logo="full"')

bootstrap = (
    "<script>\n"
    f'window.LOGO_BADGE={badge!r};\nwindow.LOGO_FULL={full!r};\n'
    "(function(){function apply(){"
    "document.querySelectorAll('[data-logo=\"badge\"]').forEach(function(e){e.src=window.LOGO_BADGE;});"
    "document.querySelectorAll('[data-logo=\"full\"]').forEach(function(e){e.src=window.LOGO_FULL;});}"
    "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();})();\n"
    "</script>\n"
)

out = f'<style>\n{css}\n</style>\n{bootstrap}\n{body}\n<script>\n{js}\n</script>\n'
(root / "artifact.html").write_text(out, encoding="utf-8")
print("wrote artifact.html", round(len(out.encode())/1024), "KB")
print("external asset refs:", out.count('src="assets/'))
