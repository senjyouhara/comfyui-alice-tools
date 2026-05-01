# ComfyUI Node Contracts

> Executable contracts for backend ComfyUI nodes, serialized stack payloads, and plugin bundle loading.

---

## Scenario: ComfyUI node and dynamic stack contracts

### 1. Scope / Trigger

Use this spec whenever a change touches any of these boundaries:

- A ComfyUI node class signature (`INPUT_TYPES`, `RETURN_TYPES`, `RETURN_NAMES`, `FUNCTION`, `CATEGORY`).
- `NODE_CLASS_MAPPINGS` or `NODE_DISPLAY_NAME_MAPPINGS`.
- A frontend-serialized stack row payload consumed by Python.
- Native ComfyUI node delegation in `py/native_inputs.py`, `py/model_loader.py`, `py/lora_stack.py`, or `py/controlnet_stack.py`.
- Frontend bundle selection through `WEB_DIRECTORY`.

These are cross-layer contracts: frontend widgets, serialized workflow state, Python nodes, and ComfyUI native loaders must agree.

---

### 2. Signatures

#### Plugin entry

```python
NODE_CLASS_MAPPINGS: dict[str, type]
NODE_DISPLAY_NAME_MAPPINGS: dict[str, str]
WEB_DIRECTORY: str
```

Root `__init__.py` exports exactly these names through `__all__` today.

#### Registered backend nodes

```python
NODE_CLASS_MAPPINGS = {
    "AlicePowerLoraStack": AlicePowerLoraStack,
    "AliceModelLoader": AliceModelLoader,
    "AliceControlNetStack": AliceControlNetStack,
    "AliceApplyControlNetStack": AliceApplyControlNetStack,
}
```

#### Node class contract

Every node class must expose:

```python
@classmethod
def INPUT_TYPES(cls) -> dict: ...

RETURN_TYPES: tuple[str, ...]
RETURN_NAMES: tuple[str, ...]
FUNCTION: str
CATEGORY: str
```

The instance method named by `FUNCTION` must return a tuple with the same arity as `RETURN_TYPES`.

#### Current node method signatures

```python
AlicePowerLoraStack.build_stack(**kwargs) -> tuple[list[dict]]
AliceControlNetStack.build_stack(**kwargs) -> tuple[list[dict]]
AliceApplyControlNetStack.apply(positive, negative, controlnet_stack, vae=None) -> tuple[object, object]
AliceModelLoader.load(
    ckpt_name,
    unet_name,
    weight_dtype,
    clip_name,
    clip_type,
    clip_device,
    vae_name,
    resolution,
    width,
    height,
    lora_stack=None,
) -> tuple[object, object, object, object]
```

---

### 3. Contracts

#### Environment keys

| Key | Required | Behavior |
|-----|----------|----------|
| `COMFYUI_ALICE_TOOLS_WEB_VERSION` | No | If set, lowercased/trimmed value selects `web_version/<value>` when that directory exists. Falls back to `web_version/v1`. |

`WEB_DIRECTORY` must be a relative path formatted with forward slashes, for example `./web_version/v1`.

#### LoRA row payload

Python accepts payloads from dynamic optional inputs whose names start with `lora_`.

| Field | Type | Required | Constraints / behavior |
|-------|------|----------|------------------------|
| `on` | `bool` | Yes | Disabled rows are skipped. |
| `lora` | `str` | Yes | Must be non-empty. `"None"` is invalid when `on` is `True`. |
| `strength` | number-like | Yes | Coerced with `float()`. |
| `strength_clip` | number-like | No | Preferred CLIP strength field. |
| `strengthTwo` | number-like | No | Current fallback alias used by existing LoRA UI state. |
| `order` | int-like | No | Preferred ordering key; otherwise numeric suffix from `lora_N`, otherwise end of list. |

Application behavior:

- `None` stack returns original `(model, clip)`.
- Non-list stack raises `ValueError`.
- Disabled rows are skipped.
- Rows with both strengths equal to `0` are skipped.
- Selected LoRA files must resolve through `folder_paths.get_full_path("loras", lora_name)`.
- LoRAs are applied in normalized order through native `LoraLoader.load_lora()`.

#### ControlNet row payload

Python accepts payloads from dynamic optional inputs whose names start with `controlnet_`.

| Field | Type | Required | Constraints / behavior |
|-------|------|----------|------------------------|
| `on` | `bool` | Yes | Disabled rows are skipped. |
| `controlnet` | `str` | Yes | Must be non-empty. `"None"` is invalid when `on` is `True`. |
| `strength` | number-like | Yes | Coerced with `float()`. `0` skips application. |
| `start_percent` | number-like | Yes | Coerced with `float()`; must be between `0` and `1`. |
| `end_percent` | number-like | Yes | Coerced with `float()`; must be between `0` and `1`; must be `>= start_percent`. |
| `image_input` | `str` | No | Must be non-empty when present. If missing, derived from `controlnet_N` as `image_N`. |
| `image` | object | Runtime | Attached from `kwargs[image_input]` during extraction. Required for active selected rows. |
| `order` | int-like | No | Preferred ordering key; otherwise numeric suffix from `controlnet_N`, otherwise end of list. |

Application behavior:

- `None` stack returns original `(positive, negative)`.
- Non-list stack raises `ValueError`.
- Disabled rows and zero-strength rows are skipped.
- Selected files must resolve through `folder_paths.get_full_path("controlnet", controlnet_name)`.
- ControlNets are loaded once per execution and cached in a local `loaded_controlnets` dict.
- Application delegates to native `ControlNetApplyAdvanced.apply_controlnet()`.

#### Resolution contract

`AliceModelLoader` exposes `resolution`, `width`, and `height` inputs from `py/resolution.py`.

- If `resolution == "自定义"`, runtime returns `int(width), int(height)`.
- Otherwise runtime parses the first `<width>x<height>` pair in the selected preset text.
- Invalid preset text raises `ValueError`.

---

### 4. Validation & Error Matrix

| Condition | Error |
|-----------|-------|
| Native node name missing from ComfyUI `NODE_CLASS_MAPPINGS` | `RuntimeError("Native node not available: <name>")` |
| Native input missing from a native node | `RuntimeError("Native input not available: <node>.<input>")` |
| Checkpoint loader returns fewer than `MODEL`, `CLIP`, `VAE` | `ValueError("Checkpoint loader did not return MODEL, CLIP, and VAE")` |
| Checkpoint loader returns `None` for model/clip/vae | `ValueError("Checkpoint loader returned an incomplete MODEL/CLIP/VAE bundle")` |
| `ckpt_name == "None"` and required component field is `"None"` | `ValueError` listing missing fields; mention `clip_type` explicitly when missing |
| LoRA/ControlNet entry is not a dictionary | `ValueError` with entry name |
| Required stack fields are missing | `ValueError` with missing field list |
| `on` is not a boolean | `ValueError` with field path |
| Active selected file field is `"None"` | `ValueError` requiring selected filename |
| Numeric field cannot be coerced | `ValueError` with field path and received value |
| ControlNet percent outside `[0, 1]` | `ValueError` with field path |
| ControlNet `start_percent > end_percent` | `ValueError` |
| Active ControlNet row lacks IMAGE input/value | `ValueError` naming the row/input |
| Selected LoRA file cannot resolve | `FileNotFoundError("LoRA file not found: <name>")` |
| Selected ControlNet file cannot resolve | `FileNotFoundError("ControlNet file not found: <name>")` |
| Resolution preset cannot be parsed | `ValueError("Invalid resolution preset: ...")` |

---

### 5. Good/Base/Bad Cases

#### Good

- `AlicePowerLoraStack.build_stack(lora_1={"on": True, "lora": "style.safetensors", "strength": 0.8, "order": 0})` returns one normalized LoRA entry.
- `AliceApplyControlNetStack.apply()` receives an enabled ControlNet row with a connected `image_1` input and applies it through `ControlNetApplyAdvanced`.
- `AliceModelLoader.load()` uses checkpoint mode when `ckpt_name != "None"`, then applies any LoRA stack and returns a latent for the resolved resolution.

#### Base

- Empty dynamic stack kwargs return an empty stack list.
- `lora_stack is None` returns the original `(model, clip)`.
- `controlnet_stack is None` returns the original `(positive, negative)`.
- `COMFYUI_ALICE_TOOLS_WEB_VERSION` unset uses `./web_version/v1` when present.

#### Bad

- `{"on": "true", "lora": "x.safetensors", "strength": 1}` raises `ValueError` because `on` is not a boolean.
- Active ControlNet row without a connected IMAGE input raises `ValueError` before native application.
- `resolution="bad preset"` raises `ValueError` because no dimensions can be parsed.

---

### 6. Tests Required

There is no configured automated Python test suite today. When adding tests or doing manual verification, cover these assertion points:

- Import/registration: root package exposes `NODE_CLASS_MAPPINGS`, `NODE_DISPLAY_NAME_MAPPINGS`, and `WEB_DIRECTORY` in a ComfyUI-capable environment.
- Node signature: each `FUNCTION` method returns a tuple matching `RETURN_TYPES` length.
- LoRA normalization: required fields, type validation, `strength_clip`/`strengthTwo` fallback, ordering, disabled row skip, zero-strength skip, file-not-found error.
- ControlNet normalization: required fields, image input derivation, percent range/order validation, connected image requirement, file-not-found error, per-execution load cache.
- Model loader: checkpoint mode, component mode, missing component fields, incomplete checkpoint bundle, resolution parsing.
- Bundle selection: env-selected existing `web_version/<value>` wins; missing env-selected directory falls back to `web_version/v1`.

---

### 7. Wrong vs Correct

#### Wrong

```python
def build_stack(self, **kwargs):
    return ([value for value in kwargs.values()],)
```

This accepts arbitrary malformed payloads and loses row ordering semantics.

#### Correct

```python
def build_stack(self, **kwargs):
    return (extract_lora_stack(kwargs),)
```

#### Wrong

```python
if ckpt_name == "None":
    return None, None, None
```

This violates the node return contract and hides invalid workflow configuration.

#### Correct

```python
if missing_fields:
    missing_fields_text = ", ".join(missing_fields)
    raise ValueError(f"When ckpt_name is None, these fields are required: {missing_fields_text}")
```
