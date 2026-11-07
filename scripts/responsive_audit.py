#!/usr/bin/env python3
"""Playwright viewport audit for Flodoro."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get("FLODORO_URL", "http://127.0.0.1:8765/")
OUT_DIR = Path(os.environ.get("AUDIT_OUT", "/opt/cursor/artifacts/responsive-before"))

VIEWPORTS = [
    ("phone-small", 360, 640),
    ("iphone-14", 390, 844),
    ("phone-large", 430, 932),
    ("phone-small-landscape", 640, 360),
    ("iphone-landscape", 844, 390),
    ("phone-large-landscape", 932, 430),
    ("ipad-portrait", 768, 1024),
    ("ipad-landscape", 1024, 768),
    ("ipad-pro-portrait", 1024, 1366),
    ("ipad-pro-landscape", 1366, 1024),
    ("laptop-1280", 1280, 800),
    ("laptop-1440", 1440, 900),
    ("desktop-1080", 1920, 1080),
    ("desktop-1440", 2560, 1440),
]


def audit_page(page, name: str, width: int, height: int) -> dict:
    page.set_viewport_size({"width": width, "height": height})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(400)

    metrics = page.evaluate(
        """() => {
      const doc = document.documentElement;
      const body = document.body;
      const hScroll = doc.scrollWidth > doc.clientWidth + 1;
      const vScroll = doc.scrollHeight > doc.clientHeight + 1;
      const viewportMeta = document.querySelector('meta[name=viewport]')?.getAttribute('content') ?? '';
      const targets = [];
      document.querySelectorAll('button, a, [role=button]').forEach((el) => {
        if (el.offsetParent === null && !el.closest('.slideout:not(.hidden)')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const minSide = Math.min(r.width, r.height);
        if (minSide < 44) {
          targets.push({
            tag: el.tagName,
            id: el.id || null,
            label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 40) || '',
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      });
      const clipped = [];
      ['.app-navbar', '.main-content', '.timer-display', '.site-credit', '#settings-panel'].forEach((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) {
          clipped.push({sel, left: r.left, top: r.top, right: r.right, bottom: r.bottom, vw: innerWidth, vh: innerHeight});
        }
      });
      return {hScroll, vScroll, viewportMeta, smallTargets: targets.slice(0, 25), clipped};
    }"""
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(OUT_DIR / f"{name}.png"), full_page=False)

    page.click("#settings-button")
    page.wait_for_timeout(350)
    panel_open = not page.locator("#settings-panel").evaluate(
        "el => el.classList.contains('hidden')"
    )
    page.screenshot(path=str(OUT_DIR / f"{name}-settings-panel.png"), full_page=False)
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)

    return {
        "name": name,
        "width": width,
        "height": height,
        "panel_opened": panel_open,
        **metrics,
    }


def main() -> int:
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for item in VIEWPORTS:
            name, w, h = item
            try:
                results.append(audit_page(page, name, w, h))
            except Exception as exc:  # noqa: BLE001
                results.append({"name": name, "error": str(exc)})
        browser.close()

    report_path = OUT_DIR / "audit.json"
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
