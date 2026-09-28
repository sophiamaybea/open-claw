"""
OpenClaw model-provider selection.

Selection order in auto mode:
1. Groq cloud when GROQ_API_KEY exists.
2. Local Ollama otherwise.

This keeps cloud inference free-by-default while preserving local fallback.
"""

import os
from typing import Optional

from .groq_client import GroqClient
from .ollama_client import OllamaClient

DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"
DEFAULT_OLLAMA_MODEL = "llama3.2:3b"


def _looks_like_ollama_model(model: Optional[str]) -> bool:
    return bool(model and ":" in model)


def create_model_client(
    provider: Optional[str] = None,
    model: Optional[str] = None,
):
    selected = (provider or os.getenv("OPENCLAW_PROVIDER", "auto")).strip().lower()

    if selected == "auto":
        selected = "groq" if os.getenv("GROQ_API_KEY") else "ollama"

    if selected == "groq":
        groq_model = os.getenv("GROQ_MODEL")
        if not groq_model:
            groq_model = (
                model
                if model and not _looks_like_ollama_model(model)
                else DEFAULT_GROQ_MODEL
            )
        return GroqClient(model=groq_model)

    if selected == "ollama":
        ollama_model = os.getenv("OLLAMA_MODEL") or model or DEFAULT_OLLAMA_MODEL
        return OllamaClient(
            model=ollama_model,
            host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
        )

    raise ValueError(
        f"Unsupported OPENCLAW_PROVIDER={selected!r}. "
        "Supported providers: auto, groq, ollama."
    )
