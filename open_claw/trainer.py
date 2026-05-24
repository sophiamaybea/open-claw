"""
OpenClaw Training Orchestrator
Manages the infinite self-improvement loop.
"""

import time
import signal
import sys
from rich.console import Console
from rich.live import Live
from rich.table import Table

from .core import OpenClawAgent

console = Console()

class Trainer:
    def __init__(self, model: str = "llama3.2:3b", max_iterations: int = 1000, self_improve: bool = True):
        self.agent = OpenClawAgent(model=model)
        self.max_iterations = max_iterations
        self.self_improve = self_improve
        self.running = True
        
        signal.signal(signal.SIGINT, self._shutdown)

    def _shutdown(self, signum, frame):
        console.print("\n[bold red]Training interrupted. Saving state...[/bold red]")
        self.agent.save_state()
        self.running = False
        sys.exit(0)

    def start(self):
        console.print(Panel.fit(
            "[bold green]🚀 OPENCLAW TRAINING STARTED[/bold green]\n"
            f"Model: {self.agent.model}\n"
            f"Max Iterations: {self.max_iterations}\n"
            f"Self-Improvement: {'ENABLED' if self.self_improve else 'DISABLED'}",
            title="OpenClaw v0.1.0 - Singularity Engine Online",
            border_style="bright_blue"
        ))

        for i in range(self.max_iterations):
            if not self.running:
                break
            self.agent.run_cycle()
            
            if i % 10 == 0:
                self._show_status()

            time.sleep(1.5)

        console.print(Panel("[bold green]Training complete. OpenClaw is now significantly more powerful.[/bold green]"))
        self.agent.save_state()

    def _show_status(self):
        table = Table(title="OpenClaw Status")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        table.add_row("Current Cycle", str(self.agent.cycle))
        table.add_row("Performance Score", f"{self.agent.performance:.1f}/100")
        table.add_row("Evolved Prompts", str(len(self.agent.memory.get_recent_experiences(100))))
        table.add_row("Skills Created", str(len(self.agent.memory.get_all_skills())))
        console.print(table)