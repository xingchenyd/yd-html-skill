"""Inline the starter's styles, scripts, and explicitly marked local assets."""

import argparse
import base64
import mimetypes
import re
from pathlib import Path


STARTER = Path(__file__).resolve().parents[1] / "assets" / "starter"
STYLES = ("player.css", "demo.css")
SCRIPTS = ("motion.js", "demo.js", "player.js")
ASSET = re.compile(r"\{\{asset:([^{}\r\n]+)\}\}")


def build(project, output):
    project = project.resolve(strict=True)
    entry = project / "index.html"
    documents = (entry, *(project / filename for filename in (*STYLES, *SCRIPTS)))
    destination = output.resolve()
    if destination in documents:
        raise ValueError("Write the packed HTML to a file other than the input sources.")

    def load(filename):
        return (project / filename).read_text(encoding="utf-8-sig")

    def embed(match):
        relative_name = Path(match.group(1).strip())
        if relative_name.is_absolute():
            raise ValueError(f"Asset must be relative to the starter directory: {relative_name}")
        asset = (project / relative_name).resolve(strict=True)
        if not asset.is_relative_to(project) or asset == destination:
            raise ValueError(f"Asset must be an input file within the starter directory: {relative_name}")
        mime = mimetypes.guess_type(asset.name)[0]
        if not mime or mime.partition("/")[0] not in {"image", "font", "audio", "video"}:
            raise ValueError(f"Unsupported inline asset type: {relative_name}")
        encoded = base64.b64encode(asset.read_bytes()).decode("ascii")
        return f"data:{mime};base64,{encoded}"

    html = load("index.html")
    for marker in ("<!-- YD_INLINE_CSS -->", "<!-- YD_INLINE_JS -->"):
        if html.count(marker) != 1:
            raise ValueError(f"index.html must contain exactly one {marker}")

    styles = "\n".join(load(filename) for filename in STYLES)
    escaped_scripts = [
        re.sub(r"</script", lambda match: r"<\/" + match[0][2:], load(filename), flags=re.I)
        for filename in SCRIPTS
    ]
    blocks = "\n".join("<script>\n" + script + "\n</script>" for script in escaped_scripts)
    html = html.replace("<!-- YD_INLINE_CSS -->", "<style>\n" + styles + "\n</style>")
    html = html.replace("<!-- YD_INLINE_JS -->", blocks)
    html = ASSET.sub(embed, html)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(html)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Path for the distributable HTML")
    parser.add_argument("--project", type=Path, default=STARTER, help="Directory with the six starter sources and local assets")
    args = parser.parse_args()
    try:
        result = build(args.project, args.output)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    print(result)


if __name__ == "__main__":
    main()
