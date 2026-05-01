# Directory Structure

> How backend code is organized in this ComfyUI custom-node project.

---

## Overview

This repository is a ComfyUI custom node package, not a traditional web backend. Backend code is the Python layer that registers nodes, declares ComfyUI node signatures, validates serialized widget payloads, and delegates model operations to native ComfyUI nodes.

The main implementation patterns are visible in:

- `__init__.py:3-37` — ComfyUI plugin entry point, `WEB_DIRECTORY` resolver, exported node mappings.
- `py/nodes.py:1-18` — central node registration table.
- `py/model_loader.py:14-108` — composite model loader that delegates to native ComfyUI loaders.
- `py/lora_stack.py:9-108` and `py/controlnet_stack.py:13-177` — serialized stack validation and application logic.

---

## Directory Layout

```text
.
├── __init__.py                  # ComfyUI plugin entry; exports mappings and WEB_DIRECTORY
├── pyproject.toml               # Comfy Registry/package metadata; no Python runtime deps today
├── py/
│   ├── __init__.py              # Thin re-export for node mappings
│   ├── nodes.py                 # Only backend node mapping registry
│   ├── constants.py             # Native node names and Alice custom type names
│   ├── types.py                 # Dynamic ComfyUI optional input helpers
│   ├── native_inputs.py         # Adapter around ComfyUI's native NODE_CLASS_MAPPINGS
│   ├── model_loader.py          # AliceModelLoader node implementation
│   ├── stack_node.py            # AlicePowerLoraStack node implementation
│   ├── controlnet_nodes.py      # ControlNet stack/apply node implementations
│   ├── lora_stack.py            # LoRA row payload normalization + application
│   ├── controlnet_stack.py      # ControlNet row payload normalization + application
│   ├── resolution.py            # Resolution widget inputs + runtime parsing
│   └── latent.py                # Empty latent generation through native ComfyUI node
├── frontend/                    # Vue/ComfyUI extension source
└── web_version/                 # Built frontend bundles loaded by ComfyUI
```

---

## Module Organization

### Plugin entry and registration

- Keep the root `__init__.py` focused on ComfyUI integration: import mappings from `.py`, resolve `WEB_DIRECTORY`, and export `NODE_CLASS_MAPPINGS`, `NODE_DISPLAY_NAME_MAPPINGS`, and `WEB_DIRECTORY`.
- Register backend nodes only in `py/nodes.py`. Do not scatter mapping updates across feature modules.
- `py/__init__.py` should remain a thin re-export layer.

### Node classes

Concrete ComfyUI node classes live in focused modules:

- `py/stack_node.py` declares `AlicePowerLoraStack`.
- `py/controlnet_nodes.py` declares `AliceControlNetStack` and `AliceApplyControlNetStack`.
- `py/model_loader.py` declares `AliceModelLoader`.

Each node class must declare ComfyUI metadata at class level:

```python
class AlicePowerLoraStack:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    RETURN_TYPES = (ALICE_LORA_STACK_TYPE,)
    RETURN_NAMES = ("LoRA配置",)
    FUNCTION = "build_stack"
    CATEGORY = "Alice/Loaders"
```

### Helpers and business logic

- Keep validation/application logic out of node class bodies when it has reusable shape. Current examples are `extract_lora_stack()`, `apply_lora_stack()`, `extract_controlnet_stack()`, and `apply_controlnet_stack()`.
- Delegate native model/file loading through `py/native_inputs.py` and `get_native_node_class()` rather than importing or recreating native ComfyUI loader behavior directly.
- Keep constants in `py/constants.py` when names are shared across modules or define ComfyUI node/type contracts.

### Frontend-backed dynamic inputs

Dynamic stack nodes intentionally use:

```python
"optional": FlexibleOptionalInputType(any_type)
```

This accepts arbitrary frontend-created widget/input names (`lora_1`, `controlnet_1`, `image_1`, etc.). The backend must then filter and validate only the expected prefixes in the stack extraction function.

---

## Naming Conventions

- Backend node classes use the `Alice...` prefix and must match keys in `NODE_CLASS_MAPPINGS`.
- Display names may be bilingual, as in `"Alice 模型加载器"` and `"Alice 应用 ControlNet 堆"`.
- Custom ComfyUI type constants use uppercase names ending in `_TYPE`, for example `ALICE_LORA_STACK_TYPE`.
- Native ComfyUI node name constants use uppercase names ending in `_NAME`, for example `CHECKPOINT_LOADER_NAME`.
- Dynamic row payload prefixes are lower snake case and must match frontend serialization:
  - LoRA rows: `lora_`.
  - ControlNet rows: `controlnet_`.
  - ControlNet image inputs: `image_`.

---

## Examples

### Add a backend node

1. Add or update a focused node module under `py/`.
2. Add any shared native names or custom return types to `py/constants.py`.
3. Register the class and display name in `py/nodes.py`.
4. If it has frontend widgets, add/update frontend extension code and keep serialized payload fields synchronized with backend validation.

### Current well-structured references

- `py/model_loader.py:14-108` — class metadata plus small helper methods for checkpoint/component loading.
- `py/lora_stack.py:16-49` — explicit payload normalization before applying LoRAs.
- `py/controlnet_stack.py:48-104` — explicit payload validation including required fields, numeric coercion, range checks, and image binding.
