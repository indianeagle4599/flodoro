#!/usr/bin/env python3
"""Capture home + settings screenshots for PR3 verification."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.environ.get("FLODORO_URL", "http://127.0.0.1:8765/")
OUT_DIR = Path(
    os.environ.get(
        "CAPTURE_OUT",
        "/cursor/stores/self/artifacts/flodoro-responsive-pr3",
    )
)
MOBILE_MAX_W = 932

SHOTS = [
    ("360x640", 360, 640),
    ("390x844", 390, 844),
    ("430x932", 430, 932),
    ("640x360", 640, 360),
    ("844x390", 844, 390),
    ("932x430", 932, 430),
    ("768x1024", 768, 1024),
    ("1024x768", 1024, 768),
    ("1440x900", 1440, 900),
    ("1920x1080", 1920, 1080),
]

PANEL_CHECK_JS = r"""
() => {
  const panel = document.querySelector('#settings-panel');
  if (!panel || panel.classList.contains('hidden')) return { open: false };
  const r = panel.getBoundingClientRect();
  const save = document.querySelector('#save-settings');
  const sr = save ? save.getBoundingClientRect() : null;
  return {
    open: true,
    panel: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
    saveVisible: sr ? sr.top >= 0 && sr.bottom <= innerHeight + 0.5 : false,
    vw: innerWidth,
    vh: innerHeight,
  };
}
"""


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, w, h in SHOTS:
            mobile = w <= MOBILE_MAX_W
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                is_mobile=mobile,
                has_touch=mobile,
            )
            page = ctx.new_page()
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(250)
            page.screenshot(path=str(OUT_DIR / f"{name}-home.png"), full_page=False)
            page.click("#settings-button")
            page.wait_for_timeout(400)
            meta = page.evaluate(PANEL_CHECK_JS)
            page.screenshot(path=str(OUT_DIR / f"{name}-settings.png"), full_page=False)
            page.keyboard.press("Escape")
            ctx.close()
            report.append({"name": name, "width": w, "height": h, "mobile": mobile, **meta})
        browser.close()

    (OUT_DIR / "capture.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
