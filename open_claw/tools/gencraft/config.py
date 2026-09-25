from __future__ import annotations

import json
import os
from dataclasses import dataclass, asdict
from pathlib import Path

APP_DIR = Path(os.environ.get("OPENCLAW_HOME", Path.home() / ".config" / "openclaw")) / "gencraft"
DEFAULT_STATE_PATH = APP_DIR / "storage-state.json"
DEFAULT_CONFIG_PATH = APP_DIR / "config.json"
DEFAULT_OUTPUT_DIR = Path.cwd() / "gencraft-output"


@dataclass
class GencraftConfig:
    base_url: str = "https://gencraft.com"
    generate_path: str = "/generate"
    state_path: str = str(DEFAULT_STATE_PATH)
    output_dir: str = str(DEFAULT_OUTPUT_DIR)
    timeout_ms: int = 120_000
    headless: bool = True

    @property
    def generate_url(self) -> str:
        return f"{self.base_url.rstrip('/')}{self.generate_path}"

    @classmethod
    def load(cls, path: Path | None = None) -> "GencraftConfig":
        path = path or DEFAULT_CONFIG_PATH
        if not path.exists():
            return cls()
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls(**{**asdict(cls()), **data})

    def save(self, path: Path | None = None) -> Path:
        path = path or DEFAULT_CONFIG_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(asdict(self), indent=2) + "\n", encoding="utf-8")
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
        return path

    def state_file(self) -> Path:
        return Path(os.path.expanduser(self.state_path)).resolve()

    def output_path(self) -> Path:
        return Path(os.path.expanduser(self.output_dir)).resolve()
