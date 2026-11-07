---
title: Running on another model
nav: Another model
summary: Point agents at Ollama, llama.cpp, vLLM or a proxy — no Claude sign-in, and never held by the quota guard.
---

# Running on another model

shadok drives Claude Code, and Claude Code can talk to **any server that speaks
the Anthropic Messages API**: Ollama, llama.cpp's `llama-server`, vLLM, or a
LiteLLM proxy in front of something else.

Agents on such a backend need **no Claude sign-in** and are **never held by the
pace guard** — they are not spending your subscription.

## Three ways to do it

### From the cockpit

The sign-in card a fresh instance opens has a second side, **Another model**:
pick a provider (Ollama, a llama.cpp server, DeepSeek, Z.ai/GLM, Moonshot/Kimi,
or any Anthropic-compatible server), and the address and model come pre-filled.
The models a local server serves are listed for you, and **Test** sends one real
request before anything is saved.

The lead agent starts as soon as you save. Change it later from the version
menu, **⚙ Model backend…**, which also offers to go back to the subscription.
The choice is stored per launch directory and takes precedence over the
environment; running agents keep the model they were started with until they are
reloaded.

### The whole instance, from the environment

```bash
ANTHROPIC_BASE_URL=http://localhost:11434 ANTHROPIC_AUTH_TOKEN=ollama \
ANTHROPIC_MODEL=qwen3-coder:30b SHADOK_CONTEXT_WINDOW=64k npx shadok-ai
```

### One role only

Store the same names as vault secrets and attach them to a profile. Agents on
that profile use the local model and the rest stay on the subscription — a
profile's secrets win over the instance's environment.

## The variables

| Variable | Meaning |
|---|---|
| `ANTHROPIC_BASE_URL` | The server. Anything that is not `*.anthropic.com` counts as a custom backend. |
| `ANTHROPIC_AUTH_TOKEN` | Sent as a bearer token. Any value will do when the server checks none. Prefer it to `ANTHROPIC_API_KEY`, which makes Claude Code ask for confirmation. |
| `ANTHROPIC_MODEL` | The model to run. It also fills every unset `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL` and `ANTHROPIC_SMALL_FAST_MODEL`, so the model picker and Claude Code's background calls reach it too. |
| `SHADOK_CONTEXT_WINDOW` | The window the context gauge measures against (`64000`, `64k`, `1m`). Without it the gauge assumes Claude's 200k. |

## What is not in the list, and why

Hugging Face Inference, Together, Groq and the other **OpenAI-only** APIs are
left out on purpose: Claude Code speaks only the Anthropic format, so they need
a translating proxy — LiteLLM, claude-code-router — in front. Then point
*Another Anthropic-compatible server* at the proxy. The Test button tells the two
cases apart and says which one you hit.

## Two things are on you

**The model needs reliable tool calling and a long context.** Claude Code's own
prompt and tool list take roughly 15–20k tokens before your first word.

**The server must actually serve that context.** Ollama's default is a few
thousand tokens, so set `OLLAMA_CONTEXT_LENGTH` — 64k is a sane floor — or the
agent loses its instructions with no error at all.
