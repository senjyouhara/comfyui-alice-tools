# Quality Guidelines

> Code quality standards for backend development.

---

## Overview

Backend quality in this repository means preserving ComfyUI node contracts, keeping frontend-serialized payloads synchronized with Python validation, and delegating to native ComfyUI nodes instead of reimplementing model loading.

There is currently no project-owned Python test runner, lint command, formatter config, or type-check config. Do not claim automated Python quality gates exist unless they are added to the repository.

---

## Forbidden Patterns

### Do not bypass native ComfyUI loaders

Use `get_native_node_class()` and native loader nodes. Do not directly implement checkpoint, UNet, CLIP, VAE, LoRA, or ControlNet file loading.

#### Wrong

```python
model = load_model_from_path(ckpt_name)
```

#### Correct

```python
checkpoint_loader = get_native_node_class(CHECKPOINT_LOADER_NAME)()
model, clip, vae = checkpoint_loader.load_checkpoint(ckpt_name)[:3]
```

### Do not duplicate native input option definitions

`AliceModelLoader.INPUT_TYPES()` derives options from native nodes with `build_native_input()` and `build_optional_native_input()`. Do not hard-code duplicate option lists for native ComfyUI inputs.

### Do not accept dynamic stack payloads without normalization

Every dynamic row payload must pass through the matching normalization helper before it is applied.

### Do not scatter node registration

`py/nodes.py` is the only backend registry. New node classes must be imported and mapped there.

### Do not add speculative compatibility shims

The existing `strengthTwo` fallback in `py/lora_stack.py:37-42` reflects current serialized LoRA state. New aliases or legacy branches require a real compatibility need and must be documented in the relevant contract spec.

---

## Required Patterns

### Keep ComfyUI class signatures explicit

Every backend node class must declare:

- `INPUT_TYPES()`
- `RETURN_TYPES`
- `RETURN_NAMES`
- `FUNCTION`
- `CATEGORY`

The method named by `FUNCTION` must return a tuple matching `RETURN_TYPES`.

### Validate payloads at backend boundaries

Frontend code may normalize UI state, but Python remains the contract enforcer. Keep checks for type, required fields, selected file names, numeric coercion, and ranges in backend normalization helpers.

### Keep frontend and backend row fields synchronized

When changing serialized row fields, update both sides in the same task:

- LoRA frontend serialization: `frontend/src/extensions/powerLoraStack/serialization.js:46-51`.
- LoRA backend validation: `py/lora_stack.py:16-49`.
- ControlNet frontend serialization: `frontend/src/extensions/controlNetStack/serialization.js:67-75`.
- ControlNet backend validation: `py/controlnet_stack.py:48-104`.

### Prefer focused functions over large node methods

Current code keeps node methods small and pushes logic into helper functions:

```python
def build_stack(self, **kwargs):
    return (extract_lora_stack(kwargs),)
```

Follow this pattern for new node behavior.

---

## Testing Requirements

### Current available checks

- Frontend build: run `npm run build` from `frontend/` after frontend changes.
- Python import/execution checks require a ComfyUI environment because modules import ComfyUI-provided modules such as `nodes` and `folder_paths`.

### When backend code changes

At minimum, verify the affected ComfyUI workflow path manually or with a ComfyUI-aware test harness:

- Node imports and registration succeed.
- `INPUT_TYPES()` returns valid ComfyUI definitions.
- The node method named by `FUNCTION` returns a tuple matching `RETURN_TYPES`.
- Invalid payload cases raise the documented exception type and field-specific message.
- Native node delegation still uses the expected native node names from `py/constants.py`.

### When frontend/backend payload fields change

Assert these cases in tests or manual verification:

- Base case: empty stack returns an empty list or leaves conditioning/model unchanged.
- Good case: one valid enabled row serializes, backend normalizes it, and native loader receives expected values.
- Bad case: malformed field type or missing required field raises `ValueError`.
- Order case: rows apply in serialized `order` order, falling back to widget/input suffix order where applicable.

---

## Code Review Checklist

- [ ] New backend nodes are registered in `py/nodes.py` and exported through existing package entry points.
- [ ] `NODE_NAME` constants in frontend extensions match backend mapping keys exactly.
- [ ] Dynamic widget payload fields match backend normalization helpers.
- [ ] Native ComfyUI node names are centralized in `py/constants.py` when shared.
- [ ] Invalid user/widget state raises explicit exceptions instead of being silently ignored.
- [ ] Frontend changes still build into the directory selected by root `WEB_DIRECTORY` logic.
- [ ] No temporary logs, debug prints, unused imports, or placeholder docs remain.

---

## Wrong vs Correct

#### Wrong

```python
class AliceNewStack:
    def run(self, **kwargs):
        return kwargs
```

#### Correct

```python
class AliceNewStack:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}, "optional": FlexibleOptionalInputType(any_type)}

    RETURN_TYPES = (ALICE_NEW_STACK_TYPE,)
    RETURN_NAMES = ("配置",)
    FUNCTION = "build_stack"
    CATEGORY = "Alice/..."

    def build_stack(self, **kwargs):
        return (extract_new_stack(kwargs),)
```
