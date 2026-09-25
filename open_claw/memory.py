"""OpenClaw persistent memory.

Local files remain a resilience fallback. When the shared Supabase data plane is
configured, durable experiences, prompts and skills are also written there and
important prompt state can be recovered from it.
"""

import json
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pathlib import Path

from .data_plane import DataPlane, DataPlaneError


DEFAULT_PROMPT = "You are OpenClaw, a powerful self-improving AI agent."


class Memory:
    def __init__(self, base_dir: str = "memory"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

        self.experiences_file = self.base_dir / "experiences.jsonl"
        self.skills_file = self.base_dir / "skills.json"
        self.prompts_file = self.base_dir / "evolved_prompts.json"
        self.performance_file = self.base_dir / "performance.json"
        self.remote: Optional[DataPlane] = DataPlane.from_env(required=False)

        self._init_files()

    def _init_files(self):
        for f in [self.skills_file, self.prompts_file, self.performance_file]:
            if not f.exists():
                f.write_text("[]")

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _remote_event(self, event_type: str, payload: Dict, source_ref: Optional[str] = None):
        if not self.remote:
            return
        try:
            self.remote.record_event(
                event_type,
                payload,
                source="runtime",
                source_ref=source_ref,
            )
        except DataPlaneError:
            # Local memory must continue working during network/auth outages.
            pass

    def log_experience(self, cycle: int, action: str, result: str, score: float, reflection: str):
        entry = {
            "timestamp": self._timestamp(),
            "cycle": cycle,
            "action": action,
            "result": result[:500],
            "score": score,
            "reflection": reflection,
        }
        with open(self.experiences_file, "a") as f:
            f.write(json.dumps(entry) + "\n")

        self._remote_event(
            "experience.logged",
            entry,
            source_ref=f"runtime:experience:{cycle}:{entry['timestamp']}",
        )

    def get_recent_experiences(self, n: int = 10) -> List[Dict]:
        if self.remote:
            try:
                events = self.remote.latest_events(limit=n, event_type="experience.logged")
                if events:
                    return [event.get("payload", {}) for event in reversed(events)]
            except DataPlaneError:
                pass

        if not self.experiences_file.exists():
            return []
        lines = self.experiences_file.read_text().strip().split("\n")
        return [json.loads(line) for line in lines[-n:] if line.strip()]

    def save_evolved_prompt(self, version: int, prompt: str, score: float):
        data = []
        if self.prompts_file.exists():
            data = json.loads(self.prompts_file.read_text())
        item = {
            "version": version,
            "prompt": prompt,
            "score": score,
            "timestamp": self._timestamp(),
        }
        data.append(item)
        self.prompts_file.write_text(json.dumps(data, indent=2))

        if self.remote:
            try:
                self.remote.add_memory(
                    kind="prompt",
                    title=f"OpenClaw prompt v{version}",
                    summary=f"Runtime-evolved prompt with recorded score {score}.",
                    content=item,
                    source="runtime",
                    source_ref=f"runtime:prompt:{version}",
                    confidence=min(max(score / 100.0, 0.0), 1.0),
                    status="hypothesis",
                    freshness_class="medium",
                )
            except DataPlaneError:
                pass

    def get_best_prompt(self) -> str:
        candidates = []

        if self.remote:
            try:
                for row in self.remote.memory_list(kind="prompt", limit=100):
                    content = row.get("content") or {}
                    if "prompt" in content:
                        candidates.append(content)
            except DataPlaneError:
                pass

        if self.prompts_file.exists():
            try:
                candidates.extend(json.loads(self.prompts_file.read_text()))
            except json.JSONDecodeError:
                pass

        if not candidates:
            return DEFAULT_PROMPT

        best = max(candidates, key=lambda x: float(x.get("score", 0)))
        return best.get("prompt") or DEFAULT_PROMPT

    def update_skill(self, skill_name: str, code: str, description: str):
        skills = []
        if self.skills_file.exists():
            skills = json.loads(self.skills_file.read_text())
        skills = [s for s in skills if s["name"] != skill_name]
        item = {
            "name": skill_name,
            "code": code,
            "description": description,
            "created": self._timestamp(),
        }
        skills.append(item)
        self.skills_file.write_text(json.dumps(skills, indent=2))

        if self.remote:
            try:
                self.remote.add_memory(
                    kind="skill",
                    title=skill_name,
                    summary=description,
                    content=item,
                    source="runtime",
                    source_ref=f"runtime:skill:{skill_name}",
                    confidence=0.5,
                    status="hypothesis",
                    freshness_class="medium",
                )
            except DataPlaneError:
                pass

    def get_all_skills(self) -> List[Dict]:
        if not self.skills_file.exists():
            return []
        return json.loads(self.skills_file.read_text())
