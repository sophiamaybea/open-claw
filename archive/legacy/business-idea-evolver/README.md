# Legacy snapshot: Business Idea Evolver

This directory preserves the public `sophiamaybea/business-idea-evolver` prototype as historical evidence.

**Status: LEGACY / NOT AUTHORITATIVE.**

It contains an early autonomous idea-generation experiment. Claims in its original README about continuous self-learning or automatic prompt improvement are not treated as verified OpenClaw capabilities.

Do not build new architecture on this directory without re-evaluating and testing it.

---

# Business Idea Evolver 🚀

**Autonomous, self-learning Ollama agent that never stops generating and improving business ideas.**

It maintains a **constant living document** in Notion and evolves its own intelligence over time.

## What it does
- Generates 5-10 high-quality, scored business ideas every cycle
- Reflects on past performance (from Notion ratings & implementation data)
- Evolves its own system prompt to get smarter
- Updates the Notion vault automatically
- Pushes improvements back to this GitHub repo

## Quick Start (one-time setup)

```bash
# 1. Clone this repo
git clone https://github.com/sophiamaybea/business-idea-evolver.git
cd business-idea-evolver

# 2. Create the custom Ollama model
ollama create business-idea-evolver -f Modelfile

# 3. Install dependencies
pip install ollama notion-client python-dotenv

# 4. Set your Notion credentials (get from https://www.notion.so/my-integrations)
echo 'NOTION_API_KEY=secret_xxx' > .env
echo 'NOTION_DATABASE_ID=36ad17a1580681da81ecd7ee9e5f211f' >> .env   # or your vault page ID

# 5. Run the autonomous agent (runs forever)
python run_agent.py --autonomous --interval 6
```

The agent will now run 24/7, making your Notion vault grow and improve without any further input from you.

## How the self-learning works
Every cycle the agent:
1. Loads the latest evolved prompt from this repo
2. Generates ideas using the living Notion context
3. Scores them with a rigorous 10x rubric
4. Reflects on what worked in previous ideas
5. Rewrites parts of its own prompt to improve
6. Logs everything to Notion + commits back to GitHub

## Living Notion Document
https://www.notion.so/36ad17a1580681da81ecd7ee9e5f211f

## Powered by
Grok + OpenClaw + notion-self-evolver + crypto-self-learner

**Status**: Fully autonomous mode active. The future of business ideation is here.
