"""
OpenClaw - Self-Learning AI Agent Framework
Cloud-capable with Groq and local Ollama model providers.
"""

from .core import OpenClawAgent
from .trainer import Trainer
from .ollama_client import OllamaClient
from .groq_client import GroqClient
from .model_provider import create_model_client
from .memory import Memory

__version__ = "0.1.0"
__all__ = [
    "OpenClawAgent",
    "Trainer",
    "OllamaClient",
    "GroqClient",
    "create_model_client",
    "Memory",
]
