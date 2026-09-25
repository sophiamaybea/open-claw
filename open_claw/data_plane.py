"""OpenClaw shared Supabase data plane.

The CLI, runtime and HIVE frontend all read/write the same owner-scoped tables.
No secret/service-role key is required by this client: it authenticates as a
normal Supabase user and relies on RLS.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import requests


class DataPlaneError(RuntimeError):
    pass


@dataclass
class AuthSession:
    access_token: str
    refresh_token: Optional[str] = None


class DataPlane:
    def __init__(
        self,
        url: str,
        publishable_key: str,
        *,
        access_token: Optional[str] = None,
        refresh_token: Optional[str] = None,
        email: Optional[str] = None,
        password: Optional[str] = None,
        timeout: int = 30,
    ):
        self.url = url.rstrip("/")
        self.publishable_key = publishable_key
        self.session = AuthSession(access_token, refresh_token) if access_token else None
        self.email = email
        self.password = password
        self.timeout = timeout

    @classmethod
    def from_env(cls, required: bool = True) -> Optional["DataPlane"]:
        url = os.getenv("OPENCLAW_SUPABASE_URL")
        key = os.getenv("OPENCLAW_SUPABASE_PUBLISHABLE_KEY")
        if not url or not key:
            if required:
                raise DataPlaneError(
                    "Set OPENCLAW_SUPABASE_URL and OPENCLAW_SUPABASE_PUBLISHABLE_KEY."
                )
            return None
        return cls(
            url,
            key,
            access_token=os.getenv("OPENCLAW_SUPABASE_ACCESS_TOKEN"),
            refresh_token=os.getenv("OPENCLAW_SUPABASE_REFRESH_TOKEN"),
            email=os.getenv("OPENCLAW_SUPABASE_EMAIL"),
            password=os.getenv("OPENCLAW_SUPABASE_PASSWORD"),
        )

    def _auth_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.publishable_key,
            "Content-Type": "application/json",
        }

    def sign_in(self) -> AuthSession:
        if not self.email or not self.password:
            raise DataPlaneError(
                "No Supabase user session. Set OPENCLAW_SUPABASE_EMAIL and "
                "OPENCLAW_SUPABASE_PASSWORD, or provide an access token."
            )
        response = requests.post(
            f"{self.url}/auth/v1/token",
            params={"grant_type": "password"},
            headers=self._auth_headers(),
            json={"email": self.email, "password": self.password},
            timeout=self.timeout,
        )
        self._raise(response)
        data = response.json()
        self.session = AuthSession(data["access_token"], data.get("refresh_token"))
        return self.session

    def refresh(self) -> AuthSession:
        if not self.session or not self.session.refresh_token:
            return self.sign_in()
        response = requests.post(
            f"{self.url}/auth/v1/token",
            params={"grant_type": "refresh_token"},
            headers=self._auth_headers(),
            json={"refresh_token": self.session.refresh_token},
            timeout=self.timeout,
        )
        self._raise(response)
        data = response.json()
        self.session = AuthSession(data["access_token"], data.get("refresh_token"))
        return self.session

    def _token(self) -> str:
        if self.session and self.session.access_token:
            return self.session.access_token
        return self.sign_in().access_token

    @staticmethod
    def _raise(response: requests.Response) -> None:
        if response.status_code < 400:
            return
        detail = response.text[:1000]
        raise DataPlaneError(f"HTTP {response.status_code}: {detail}")

    def _rest(
        self,
        method: str,
        table: str,
        *,
        params: Optional[Dict[str, str]] = None,
        payload: Any = None,
        prefer: Optional[str] = None,
        retry: bool = True,
    ) -> Any:
        headers = self._auth_headers()
        headers["Authorization"] = f"Bearer {self._token()}"
        if prefer:
            headers["Prefer"] = prefer
        response = requests.request(
            method,
            f"{self.url}/rest/v1/{table}",
            headers=headers,
            params=params,
            json=payload,
            timeout=self.timeout,
        )
        if response.status_code == 401 and retry:
            self.refresh()
            return self._rest(
                method, table, params=params, payload=payload, prefer=prefer, retry=False
            )
        self._raise(response)
        if not response.content:
            return None
        return response.json()

    def select(self, table: str, *, params: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        return self._rest("GET", table, params=params) or []

    def insert(
        self,
        table: str,
        row: Dict[str, Any],
        *,
        ignore_duplicates: bool = False,
    ) -> List[Dict[str, Any]]:
        prefer = "return=representation"
        if ignore_duplicates:
            prefer += ",resolution=ignore-duplicates"
        return self._rest("POST", table, payload=row, prefer=prefer) or []

    def record_event(
        self,
        event_type: str,
        payload: Dict[str, Any],
        *,
        source: str,
        source_ref: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        rows = self.insert(
            "oc_events",
            {
                "source": source,
                "source_ref": source_ref,
                "event_type": event_type,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "payload": payload,
            },
            ignore_duplicates=bool(source_ref),
        )
        return rows[0] if rows else None

    def latest_events(self, limit: int = 30, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {
            "select": "id,source,source_ref,event_type,entity_type,entity_id,payload,created_at",
            "order": "created_at.desc",
            "limit": str(limit),
        }
        if event_type:
            params["event_type"] = f"eq.{event_type}"
        return self.select("oc_events", params=params)

    def add_memory(
        self,
        *,
        kind: str,
        title: str,
        summary: Optional[str] = None,
        content: Optional[Dict[str, Any]] = None,
        source: str = "cli",
        source_ref: Optional[str] = None,
        confidence: float = 0.5,
        status: str = "active",
        freshness_class: str = "durable",
    ) -> Dict[str, Any]:
        rows = self.insert(
            "oc_memory",
            {
                "kind": kind,
                "title": title,
                "summary": summary,
                "content": content or {},
                "source": source,
                "source_ref": source_ref,
                "confidence": confidence,
                "status": status,
                "freshness_class": freshness_class,
            },
        )
        if not rows:
            raise DataPlaneError("Memory insert returned no row.")
        row = rows[0]
        self.record_event(
            "memory.created",
            {"memory_id": row["id"], "kind": kind, "title": title},
            source=source,
            entity_type="memory",
            entity_id=row["id"],
        )
        return row

    def memory_search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        return self.select(
            "oc_memory",
            params={
                "select": "id,kind,title,summary,content,source,source_ref,confidence,status,freshness_class,last_verified_at,created_at,updated_at",
                "search_tsv": f"wfts.{query}",
                "order": "updated_at.desc",
                "limit": str(limit),
            },
        )

    def memory_list(self, *, kind: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        params = {
            "select": "id,kind,title,summary,content,source,source_ref,confidence,status,freshness_class,created_at,updated_at",
            "order": "updated_at.desc",
            "limit": str(limit),
        }
        if kind:
            params["kind"] = f"eq.{kind}"
        return self.select("oc_memory", params=params)

    def add_task(self, title: str, *, priority: int = 50, source: str = "cli", context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        rows = self.insert(
            "oc_tasks",
            {"title": title, "priority": priority, "source": source, "context": context or {}},
        )
        if not rows:
            raise DataPlaneError("Task insert returned no row.")
        row = rows[0]
        self.record_event(
            "task.created",
            {"task_id": row["id"], "title": title, "priority": priority},
            source=source,
            entity_type="task",
            entity_id=row["id"],
        )
        return row

    def tasks(self, *, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        params = {
            "select": "id,title,status,priority,source,assigned_agent_id,context,created_at,updated_at,completed_at",
            "order": "priority.desc,updated_at.desc",
            "limit": str(limit),
        }
        if status:
            params["status"] = f"eq.{status}"
        return self.select("oc_tasks", params=params)

    def add_result(
        self,
        *,
        title: str,
        content: Dict[str, Any],
        result_type: str = "result",
        task_id: Optional[str] = None,
        run_id: Optional[str] = None,
        verification_status: str = "unverified",
        score: Optional[float] = None,
        source: str = "cli",
    ) -> Dict[str, Any]:
        row = {
            "title": title,
            "content": content,
            "result_type": result_type,
            "task_id": task_id,
            "run_id": run_id,
            "verification_status": verification_status,
            "score": score,
        }
        rows = self.insert("oc_results", row)
        if not rows:
            raise DataPlaneError("Result insert returned no row.")
        result = rows[0]
        self.record_event(
            "result.created",
            {
                "result_id": result["id"],
                "task_id": task_id,
                "title": title,
                "verification_status": verification_status,
            },
            source=source,
            entity_type="result",
            entity_id=result["id"],
        )
        return result

    def results(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.select(
            "oc_results",
            params={
                "select": "id,task_id,run_id,result_type,title,content,verification_status,score,created_at",
                "order": "created_at.desc",
                "limit": str(limit),
            },
        )

    def sync_github(self, repo: str, limit: int = 20) -> int:
        headers = {"Accept": "application/vnd.github+json"}
        token = os.getenv("GITHUB_TOKEN")
        if token:
            headers["Authorization"] = f"Bearer {token}"
        response = requests.get(
            f"https://api.github.com/repos/{repo}/commits",
            headers=headers,
            params={"per_page": max(1, min(limit, 100))},
            timeout=self.timeout,
        )
        self._raise(response)
        inserted = 0
        for item in response.json():
            sha = item["sha"]
            commit = item.get("commit", {})
            author = commit.get("author") or {}
            row = self.record_event(
                "github.commit",
                {
                    "repo": repo,
                    "sha": sha,
                    "message": commit.get("message"),
                    "author": author.get("name"),
                    "date": author.get("date"),
                    "url": item.get("html_url"),
                },
                source="github",
                source_ref=f"github:{repo}:{sha}",
                entity_type="commit",
            )
            if row:
                inserted += 1
        return inserted
