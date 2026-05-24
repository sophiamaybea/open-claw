"""
OpenClaw - Self-Learning AI Agent Framework
Powered by Ollama
"""

from .core import OpenClawAgent
from .trainer import Trainer
from .ollama_client import OllamaClient
from .memory import Memory

__version__ = "0.1.0"
__all__ = ["OpenClawAgent", "Trainer", "OllamaClient", "Memory"]