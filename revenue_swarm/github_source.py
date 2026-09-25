from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request

from .models import Opportunity

API = "https://api.github.com/search/issues"

AGENT_QUERIES: dict[str, tuple[str, ...]] = {
    "atlas": (
        'is:issue is:open label:bounty',
        'is:issue is:open "bounty" in:title',
    ),
    "ada": (
        'is:issue is:open "$" "python" in:title,body',
        'is:issue is:open "$" "algorithm" in:title,body',
    ),
    "curie": (
        'is:issue is:open "$" "data" in:title,body',
        'is:issue is:open "$" "research" in:title,body',
    ),
    "turing": (
        'is:issue is:open "$" "bug" in:title,body',
        'is:issue is:open "$" "regression" in:title,body',
    ),
    "faraday": (
        'is:issue is:open "$" "performance" in:title,body',
        'is:issue is:open "$" "optimization" in:title,body',
    ),
}


def _request_json(url: str) -> dict:
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "openclaw-revenue-swarm-v2",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def search(query: str, agent: str, per_page: int = 30) -> list[Opportunity]:
    params = urllib.parse.urlencode(
        {"q": query, "per_page": min(max(per_page, 1), 100), "sort": "updated", "order": "desc"}
    )
    data = _request_json(f"{API}?{params}")
    opportunities: list[Opportunity] = []

    for item in data.get("items", []):
        labels = [
            label.get("name", "")
            for label in item.get("labels", [])
            if isinstance(label, dict) and label.get("name")
        ]
        repo_url = item.get("repository_url", "")
        repository = repo_url.removeprefix("https://api.github.com/repos/")
        opportunities.append(
            Opportunity(
                id=f"github:{item.get('id')}",
                source="github",
                source_url=item.get("html_url", ""),
                title=item.get("title", ""),
                body=item.get("body") or "",
                repository=repository,
                comments=int(item.get("comments") or 0),
                created_at=item.get("created_at"),
                updated_at=item.get("updated_at"),
                labels=labels,
                discovered_by=agent,
            )
        )
    return opportunities


def discover_all() -> list[Opportunity]:
    deduped: dict[str, Opportunity] = {}
    for agent, queries in AGENT_QUERIES.items():
        for query in queries:
            try:
                results = search(query, agent=agent)
            except Exception:
                continue
            for opportunity in results:
                deduped.setdefault(opportunity.source_url, opportunity)
    return list(deduped.values())
