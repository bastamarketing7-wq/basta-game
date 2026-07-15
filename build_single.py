#!/usr/bin/env python3
"""Assemble the modular Basta Play project into one self-contained index.html.
Inlines all CSS + JS and embeds both logos as base64 data URIs exactly once
(via global vars), so there are zero external files and no duplicated blobs."""
import base64, re, pathlib

root = pathlib.Path(__file__).parent

def read(p): return (root / p).read_text(encoding="utf-8")

def data_uri(path, mime):
    b = base64.b64encode((root / path).read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b}"

badge = data_uri("assets/logo-badge.png", "image/png")
full  = data_uri("assets/logo-full.jpeg", "image/jpeg")

css_files = ["css/main.css", "css/components.css", "css/animations.css"]
js_files = [
    "js/data.js", "js/storage.js", "js/audio.js", "js/ui.js",
    "js/games/puzzle.js", "js/games/memory.js", "js/games/speed.js",
    "js/games/strategy.js", "js/games/daily.js", "js/main.js",
]

css = "\n\n".join(f"/* ===== {f} ===== */\n" + read(f) for f in css_files)
js  = "\n\n".join(f"/* ===== {f} ===== */\n" + read(f) for f in js_files)

html = read("index.src.html")

# --- Convert static asset references to data-logo hooks (index.html only) ---
html = html.replace('href="assets/logo-badge.png"', 'href="#" data-logo="badge"')
html = html.replace('src="assets/logo-badge.png"', 'src="" data-logo="badge"')
html = html.replace('src="assets/logo-full.jpeg"', 'src="" data-logo="full"')

# --- Strip external link/script tags ---
html = re.sub(r'\s*<link rel="stylesheet"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="preload" as="image"[^>]*>', "", html)
html = re.sub(r'\s*<script src="[^"]*"></script>', "", html)

# --- Bootstrap: define logos once + apply to hooks/favicon ---
bootstrap = (
    "  <script>\n"
    f'  window.LOGO_BADGE={badge!r};\n'
    f'  window.LOGO_FULL={full!r};\n'
    "  (function(){\n"
    "    function apply(){\n"
    "      document.querySelectorAll('[data-logo=\"badge\"]').forEach(function(e){\n"
    "        if(e.tagName==='IMG')e.src=window.LOGO_BADGE; else e.href=window.LOGO_BADGE; });\n"
    "      document.querySelectorAll('[data-logo=\"full\"]').forEach(function(e){ e.src=window.LOGO_FULL; });\n"
    "    }\n"
    "    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();\n"
    "  })();\n"
    "  </script>\n"
)

# Inline CSS before </head>
html = html.replace("</head>", f"  <style>\n{css}\n  </style>\n</head>")
# Bootstrap right after <body>, then app JS before </body>
html = html.replace("<body>", "<body>\n" + bootstrap, 1)
html = html.replace("</body>", f"  <script>\n{js}\n  </script>\n</body>")

out = root / "index.html"
out.write_text(html, encoding="utf-8")
kb = len(html.encode("utf-8")) / 1024
print(f"Wrote single-file index.html: {kb:.0f} KB")
# sanity: each blob embedded once
print("badge blobs:", html.count(badge[:60]))
print("full blobs :", html.count(full[:60]))
print("external asset refs:", html.count("assets/logo"))
