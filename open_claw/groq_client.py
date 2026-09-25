"""
OpenClaw Groq Client

Free-cloud inference adapter using Groq's OpenAI-compatible chat completions API.
Secrets are read only from environment variables and must never be committed.
"""

import json
import os
import time
from typing import Any, Dict, Generator, Optional

import requests
from rich.console import Console

console = Console()


class GroqClient:
    provider = "groq"

    def __init__(
        self,
        model: str = "openai/gpt-oss-120b",
        api_key: Optional[str] = None,
        base_url: str = "https://api.groq.com/openai/v1",
        timeout: int = 90,
        max_retries: int = 3,
    ):
        self.model = model
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Create a free Groq API key and store it "
                "as an environment variable; never commit it to Git."
            )

    def _request(self, payload: Dict[str, Any], stream: bool = False) -> requests.Response:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout,
                    stream=stream,
                )

                if response.status_code == 429 or response.status_code >= 500:
                    retry_after = response.headers.get("retry-after")
                    delay = float(retry_after) if retry_after else min(2 ** attempt, 8)
                    if attempt < self.max_retries - 1:
                        time.sleep(delay)
                        continue

                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_error = exc
                if attempt < self.max_retries - 1:
                    time.sleep(min(2 ** attempt, 8))
                    continue

        raise RuntimeError(f"Groq request failed after retries: {last_error}")

    def chat(
        self,
        messages: list,
        stream: bool = True,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        try:
            response = self._request(payload)
            body = response.json()
            return body["choices"][0]["message"]["content"]
        except Exception as exc:
            console.print(f"[red]Groq error: {exc}[/red]")
            return f"ERROR: {exc}"

    def stream_chat(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> Generator[str, None, None]:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        try:
            with self._request(payload, stream=True) as response:
                for line in response.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data:"):
                        continue

                    data = line[5:].strip()
                    if data == "[DONE]":
                        break

                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
        except Exception as exc:
            yield f"ERROR: {exc}"

    def generate_improvement(
        self,
        current_prompt: str,
        performance_score: float,
        memory_summary: str,
    ) -> str:
        system = """You are OpenClaw's self-improvement engine.
Analyze the current system prompt, recent performance, and memory.
Output a revised system prompt that improves tool use, reliability, creativity,
safety and efficiency. Output only the revised system prompt."""

        user_msg = f"""Current Performance Score: {performance_score}/100
Memory Summary (last 10 cycles): {memory_summary}

Current System Prompt:
{current_prompt}

Generate an improved version:"""

        return self.chat(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.8,
        )

    def reflect_and_score(self, action_log: str) -> Dict[str, Any]:
        system = (
            "You are a rigorous AI performance evaluator. "
            "Score 0-100 and give 3 concrete improvement suggestions."
        )
        user = f"""Action log from last cycle:
{action_log}

Return JSON:
{{
  "score": <integer 0-100>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "improvements": ["...", "...", "..."]
}}"""

        response = self.chat(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )

        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].lstrip()

        try:
            return json.loads(cleaned)
        except Exception:
            return {
                "score": 50,
                "improvements": ["Improve reflection JSON reliability"],
                "error": "parse_failed",
            }
