"""
OpenClaw Persistent Memory System
Stores experiences, skills, evolved prompts, and performance history.
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

class Memory:
    def __init__(self, base_dir: str = "memory"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        
        self.experiences_file = self.base_dir / "experiences.jsonl"
        self.skills_file = self.base_dir / "skills.json"
        self.prompts_file = self.base_dir / "evolved_prompts.json"
        self.performance_file = self.base_dir / "performance.json"
        
        self._init_files()

    def _init_files(self):
        for f in [self.skills_file, self.prompts_file, self.performance_file]:
            if not f.exists():
                f.write_text("[]")

    def log_experience(self, cycle: int, action: str, result: str, score: float, reflection: str):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "cycle": cycle,
            "action": action,
            "result": result[:500],  # truncate
            "score": score,
            "reflection": reflection
        }
        with open(self.experiences_file, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def get_recent_experiences(self, n: int = 10) -> List[Dict]:
        if not self.experiences_file.exists():
            return []
        lines = self.experiences_file.read_text().strip().split("\n")
        return [json.loads(line) for line in lines[-n:] if line.strip()]

    def save_evolved_prompt(self, version: int, prompt: str, score: float):
        data = []
        if self.prompts_file.exists():
            data = json.loads(self.prompts_file.read_text())
        data.append({
            "version": version,
            "prompt": prompt,
            "score": score,
            "timestamp": datetime.now().isoformat()
        })
        self.prompts_file.write_text(json.dumps(data, indent=2))

    def get_best_prompt(self) -> str:
        if not self.prompts_file.exists():
            return "You are OpenClaw, a powerful self-improving AI agent."
        data = json.loads(self.prompts_file.read_text())
        if not data:
            return "You are OpenClaw, a powerful self-improving AI agent."
        best = max(data, key=lambda x: x["score"])
        return best["prompt"]

    def update_skill(self, skill_name: str, code: str, description: str):
        skills = []
        if self.skills_file.exists():
            skills = json.loads(self.skills_file.read_text())
        skills = [s for s in skills if s["name"] != skill_name]
        skills.append({
            "name": skill_name,
            "code": code,
            "description": description,
            "created": datetime.now().isoformat()
        })
        self.skills_file.write_text(json.dumps(skills, indent=2))

    def get_all_skills(self) -> List[Dict]:
        if not self.skills_file.exists():
            return []
        return json.loads(self.skills_file.read_text())