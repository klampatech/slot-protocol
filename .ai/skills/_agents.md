---
name: _agents
agents: [claude, codex]
phase: reference
can_modify_checkboxes: false
version: 1
---

# Available Agents

This document describes the AI agents available for use in agate workflows.

## Agent Selection Guidelines

When planning tasks, choose agents based on task complexity and type:
- **Planning, reviewing, complex reasoning**: Use claude
- **Difficult coding tasks**: Use codex
- **Simple/trivial tasks**: Use haiku (fast, cheap)
- **Testing workflow only**: Use dummy (never for real work)

## Agents

### claude
- **Model**: Claude (Opus/Sonnet)
- **Best for**: General purpose thinking, planning, design decisions, code review, complex reasoning
- **Strengths**: Strong at understanding context, following nuanced instructions, explaining rationale
- **Use when**: Task requires judgment, planning, review, or understanding complex requirements

### codex
- **Model**: OpenAI Codex/GPT
- **Best for**: Difficult coding efforts, implementation tasks, code generation
- **Strengths**: Strong at generating working code, handling complex implementations
- **Use when**: Task is primarily writing substantial code

### haiku
- **Model**: Claude 3.5 Haiku
- **Best for**: Extremely trivial tasks, quick lookups, simple transformations
- **Strengths**: Fast, cheap, good for high-volume simple tasks
- **Use when**: Task is trivial and speed/cost matters more than sophistication
- **Avoid when**: Task requires nuance, complex reasoning, or high-quality output

### dummy
- **Model**: No-op (returns mock responses)
- **Purpose**: Testing the agate workflow only
- **NEVER use for**: Real work - it does not execute anything
- **Use when**: Testing workflow mechanics, CI/CD validation
