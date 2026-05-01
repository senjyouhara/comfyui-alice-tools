# Logging Guidelines

> How logging is done in this project.

---

## Overview

This project currently has no project-owned logging abstraction and no established Python `logging` or frontend `console` convention in source code.

Backend errors are surfaced by raising explicit exceptions at ComfyUI node execution boundaries. Frontend code updates ComfyUI graph state and marks canvases dirty; it does not currently emit logs.

Do not add logging as a default implementation step. Add logs only when there is a concrete debugging or operational need that exceptions and ComfyUI UI feedback do not satisfy.

---

## Log Levels

No project-specific levels are defined today.

If logging is introduced later:

- Use Python's standard `logging` module for backend code, not `print()`.
- Use frontend logging only for temporary local debugging or deliberate diagnostics; remove temporary `console.*` calls before finishing work.
- Keep logs near boundary events, not inside tight model-application loops unless diagnosing a specific issue.

---

## Structured Logging

No structured logging format exists today.

Do not invent a JSON logger, request id, correlation id, or tracing convention unless the project adds a real runtime surface that needs it.

---

## What to Log

Currently nothing is required to be logged.

If future diagnostics are added, acceptable candidates are:

- Plugin frontend bundle selection in `__init__.py` when diagnosing `WEB_DIRECTORY` resolution.
- Missing native ComfyUI node/input discovery if exceptions are insufficient.
- One-time extension initialization diagnostics during frontend development.

---

## What NOT to Log

- Do not log full serialized workflow payloads by default.
- Do not log absolute local model paths unless the user is explicitly debugging path resolution.
- Do not log user machine paths, prompt text, credentials, environment dumps, or secrets.
- Do not leave temporary `print()` or `console.log()` statements in committed code.

---

## Wrong vs Correct

#### Wrong

```python
print("loading lora", lora_name)
```

#### Correct

```python
if folder_paths.get_full_path("loras", lora_name) is None:
    raise FileNotFoundError(f"LoRA file not found: {lora_name}")
```

The current project style prefers precise exceptions over routine logs.
