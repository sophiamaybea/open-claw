#!/usr/bin/env python3
"""
OpenClaw Training Launcher
Usage:
    python scripts/start_training.py --model llama3.2:3b --iterations 500 --self-improve
"""

import argparse
from open_claw.trainer import Trainer

def main():
    parser = argparse.ArgumentParser(description="Start OpenClaw self-training")
    parser.add_argument("--model", default="llama3.2:3b", help="Ollama model name")
    parser.add_argument("--iterations", type=int, default=1000, help="Number of training cycles")
    parser.add_argument("--self-improve", action="store_true", help="Enable recursive self-improvement")
    args = parser.parse_args()

    trainer = Trainer(
        model=args.model,
        max_iterations=args.iterations,
        self_improve=args.self_improve
    )
    trainer.start()

if __name__ == "__main__":
    main()