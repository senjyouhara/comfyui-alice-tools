# Frontend Development Guidelines

> Frontend guidelines for this ComfyUI/Vue extension layer.

---

## Overview

The frontend layer is a Vite-built Vue extension loaded by ComfyUI from `WEB_DIRECTORY`. It registers ComfyUI frontend extensions, creates Vue-backed DOM widgets for dynamic stack rows, serializes row payloads for Python nodes, and adjusts ComfyUI widget layout/visibility.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [ComfyUI Extension Contracts](./comfyui-extension-contracts.md) | Extension registration, lifecycle wrapping, Vue widget bridge, serialized row fields, and build output contract | Filled |

---

## Quick Rules

- Register ComfyUI frontend extensions through `app.registerExtension({ name, beforeRegisterNodeDef })`.
- Filter lifecycle hooks by exact backend node name before mutating prototypes.
- Wrap original `onNodeCreated` and `configure`, call the original method first, then install Alice-specific behavior.
- Use `createVueNodeWidget()` for Vue-backed DOM widgets so unmounting and serialization stay consistent.
- Keep serialized row fields synchronized with backend normalization in `py/lora_stack.py` and `py/controlnet_stack.py`.
- Build output must remain compatible with root `WEB_DIRECTORY` resolution.
