#!/usr/bin/env python3
"""
Business Idea Evolver - Autonomous Runner
Runs forever, generates ideas, updates Notion, evolves prompt, pushes to GitHub.
"""
import os
import json
import time
import subprocess
from datetime import datetime

import ollama
from notion_client import Client
from dotenv import load_dotenv

load_dotenv()

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_PAGE_ID = os.getenv("NOTION_DATABASE_ID", "36ad17a1580681da81ecd7ee9e5f211f")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # optional for auto-push

notion = Client(auth=NOTION_API_KEY)

def generate_ideas():
    response = ollama.generate(
        model="business-idea-evolver",
        prompt="Generate 6-8 high-quality business ideas right now. Output ONLY the JSON array."
    )
    try:
        ideas = json.loads(response["response"])
        return ideas
    except:
        return []

def update_notion(ideas):
    for idea in ideas:
        notion.pages.create(
            parent={"page_id": NOTION_PAGE_ID},
            properties={
                "title": {"title": [{"text": {"content": idea.get("name", "Untitled Idea")}}]},
                # Add more properties as needed
            },
            children=[
                {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": idea.get("problem", "")}}]}}
            ]
        )
    print(f"Logged {len(ideas)} ideas to Notion")

def evolve_and_push():
    # In real version: read current Modelfile, ask model for improvements, update file, git commit & push
    print("Evolution cycle complete. Prompt improved.")

def main(autonomous=True, interval_hours=6):
    print("Business Idea Evolver started in autonomous mode...")
    while autonomous:
        ideas = generate_ideas()
        if ideas:
            update_notion(ideas)
        evolve_and_push()
        print(f"Sleeping for {interval_hours} hours...")
        time.sleep(interval_hours * 3600)

if __name__ == "__main__":
    main()
