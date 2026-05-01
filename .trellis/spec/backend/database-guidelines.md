# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

This project currently has no database layer.

There is no ORM, SQL, migration system, persistent application storage, or project-owned backend API route code in the current repository. The backend operates inside ComfyUI as custom nodes and uses ComfyUI/native loader state instead of project-managed persistence.

Evidence:

- `pyproject.toml:1-15` declares package metadata and no runtime dependencies.
- `py/` contains ComfyUI node modules only.
- Frontend model lists are discovered from ComfyUI/LiteGraph metadata, not from a project database.

---

## Query Patterns

Not applicable today. Do not introduce query helpers, repositories, or data-access abstractions unless a real persistence requirement is added.

If future work adds persistence, first update this spec with code-spec depth:

1. Scope / Trigger
2. Signatures (schema, migration command, API/command boundary)
3. Contracts (record fields, constraints, env keys)
4. Validation & Error Matrix
5. Good/Base/Bad Cases
6. Tests Required
7. Wrong vs Correct

---

## Migrations

Not applicable today. There is no migration directory or migration command.

Do not create placeholder migrations or database folders for speculative future needs.

---

## Naming Conventions

Not applicable today.

If persistence is introduced later, table/collection/file naming must be documented here before implementation agents rely on it.

---

## Common Mistakes

### Mistake: Treating this repository as a web backend

**Symptom**: Adding ORM conventions, HTTP error response formats, or repository classes that no code uses.

**Cause**: The default Trellis backend scaffold assumes a traditional server project, but this repository is a ComfyUI custom-node package.

**Fix**: Model implementation contracts as ComfyUI node signatures, widget payloads, native loader delegation, and frontend bundle loading.

#### Wrong

```python
class LoraRepository:
    def list_loras(self):
        ...
```

#### Correct

```python
if folder_paths.get_full_path("loras", lora_name) is None:
    raise FileNotFoundError(f"LoRA file not found: {lora_name}")
```
