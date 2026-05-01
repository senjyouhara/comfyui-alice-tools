# Error Handling

> How errors are handled in this ComfyUI custom-node backend.

---

## Overview

Backend code raises plain Python exceptions at the ComfyUI node boundary. There is no project-owned HTTP API response layer and no custom error class hierarchy today.

Use explicit exceptions with messages that identify the invalid field or missing dependency. Current patterns:

- `ValueError` for invalid user/widget payloads and violated native-loader return contracts.
- `RuntimeError` for missing native ComfyUI node classes or input definitions.
- `FileNotFoundError` for selected model files that ComfyUI cannot resolve through `folder_paths`.

---

## Error Types

| Error type | Use for | Current examples |
|------------|---------|------------------|
| `ValueError` | Invalid serialized payloads, invalid field types, invalid ranges, incomplete user selections, invalid native return shape | `py/lora_stack.py:9-49`, `py/controlnet_stack.py:13-104`, `py/model_loader.py:70-99`, `py/resolution.py:66-73` |
| `RuntimeError` | Required native ComfyUI node/input is unavailable | `py/native_inputs.py:4-25` |
| `FileNotFoundError` | A user-selected LoRA/ControlNet file name is not resolvable by ComfyUI | `py/lora_stack.py:102-104`, `py/controlnet_stack.py:157-159` |

---

## Error Handling Patterns

### Validate at boundaries

Validate serialized frontend payloads before applying native ComfyUI operations:

```python
if not isinstance(payload, dict):
    raise ValueError(f"Invalid LoRA entry '{entry_name}': expected a dictionary payload")
```

Boundary validation belongs in normalization helpers such as `normalize_lora_entry()` and `normalize_controlnet_entry()`, not scattered through UI code or native loader calls.

### Include the field path in messages

Error messages should name the row and field when possible:

```python
raise ValueError(f"Invalid ControlNet field '{entry_name}.start_percent': expected a value between 0 and 1")
```

This helps users map ComfyUI execution errors back to dynamic row widgets.

### Preserve original conversion errors

When coercing values, wrap the original `TypeError`/`ValueError` with `from error`:

```python
try:
    return float(value)
except (TypeError, ValueError) as error:
    raise ValueError(f"Invalid LoRA field '{field_name}': expected a number, got {value!r}") from error
```

### Let ComfyUI surface node errors

Do not catch and suppress backend node exceptions unless there is a specific recovery path. Silent skipping hides invalid graph state and makes workflows harder to debug.

---

## Validation & Error Matrix

| Condition | Exception | Message requirement |
|-----------|-----------|---------------------|
| Stack payload entry is not a `dict` | `ValueError` | Include entry name and expected dictionary payload |
| Required LoRA fields `on`, `lora`, `strength` are missing | `ValueError` | Include missing field list |
| Required ControlNet fields `on`, `controlnet`, `strength`, `start_percent`, `end_percent` are missing | `ValueError` | Include missing field list |
| `on` is not `bool` | `ValueError` | Include `<entry>.on` |
| Selected file field is empty or non-string | `ValueError` | Include `<entry>.lora` or `<entry>.controlnet` |
| Active row has file value `"None"` | `ValueError` | State that a selected filename is required |
| Numeric field cannot be coerced | `ValueError` | Include field name and received value |
| ControlNet percent is outside `[0, 1]` | `ValueError` | Include field name and range |
| `start_percent > end_percent` | `ValueError` | State ordering requirement |
| Active ControlNet row has no IMAGE value | `ValueError` | Include entry name and expected image input |
| Native ComfyUI node/input is missing | `RuntimeError` | Include native node/input name |
| Selected LoRA/ControlNet file cannot be resolved | `FileNotFoundError` | Include selected filename |

---

## API Error Responses

Not applicable today. This project does not define HTTP routes or API response payloads.

If a future feature adds HTTP routes through ComfyUI `PromptServer` or another server layer, create a new spec section before implementation that defines route signatures, request/response payloads, status/error mapping, and tests.

---

## Common Mistakes

### Mistake: Returning default values after invalid graph input

**Symptom**: A workflow runs but silently ignores rows or produces unexpected model conditioning.

**Cause**: Invalid serialized row state was swallowed instead of rejected.

**Fix**: Raise `ValueError` with a specific field path.

#### Wrong

```python
try:
    strength = float(payload.get("strength"))
except ValueError:
    strength = 1.0
```

#### Correct

```python
strength = coerce_lora_float(payload["strength"], f"{entry_name}.strength")
```

### Mistake: Checking file existence outside ComfyUI folder resolution

**Symptom**: A model file exists in a ComfyUI model directory but project code cannot find it.

**Cause**: Using local filesystem paths instead of ComfyUI's model registry.

**Fix**: Use `folder_paths.get_full_path()` with the correct ComfyUI model category.
