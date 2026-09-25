from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .browser_backend import GencraftBrowserBackend, GencraftError
from .config import GencraftConfig


def _print_json(data) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="gencraft", description="Experimental Gencraft CLI for OpenClaw.")
    parser.add_argument("--config", type=Path, help="Path to a Gencraft CLI config JSON file.")
    sub = parser.add_subparsers(dest="command", required=True)
    auth = sub.add_parser("auth", help="Log in interactively and save browser session state outside the repo.")
    auth.add_argument("--timeout", type=int, default=600)
    doctor = sub.add_parser("doctor", help="Check Gencraft CLI prerequisites.")
    doctor.add_argument("--json", action="store_true")
    generate = sub.add_parser("generate", help="Generate media with Gencraft.")
    generate.add_argument("prompt")
    generate.add_argument("--mode", choices=["image", "video"], default="image")
    generate.add_argument("--negative", dest="negative_prompt")
    generate.add_argument("--model")
    generate.add_argument("--style")
    generate.add_argument("--reference", type=Path)
    generate.add_argument("--out", dest="output_dir", type=Path)
    generate.add_argument("--show-browser", action="store_true")
    generate.add_argument("--wait", type=int, default=180)
    generate.add_argument("--json", action="store_true")
    cfg = sub.add_parser("config", help="Show or initialise config.")
    cfg.add_argument("--init", action="store_true")
    cfg.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    config = GencraftConfig.load(args.config)
    backend = GencraftBrowserBackend(config)
    try:
        if args.command == "auth":
            print(f"Saved Gencraft browser state to {backend.auth(timeout_seconds=args.timeout)}")
            return 0
        if args.command == "doctor":
            data = backend.doctor()
            if args.json:
                _print_json(data)
            else:
                for key, value in data.items():
                    print(f"{key}: {value}")
            return 0 if data["playwright_importable"] else 2
        if args.command == "config":
            if args.init:
                print(f"Wrote {config.save(args.config)}")
            elif args.json:
                _print_json(config.__dict__)
            else:
                for key, value in config.__dict__.items():
                    print(f"{key}: {value}")
            return 0
        if args.command == "generate":
            result = backend.generate(args.prompt, mode=args.mode, negative_prompt=args.negative_prompt,
                                      model=args.model, style=args.style, reference=args.reference,
                                      output_dir=args.output_dir, headless=not args.show_browser,
                                      wait_seconds=args.wait)
            if args.json:
                _print_json(result.to_dict())
            else:
                print(f"Generated {len(result.files)} file(s):")
                for path in result.files:
                    print(path)
            return 0
    except GencraftError as exc:
        print(f"gencraft: error: {exc}", file=sys.stderr)
        return 1
    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
