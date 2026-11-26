#!/usr/bin/env python3
"""Verify a standalone HTML deck built with the yd-html-skill starter.

The checker uses section.slide, [data-beat], [data-beats], and #timeline button.
When used, [data-in] reveals must have [data-pending] before their beat.
Python 3.10+ and Playwright are required. Pillow is only needed for --montage.
"""

from argparse import ArgumentParser, RawDescriptionHelpFormatter
from pathlib import Path
from urllib.parse import urldefrag, urlsplit
import sys


DESKTOP = {"width": 1600, "height": 900}
PORTRAIT = {"width": 390, "height": 844}
SLIDES = "section.slide"
ACTIVE = f"{SLIDES}:not([hidden])"
TIMELINE = "#timeline button"
TIMEOUT = 6000


def slide_at(page, expect, index, beat):
    slide = page.locator(SLIDES).nth(index)
    expect(page.locator(ACTIVE)).to_have_count(1, timeout=TIMEOUT)
    expect(slide).to_be_visible(timeout=TIMEOUT)
    expect(slide).to_have_attribute("data-beat", str(beat), timeout=TIMEOUT)
    expect(page.locator("#wipe")).not_to_be_visible(timeout=TIMEOUT)
    incorrect_reveals = slide.locator("[data-in]").evaluate_all("""(nodes, beat) => nodes.filter(node =>
        node.hasAttribute('data-pending') !== (Number(node.dataset.in) > beat)
    ).map(node => node.dataset.in)""", beat)
    if incorrect_reveals:
        raise AssertionError(f"Slide {index + 1}, beat {beat}: unexpected reveal state for data-in={incorrect_reveals}.")
    return slide


def audit_page(browser, url, traffic, errors, **context_options):
    context = browser.new_context(offline=True, service_workers="block", **context_options)
    page = context.new_page()
    page.on("pageerror", lambda error: errors.add(str(error)))
    page.on("console", lambda message: errors.add(message.text) if message.type == "error" else None)
    page.on("websocket", lambda socket: traffic.add(socket.url))

    def inspect_request(request):
        scheme = urlsplit(request.url).scheme
        if scheme not in {"about", "data", "blob"} and urldefrag(request.url).url != url:
            traffic.add(request.url)

    page.on("request", inspect_request)
    page.goto(url, wait_until="load", timeout=30000)
    page.evaluate("document.fonts.ready.then(() => true)")
    return context, page


def require_in_view(page, locator, label):
    bounds = locator.bounding_box(timeout=TIMEOUT)
    size = page.viewport_size
    if not bounds or bounds["width"] <= 0 or bounds["height"] <= 0:
        raise AssertionError(f"{label} has no visible bounds.")
    x, y, width, height = (bounds[key] for key in ("x", "y", "width", "height"))
    if x < -2 or y < -2 or x + width > size["width"] + 2 or y + height > size["height"] + 2:
        raise AssertionError(f"{label} extends outside the {size['width']}x{size['height']} viewport: {bounds}")


def capture(page, directory, index, name, wait_ms):
    if directory is None:
        return None
    page.wait_for_timeout(wait_ms)
    path = directory / f"slide-{index + 1:02d}-{name}.png"
    page.screenshot(path=path, caret="hide")
    return path


def verify_dialogs(page, expect):
    for name in ("overview", "notes"):
        trigger = page.locator(f"#{name}-btn")
        if trigger.count() and trigger.is_visible() and trigger.is_enabled():
            dialog = page.locator(f"dialog#{name}")
            trigger.click()
            expect(dialog).to_be_visible(timeout=TIMEOUT)
            page.keyboard.press("Escape")
            expect(dialog).not_to_be_visible(timeout=TIMEOUT)


def desktop(browser, url, expect, traffic, errors, output, settle_ms):
    context, page = audit_page(browser, url, traffic, errors, viewport=DESKTOP, reduced_motion="no-preference")
    try:
        count = page.locator(SLIDES).count()
        if not count:
            raise AssertionError(f"No slides match {SLIDES}.")
        expect(page.locator(TIMELINE)).to_have_count(count, timeout=TIMEOUT)
        final_frames = []

        for index in range(count):
            slide = slide_at(page, expect, index, 0)
            beats = int(slide.get_attribute("data-beats") or "1")
            if beats < 1:
                raise AssertionError(f"Slide {index + 1} has invalid data-beats {beats}.")
            require_in_view(page, slide, f"Slide {index + 1}")
            if beats > 1:
                capture(page, output, index, "first", settle_ms)
            for beat in range(1, beats):
                page.keyboard.press("ArrowRight")
                slide_at(page, expect, index, beat)
                if beat == 1:
                    capture(page, output, index, "motion", 180)
                if beats > 2 and beat == beats // 2:
                    capture(page, output, index, "mid", settle_ms)
            final_frames.append(capture(page, output, index, "final", settle_ms))
            if index < count - 1:
                page.keyboard.press("ArrowRight")

        if count > 1:
            page.keyboard.press("ArrowUp")
            slide_at(page, expect, count - 2, 0)
            page.keyboard.press("ArrowDown")
            slide_at(page, expect, count - 1, 0)
            page.locator(TIMELINE).first.click()
            slide = slide_at(page, expect, 0, 0)
            if int(slide.get_attribute("data-beats") or "1") > 1:
                page.keyboard.press("ArrowRight")
                slide_at(page, expect, 0, 1)
                page.keyboard.press("ArrowLeft")
                slide_at(page, expect, 0, 0)
        verify_dialogs(page, expect)
        return count, final_frames
    finally:
        context.close()


def reduced_motion(browser, url, expect, traffic, errors, settle_ms):
    context, page = audit_page(browser, url, traffic, errors, viewport=DESKTOP, reduced_motion="reduce")
    try:
        slide = slide_at(page, expect, 0, 0)
        if not page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"):
            raise AssertionError("Chromium did not apply the reduced-motion preference.")
        page.wait_for_timeout(settle_ms)
        running = page.evaluate("""() => document.getAnimations().filter(animation => {
            const timing = animation.effect.getTiming();
            return animation.playState === 'running' && timing.iterations === Infinity && timing.duration > 0;
        }).length""")
        if running:
            raise AssertionError(f"Reduced-motion mode has {running} continuous CSS animations.")
        first = page.screenshot(caret="hide")
        page.wait_for_timeout(320)
        second = page.screenshot(caret="hide")
        if first != second:
            raise AssertionError("The initial scene changed while idle with reduced motion enabled.")
        if int(slide.get_attribute("data-beats") or "1") > 1:
            page.keyboard.press("ArrowRight")
            slide_at(page, expect, 0, 1)
    finally:
        context.close()


def portrait(browser, url, expect, traffic, errors, output, settle_ms):
    context, page = audit_page(
        browser, url, traffic, errors, viewport=PORTRAIT, is_mobile=True, has_touch=True, reduced_motion="reduce"
    )
    try:
        slide = slide_at(page, expect, 0, 0)
        if not page.evaluate("document.documentElement.scrollWidth <= innerWidth"):
            raise AssertionError("Portrait view scrolls horizontally.")
        require_in_view(page, slide, "Portrait opening slide")
        first = page.locator(TIMELINE).first
        last = page.locator(TIMELINE).last
        require_in_view(page, first, "First portrait timeline control")
        require_in_view(page, last, "Last portrait timeline control")
        if output:
            page.wait_for_timeout(settle_ms)
            page.screenshot(path=output / "portrait.png", caret="hide")
        last.tap()
        last_index = page.locator(SLIDES).count() - 1
        require_in_view(page, slide_at(page, expect, last_index, 0), "Portrait last slide")
    finally:
        context.close()


def make_montage(paths, output):
    try:
        from PIL import Image, ImageDraw
    except ImportError as error:
        raise RuntimeError("Install Pillow to write a montage: python -m pip install Pillow") from error

    width, height, gap, label = 400, 225, 12, 21
    columns = min(len(paths), 4)
    rows = (len(paths) + columns - 1) // columns
    montage = Image.new("RGB", (columns * (width + gap) + gap, rows * (height + label + gap) + gap), "#121818")
    canvas = ImageDraw.Draw(montage)
    for index, path in enumerate(paths):
        row, column = divmod(index, columns)
        left = gap + column * (width + gap)
        top = gap + row * (height + label + gap)
        with Image.open(path) as image:
            image = image.resize((width, height), Image.Resampling.LANCZOS).convert("RGB")
            montage.paste(image, (left, top))
        canvas.text((left, top + height + 4), f"{index + 1:02d}", fill="#e8e3d9")
    montage.save(output / "montage.png")


def main():
    parser = ArgumentParser(description=__doc__, formatter_class=RawDescriptionHelpFormatter)
    parser.add_argument("html", type=Path, help="Standalone HTML deck to open through file://")
    parser.add_argument("--output", type=Path, help="Optional folder for desktop and portrait screenshots")
    parser.add_argument("--montage", action="store_true", help="Create a montage of final beats in --output")
    parser.add_argument("--chromium", type=Path, help="Path to an installed Chromium-family executable")
    parser.add_argument("--settle-ms", type=int, default=1050, help="Settling time for final screenshots, in milliseconds")
    args = parser.parse_args()
    if args.montage and not args.output:
        parser.error("--montage requires --output.")
    if not args.html.is_file():
        parser.error(f"HTML file was not found: {args.html}")
    if args.chromium and not args.chromium.is_file():
        parser.error(f"Chromium executable was not found: {args.chromium}")
    if args.settle_ms < 0:
        parser.error("--settle-ms must not be negative.")

    try:
        from playwright.sync_api import Error, expect, sync_playwright
    except ImportError:
        parser.exit(2, "Install Playwright first: python -m pip install playwright\n")

    output = args.output.resolve() if args.output else None
    if output:
        output.mkdir(parents=True, exist_ok=True)
    traffic, errors = set(), set()
    url = args.html.resolve().as_uri()
    try:
        with sync_playwright() as playwright:
            try:
                options = {"executable_path": args.chromium.resolve()} if args.chromium else {}
                browser = playwright.chromium.launch(**options)
            except Error as error:
                raise RuntimeError("Could not launch Chromium. Run python -m playwright install chromium or use --chromium PATH.") from error
            try:
                count, frames = desktop(browser, url, expect, traffic, errors, output, args.settle_ms)
                reduced_motion(browser, url, expect, traffic, errors, args.settle_ms)
                portrait(browser, url, expect, traffic, errors, output, args.settle_ms)
            finally:
                browser.close()
        if traffic or errors:
            raise AssertionError("The offline deck requested subresources or raised browser errors.")
        if args.montage:
            make_montage(frames, output)
    except (AssertionError, Error, RuntimeError, ValueError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        for item in sorted(traffic):
            print(f"  subresource: {item}", file=sys.stderr)
        for item in sorted(errors):
            print(f"  browser: {item}", file=sys.stderr)
        return 1

    print(f"PASS: {count} slides, incremental keyboard and timeline navigation, reduced motion, portrait, zero subresource requests and browser errors.")
    if output:
        print(f"Screenshots: {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
