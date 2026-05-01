# Backend Development Guidelines

> Backend guidelines for this ComfyUI custom-node project.

---

## Overview

The backend layer is Python code executed by ComfyUI custom nodes. It is responsible for node registration, ComfyUI node metadata, serialized widget payload validation, native ComfyUI node delegation, and frontend bundle selection.

This is not a traditional HTTP/database backend.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout for the Python ComfyUI node layer | Filled |
| [ComfyUI Node Contracts](./comfyui-node-contracts.md) | Executable node signatures, serialized stack payloads, validation matrix, and tests | Filled |
| [Database Guidelines](./database-guidelines.md) | Explicitly documents that no database layer exists today | Filled |
| [Error Handling](./error-handling.md) | Exception types, validation boundaries, and error message conventions | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Required/forbidden backend patterns and verification checklist | Filled |
| [Logging Guidelines](./logging-guidelines.md) | Explicitly documents that no logging convention exists today | Filled |

---

## Quick Rules

- Register backend nodes only in `py/nodes.py`.
- Keep node class methods small; put validation/application logic in focused helper modules.
- Delegate model/file operations to native ComfyUI nodes through `get_native_node_class()`.
- Treat frontend serialized stack fields as cross-layer contracts and update Python + frontend together.
- Use explicit Python exceptions rather than silent fallbacks for invalid workflow state.
- Do not invent database, HTTP API, or logging patterns unless a real feature adds those surfaces.

---

**Language**: Spec documentation is written in English for agent portability.
