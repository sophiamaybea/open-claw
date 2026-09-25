"""Command line control surface for the OpenClaw shared data plane."""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict

from rich.console import Console
from rich.table import Table

from .data_plane import DataPlane, DataPlaneError

console = Console()


def _json(value: str) -> Dict[str, Any]:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise argparse.ArgumentTypeError(str(exc)) from exc
    if not isinstance(parsed, dict):
        raise argparse.ArgumentTypeError("Expected a JSON object.")
    return parsed


def _table(title: str, rows, columns):
    table = Table(title=title)
    for heading, _ in columns:
        table.add_column(heading)
    for row in rows:
        table.add_row(*[str(row.get(key, "") if row.get(key) is not None else "") for _, key in columns])
    console.print(table)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="openclaw", description="OpenClaw shared CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("status", help="Show shared data-plane status")

    mem = sub.add_parser("memory", help="Read/write shared memory")
    mem_sub = mem.add_subparsers(dest="memory_command", required=True)
    m_add = mem_sub.add_parser("add")
    m_add.add_argument("--kind", required=True)
    m_add.add_argument("--title", required=True)
    m_add.add_argument("--summary")
    m_add.add_argument("--content", type=_json, default={})
    m_add.add_argument("--confidence", type=float, default=0.5)
    m_add.add_argument("--source", default="cli")
    m_search = mem_sub.add_parser("search")
    m_search.add_argument("query")
    m_search.add_argument("--limit", type=int, default=20)

    tasks = sub.add_parser("tasks", help="Manage task queue")
    tasks_sub = tasks.add_subparsers(dest="tasks_command", required=True)
    t_list = tasks_sub.add_parser("list")
    t_list.add_argument("--status")
    t_list.add_argument("--limit", type=int, default=50)
    t_add = tasks_sub.add_parser("add")
    t_add.add_argument("title")
    t_add.add_argument("--priority", type=int, default=50)
    t_add.add_argument("--context", type=_json, default={})

    results = sub.add_parser("results", help="Read/write results")
    results_sub = results.add_subparsers(dest="results_command", required=True)
    r_list = results_sub.add_parser("list")
    r_list.add_argument("--limit", type=int, default=50)
    r_add = results_sub.add_parser("add")
    r_add.add_argument("--title", required=True)
    r_add.add_argument("--content", type=_json, required=True)
    r_add.add_argument("--type", default="result")
    r_add.add_argument("--task-id")
    r_add.add_argument("--verification", default="unverified")

    events = sub.add_parser("events", help="Inspect audit/event stream")
    events_sub = events.add_subparsers(dest="events_command", required=True)
    e_tail = events_sub.add_parser("tail")
    e_tail.add_argument("--limit", type=int, default=30)

    gh = sub.add_parser("github", help="Sync GitHub activity into the shared event stream")
    gh_sub = gh.add_subparsers(dest="github_command", required=True)
    gh_sync = gh_sub.add_parser("sync")
    gh_sync.add_argument("--repo", default=os.getenv("OPENCLAW_GITHUB_REPO", "sophiamaybea/open-claw"))
    gh_sync.add_argument("--limit", type=int, default=20)

    return parser


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        dp = DataPlane.from_env(required=True)

        if args.command == "status":
            rows = [
                {"resource": "tasks", "visible": len(dp.tasks(limit=100))},
                {"resource": "results", "visible": len(dp.results(limit=100))},
                {"resource": "memory", "visible": len(dp.memory_list(limit=100))},
                {"resource": "events", "visible": len(dp.latest_events(limit=100))},
            ]
            _table("OpenClaw data plane", rows, [("Resource", "resource"), ("Rows (first 100)", "visible")])
            return 0

        if args.command == "memory":
            if args.memory_command == "add":
                row = dp.add_memory(
                    kind=args.kind,
                    title=args.title,
                    summary=args.summary,
                    content=args.content,
                    confidence=args.confidence,
                    source=args.source,
                )
                console.print(f"[green]Memory written[/green] {row['id']}")
            else:
                rows = dp.memory_search(args.query, args.limit)
                _table("Memory", rows, [("Kind", "kind"), ("Title", "title"), ("Summary", "summary"), ("Status", "status"), ("Updated", "updated_at")])
            return 0

        if args.command == "tasks":
            if args.tasks_command == "add":
                row = dp.add_task(args.title, priority=args.priority, context=args.context)
                console.print(f"[green]Task created[/green] {row['id']}")
            else:
                rows = dp.tasks(status=args.status, limit=args.limit)
                _table("Tasks", rows, [("Title", "title"), ("Status", "status"), ("Priority", "priority"), ("Source", "source"), ("Updated", "updated_at")])
            return 0

        if args.command == "results":
            if args.results_command == "add":
                row = dp.add_result(
                    title=args.title,
                    content=args.content,
                    result_type=args.type,
                    task_id=args.task_id,
                    verification_status=args.verification,
                )
                console.print(f"[green]Result written[/green] {row['id']}")
            else:
                rows = dp.results(args.limit)
                _table("Results", rows, [("Title", "title"), ("Type", "result_type"), ("Verification", "verification_status"), ("Score", "score"), ("Created", "created_at")])
            return 0

        if args.command == "events":
            rows = dp.latest_events(args.limit)
            _table("Events", rows, [("When", "created_at"), ("Source", "source"), ("Type", "event_type"), ("Entity", "entity_type"), ("Ref", "source_ref")])
            return 0

        if args.command == "github" and args.github_command == "sync":
            count = dp.sync_github(args.repo, args.limit)
            console.print(f"[green]GitHub sync complete[/green]: {count} new commit event(s)")
            return 0

        parser.error("Unknown command")
        return 2
    except DataPlaneError as exc:
        console.print(f"[bold red]OpenClaw data-plane error:[/bold red] {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
