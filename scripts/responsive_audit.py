#!/usr/bin/env python3
"""Visual layout audit for Flodoro (overlap, clipping, horizontal scroll)."""
from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.environ.get("FLODORO_URL", "http://127.0.0.1:8765/")
OUT_DIR = Path(os.environ.get("AUDIT_OUT", "/opt/cursor/artifacts/responsive-verify"))

VIEWPORTS = [
    ("phone-small", 360, 640),
    ("iphone-14", 390, 844),
    ("phone-large", 430, 932),
    ("phone-small-landscape", 640, 360),
    ("iphone-landscape", 844, 390),
    ("phone-large-landscape", 932, 430),
    ("ipad-portrait", 768, 1024),
    ("ipad-landscape", 1024, 768),
    ("ipad-air-portrait", 820, 1180),
    ("ipad-air-landscape", 1180, 820),
    ("ipad-pro-portrait", 1024, 1366),
    ("ipad-pro-landscape", 1366, 1024),
    ("laptop-1280", 1280, 800),
    ("laptop-1440", 1440, 900),
    ("desktop-1080", 1920, 1080),
    ("desktop-1440", 2560, 1440),
]

MEASURE_JS = r"""
() => {
  const issues = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  if (doc.scrollWidth > vw + 2) {
    issues.push({ kind: 'horizontal-scroll', scrollWidth: doc.scrollWidth, vw });
  }

  function rect(el) {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
  }

  function intersects(a, b) {
    return a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  }

  function overlapArea(a, b) {
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return x * y;
  }

  const timer = document.querySelector('#timer-display');
  const credit = document.querySelector('.site-credit');
  const controls = document.querySelector('#controls');
  const add = document.querySelector('#add-minute');
  const sub = document.querySelector('#subtract-minute');

  const checkClip = (sel, id) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const r = rect(el);
    if (r.bottom > vh - 0.5) {
      issues.push({ kind: 'clipped-bottom', id, bottom: r.bottom, vh, amount: r.bottom - vh });
    }
    if (r.top < 0) issues.push({ kind: 'clipped-top', id, top: r.top });
    if (r.right > vw + 0.5) issues.push({ kind: 'clipped-right', id, right: r.right, vw });
    if (r.left < 0) issues.push({ kind: 'clipped-left', id, left: r.left });
  };

  for (const [sel, id] of [
    ['#mode-toggle', 'mode-toggle'],
    ['#mode-main', 'mode-main'],
    ['#mode-sub', 'mode-sub'],
    ['#timer-display', 'timer'],
    ['#controls', 'controls'],
    ['#add-minute', 'add-minute'],
    ['#subtract-minute', 'subtract-minute'],
    ['.site-credit', 'credit'],
  ]) {
    checkClip(sel, id);
  }

  if (timer && credit) {
    const t = rect(timer);
    const c = rect(credit);
    const area = overlapArea(t, c);
    if (intersects(t, c) && area > 120) {
      issues.push({ kind: 'timer-footer-overlap', overlapPx2: Math.round(area), timer: t, credit: c });
    }
  }

  if (add && sub) {
    const a = rect(add);
    const s = rect(sub);
    const sameRow = Math.abs(a.top - s.top) < 8 && Math.abs(a.bottom - s.bottom) < 8;
    const wideBar = a.width > vh * 0.35;
    if (wideBar && !sameRow) {
      issues.push({ kind: 'stacked-wide-adjust', add: a, subtract: s, vw, vh });
    }
  }

  document.querySelectorAll('.settings-group label').forEach((lab) => {
    if (lab.scrollWidth > lab.clientWidth + 1) {
      issues.push({
        kind: 'label-truncated',
        text: lab.textContent.trim().slice(0, 80),
        scrollWidth: lab.scrollWidth,
        clientWidth: lab.clientWidth,
      });
    }
  });

  return { vw, vh, issues };
}
"""


def capture(page, name: str, width: int, height: int, with_settings: bool) -> dict:
    page.set_viewport_size({"width": width, "height": height})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(300)
    home = page.evaluate(MEASURE_JS)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(OUT_DIR / f"{name}.png"), full_page=False)

    panel_issues: list = []
    if with_settings:
        page.click("#settings-button")
        page.wait_for_timeout(400)
        panel_issues = page.evaluate(MEASURE_JS)["issues"]
        page.screenshot(path=str(OUT_DIR / f"{name}-settings-panel.png"), full_page=False)
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)

    return {
        "name": name,
        "width": width,
        "height": height,
        "home_issues": home["issues"],
        "settings_issues": panel_issues,
    }


def main() -> int:
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for name, w, h in VIEWPORTS:
            results.append(capture(page, name, w, h, with_settings=True))
        browser.close()

    out = OUT_DIR / "audit.json"
    out.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
