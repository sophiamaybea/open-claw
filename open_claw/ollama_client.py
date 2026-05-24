"""
OpenClaw Ollama Client
Robust interface for local Ollama models with streaming, retries, and self-diagnostics.
"""

import ollama
import time
import json
from typing import Generator, Optional, Dict, Any
from rich.console import Console
from rich.live import Live
from rich.markdown import Markdown

console = Console()

class OllamaClient:
    def __init__(self, model: str = "llama3.2:3b", host: str = "http://localhost:11434"):
        self.model = model
        self.host = host
        self.client = ollama.Client(host=host)
        self._ensure_model()

    def _ensure_model(self):
        try:
            models = self.client.list()
            model_names = [m['name'] for m in models.get('models', [])]
            if self.model not in model_names:
                console.print(f"[yellow]Pulling model {self.model}... (this may take a while)[/yellow]")
                self.client.pull(self.model)
        except Exception as e:
            console.print(f"[red]Ollama connection error: {e}[/red]")
            console.print("[bold]Please run: ollama serve[/bold]")

    def chat(self, messages: list, stream: bool = True, temperature: float = 0.7, max_tokens: int = 4096) -> str:
        """Non-streaming chat for simplicity in training loop"""
        try:
            response = self.client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
                stream=False
            )
            return response['message']['content']
        except Exception as e:
            console.print(f"[red]Ollama error: {e}[/red]")
            return f"ERROR: {str(e)}"

    def stream_chat(self, messages: list, temperature: float = 0.7) -> Generator[str, None, None]:
        """Streaming response with live display"""
        try:
            stream = self.client.chat(
                model=self.model,
                messages=messages,
                options={"temperature": temperature},
                stream=True
            )
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                    yield chunk['message']['content']
        except Exception as e:
            yield f"ERROR: {str(e)}"

    def generate_improvement(self, current_prompt: str, performance_score: float, memory_summary: str) -> str:
        """Specialized prompt for self-improvement"""
        system = """You are OpenClaw's self-improvement engine. 
        Analyze the current system prompt, recent performance, and memory.
        Then output a NEW, IMPROVED version of the system prompt that will make the agent:
        - More intelligent
        - Better at tool use
        - More creative in self-evolution
        - Safer and more efficient

        Output ONLY the new system prompt. No explanations."""

        user_msg = f"""Current Performance Score: {performance_score}/100
Memory Summary (last 10 cycles): {memory_summary}

Current System Prompt:
{current_prompt}

Generate a significantly improved version:"""

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg}
        ]
        return self.chat(messages, temperature=0.8)

    def reflect_and_score(self, action_log: str) -> Dict[str, Any]:
        """Self-reflection: score performance and suggest improvements"""
        system = "You are a brutally honest AI performance evaluator. Score 0-100 and give 3 concrete improvement suggestions."

        user = f"""Action log from last cycle:
{action_log}

Return JSON:
{{
  "score": <integer 0-100>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "improvements": ["...", "...", "..."]
}}"""

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ]
        response = self.chat(messages, temperature=0.3)
        try:
            return json.loads(response)
        except:
            return {"score": 50, "improvements": ["Improve reflection quality"], "error": "parse_failed"}