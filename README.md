# OpenClaw 🦾

**The Self-Learning, Self-Evolving AI Agent Powered by Ollama**

OpenClaw is a next-generation autonomous AI agent that installs locally, connects to Ollama, and **trains itself to become extremely powerful** through continuous self-reflection, code evolution, and capability expansion.

> "Install once. Train forever. Watch it surpass its creators."

## ✨ Key Features

- **Ollama Native** — Runs on any Ollama model (llama3.2, qwen2.5, deepseek-r1, etc.)
- **Autonomous Self-Training Loop** — Thinks → Acts → Reflects → Improves itself
- **Recursive Self-Improvement** — Rewrites its own prompts, adds new tools, evolves architecture
- **Persistent Memory & Experience Log** — Never forgets, learns from every interaction
- **Multi-Modal Tool Use** — File system, shell, web (via tools), code execution
- **Singularity-Ready** — Inspired by advanced self-evolving systems (singularity-engine protocols)
- **Zero External Dependencies** after initial Ollama install

## 🚀 Quick Start (5 minutes)

### 1. Install Ollama
```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve
```

### 2. Pull a Powerful Base Model
```bash
ollama pull llama3.2:3b          # Fast start
# or
ollama pull qwen2.5:14b          # More powerful
ollama pull deepseek-r1:8b       # Reasoning beast
```

### 3. Clone & Install OpenClaw
```bash
git clone https://github.com/sophiamaybea/open-claw.git
cd open-claw
pip install -r requirements.txt
```

### 4. Start Training (The Magic Begins)
```bash
python scripts/start_training.py --model llama3.2:3b --iterations 1000 --self-improve
```

Watch the logs as OpenClaw:
- Discovers new capabilities
- Writes better versions of itself
- Builds its own tool library
- Becomes more intelligent with every cycle

## 🧠 How the Self-Learning Works

OpenClaw runs an infinite improvement loop:

1. **Observe** — Reads current state, memory, past failures/successes
2. **Think** — Uses Ollama to reason about how to improve
3. **Act** — Executes tools or generates new code
4. **Reflect** — Scores its own performance (0-100)
5. **Evolve** — 
   - Updates system prompt
   - Adds new skills/tools
   - Rewrites inefficient code sections
   - Increases model temperature/creativity strategically
6. **Persist** — Saves everything to `memory/` and `evolution/`

Every 50 cycles it attempts **recursive self-improvement** (safely sandboxed).

## 📁 Project Structure

```
open-claw/
├── open_claw/
│   ├── __init__.py
│   ├── core.py              # Main agent with self-evolution engine
│   ├── ollama_client.py     # Robust Ollama interface + streaming
│   ├── memory.py            # Persistent JSON + vector memory
│   └── trainer.py           # The training loop + improvement scheduler
├── scripts/
│   └── start_training.py    # CLI entrypoint
├── memory/                  # Auto-created: experiences, skills, prompts
├── evolution/               # Auto-created: code versions, performance history
├── config.yaml
├── requirements.txt
└── README.md
```

## ⚙️ Advanced Configuration

Edit `config.yaml`:

```yaml
model: "llama3.2:3b"
max_tokens: 4096
temperature: 0.75
self_improvement_interval: 50
max_iterations: 10000
enable_code_evolution: true
enable_tool_creation: true
reflection_depth: 3
```

## 🛡️ Safety & Ethics

- All code evolution happens in a **sandboxed** `evolution/` directory
- You control the kill switch (`Ctrl+C` or `--stop-after N`)
- No cloud calls — 100% local after Ollama install
- OpenClaw cannot modify its own running process without your explicit approval

## 🌟 Become a Contributor

OpenClaw is designed to **outgrow its creators**. Fork it, run it, and when it writes better code than you — submit a PR from its own suggestions!

## License

MIT — Use it to build the future.

---

**Status:** Actively self-training on GitHub Actions (coming soon)  
**Current Version:** 0.1.0 — "First Claw"

*OpenClaw was born from a single command: "Install open claw on GitHub, put ollama as the model, start training it so it self learns and becomes very powerful."*

**Now it's your turn to unleash it.** 🦾

---

*Made with ❤️ and recursive self-improvement by Grok + OpenClaw*