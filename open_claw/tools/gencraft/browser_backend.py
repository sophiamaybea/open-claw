from __future__ import annotations

import hashlib
import re
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlparse

from .config import GencraftConfig


class GencraftError(RuntimeError):
    """Raised when the Gencraft browser adapter cannot complete a requested action."""


@dataclass
class GenerationResult:
    prompt: str
    mode: str
    files: list[str]
    source_urls: list[str]
    page_url: str
    elapsed_seconds: float
    backend: str = "browser"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class GencraftBrowserBackend:
    """Browser-backed Gencraft adapter using the public web UI."""

    def __init__(self, config: GencraftConfig):
        self.config = config

    @staticmethod
    def _playwright():
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:
            raise GencraftError(
                "Playwright is not installed. Run `pip install playwright` then "
                "`python -m playwright install chromium`."
            ) from exc
        return sync_playwright

    def auth(self, *, timeout_seconds: int = 600) -> Path:
        state_path = self.config.state_file()
        state_path.parent.mkdir(parents=True, exist_ok=True)
        sync_playwright = self._playwright()
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context()
            page = context.new_page()
            page.goto(self.config.generate_url, wait_until="domcontentloaded", timeout=self.config.timeout_ms)
            print("\nLog in to Gencraft in the browser window.")
            print("When the Generate page is ready, return here and press Enter.\n")
            input()
            try:
                page.goto(self.config.generate_url, wait_until="networkidle", timeout=self.config.timeout_ms)
            except Exception:
                page.goto(self.config.generate_url, wait_until="domcontentloaded", timeout=self.config.timeout_ms)
            context.storage_state(path=str(state_path))
            browser.close()
        try:
            state_path.chmod(0o600)
        except OSError:
            pass
        return state_path

    def doctor(self) -> dict[str, Any]:
        state = self.config.state_file()
        result = {
            "backend": "browser",
            "generate_url": self.config.generate_url,
            "state_path": str(state),
            "state_exists": state.exists(),
            "playwright_importable": True,
        }
        try:
            self._playwright()
        except GencraftError:
            result["playwright_importable"] = False
        return result

    @staticmethod
    def _visible_media_urls(page) -> set[str]:
        urls: set[str] = set()
        for selector in ("img", "video", "video source"):
            for node in page.locator(selector).all():
                try:
                    if selector != "video source" and not node.is_visible():
                        continue
                    if selector != "video source":
                        box = node.bounding_box()
                        if not box or box["width"] < 180 or box["height"] < 180:
                            continue
                    src = node.get_attribute("src") or node.get_attribute("data-src")
                    if src and not src.startswith("data:") and not src.startswith("blob:"):
                        urls.add(src)
                except Exception:
                    continue
        return urls

    @staticmethod
    def _find_prompt_input(page):
        candidates = [
            page.get_by_placeholder(re.compile(r"prompt", re.I)),
            page.locator("textarea"),
            page.locator('[contenteditable="true"]'),
        ]
        for candidate in candidates:
            try:
                if candidate.count() and candidate.first.is_visible():
                    return candidate.first
            except Exception:
                continue
        raise GencraftError("Could not locate Gencraft's prompt input. The web UI may have changed.")

    @staticmethod
    def _click_named(page, pattern: str, *, required: bool = False) -> bool:
        regex = re.compile(pattern, re.I)
        candidates = [page.get_by_role("button", name=regex), page.get_by_text(regex, exact=False)]
        for candidate in candidates:
            try:
                if candidate.count() and candidate.first.is_visible():
                    candidate.first.click()
                    return True
            except Exception:
                continue
        if required:
            raise GencraftError(f"Could not find a visible control matching /{pattern}/i.")
        return False

    def _configure_mode(self, page, mode: str) -> None:
        if mode == "image":
            self._click_named(page, r"^image(?: gen)?$", required=False)
        elif mode == "video":
            if not self._click_named(page, r"video(?: gen)?", required=False):
                raise GencraftError("Could not locate Gencraft's Video Gen control.")
        else:
            raise GencraftError(f"Unsupported mode: {mode}")

    def _configure_reference(self, page, reference: Path) -> None:
        if not reference.exists():
            raise GencraftError(f"Reference image does not exist: {reference}")
        self._click_named(page, r"sketch guide|reference image|image to image", required=False)
        inputs = page.locator('input[type="file"]')
        if not inputs.count():
            raise GencraftError("Could not locate a file upload control for the reference image.")
        inputs.first.set_input_files(str(reference))

    def _configure_negative_prompt(self, page, negative_prompt: str) -> None:
        labelled = page.get_by_label(re.compile(r"negative prompt", re.I))
        if labelled.count() and labelled.first.is_visible():
            labelled.first.fill(negative_prompt)
            return
        if self._click_named(page, r"negative prompt|advanced", required=False):
            labelled = page.get_by_label(re.compile(r"negative prompt", re.I))
            if labelled.count() and labelled.first.is_visible():
                labelled.first.fill(negative_prompt)
                return
            placeholders = page.get_by_placeholder(re.compile(r"negative", re.I))
            if placeholders.count() and placeholders.first.is_visible():
                placeholders.first.fill(negative_prompt)
                return
        raise GencraftError("Negative-prompt field was requested but could not be located.")

    def _configure_named_option(self, page, label: str, value: str) -> None:
        if not value:
            return
        if not self._click_named(page, re.escape(label), required=False):
            raise GencraftError(f"Could not locate {label} selector.")
        option = page.get_by_text(re.compile(rf"^{re.escape(value)}$", re.I), exact=True)
        if not option.count():
            option = page.get_by_text(re.compile(re.escape(value), re.I), exact=False)
        if option.count() and option.first.is_visible():
            option.first.click()
            return
        raise GencraftError(f"Could not locate {label} option: {value}")

    @staticmethod
    def _download(page, urls: Iterable[str], output_dir: Path, limit: int = 4) -> tuple[list[str], list[str]]:
        output_dir.mkdir(parents=True, exist_ok=True)
        files: list[str] = []
        used_urls: list[str] = []
        for url in urls:
            if len(files) >= limit:
                break
            try:
                response = page.request.get(url, timeout=60_000)
                if not response.ok:
                    continue
                content_type = (response.headers.get("content-type") or "").lower()
                body = response.body()
                if not body or not (content_type.startswith("image/") or content_type.startswith("video/")):
                    continue
                ext = {
                    "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp",
                    "video/mp4": ".mp4", "video/webm": ".webm",
                }.get(content_type.split(";")[0])
                if not ext:
                    suffix = Path(urlparse(url).path).suffix.lower()
                    ext = suffix if suffix in {".png", ".jpg", ".jpeg", ".webp", ".mp4", ".webm"} else ".bin"
                digest = hashlib.sha256(body).hexdigest()[:12]
                out = output_dir / f"gencraft-{digest}{ext}"
                out.write_bytes(body)
                files.append(str(out.resolve()))
                used_urls.append(url)
            except Exception:
                continue
        return files, used_urls

    def generate(self, prompt: str, *, mode: str = "image", negative_prompt: str | None = None,
                 model: str | None = None, style: str | None = None, reference: Path | None = None,
                 output_dir: Path | None = None, headless: bool | None = None,
                 wait_seconds: int = 180) -> GenerationResult:
        if not prompt.strip():
            raise GencraftError("Prompt cannot be empty.")
        state_path = self.config.state_file()
        if not state_path.exists():
            raise GencraftError(f"No authentication state found at {state_path}. Run `gencraft auth` first.")
        output_dir = (output_dir or self.config.output_path()).resolve()
        start = time.monotonic()
        sync_playwright = self._playwright()
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.config.headless if headless is None else headless)
            context = browser.new_context(storage_state=str(state_path), accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(self.config.timeout_ms)
            page.goto(self.config.generate_url, wait_until="domcontentloaded")
            if page.get_by_text(re.compile(r"^log in$", re.I), exact=True).count():
                browser.close()
                raise GencraftError("Gencraft session appears logged out. Run `gencraft auth` again.")
            self._configure_mode(page, mode)
            if reference:
                self._configure_reference(page, reference)
            if model:
                self._configure_named_option(page, "model", model)
            if style:
                self._configure_named_option(page, "style", style)
            if negative_prompt:
                self._configure_negative_prompt(page, negative_prompt)
            prompt_input = self._find_prompt_input(page)
            try:
                prompt_input.fill(prompt)
            except Exception:
                prompt_input.click()
                page.keyboard.press("Control+A")
                page.keyboard.type(prompt)
            before = self._visible_media_urls(page)
            self._click_named(page, r"^generate$", required=True)
            deadline = time.monotonic() + wait_seconds
            new_urls: list[str] = []
            while time.monotonic() < deadline:
                page.wait_for_timeout(2_000)
                current = self._visible_media_urls(page)
                delta = [u for u in current if u not in before]
                if delta:
                    page.wait_for_timeout(4_000)
                    current = self._visible_media_urls(page)
                    new_urls = [u for u in current if u not in before]
                    break
            if not new_urls:
                debug_dir = output_dir / "debug"
                debug_dir.mkdir(parents=True, exist_ok=True)
                shot = debug_dir / f"gencraft-failure-{int(time.time())}.png"
                try:
                    page.screenshot(path=str(shot), full_page=True)
                except Exception:
                    pass
                browser.close()
                raise GencraftError("Generation was submitted, but no new downloadable media was detected before timeout. "
                                    f"A debug screenshot may be available at {shot}.")
            files, source_urls = self._download(page, new_urls, output_dir)
            page_url = page.url
            browser.close()
        if not files:
            raise GencraftError("Gencraft produced media in the page, but the CLI could not download it.")
        return GenerationResult(prompt=prompt, mode=mode, files=files, source_urls=source_urls,
                                page_url=page_url, elapsed_seconds=round(time.monotonic() - start, 3))
