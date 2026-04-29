import re

import folder_paths

from .constants import LORA_LOADER_NAME
from .native_inputs import get_native_node_class


def coerce_lora_float(value, field_name):
    try:
        return float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"Invalid LoRA field '{field_name}': expected a number, got {value!r}") from error


def normalize_lora_entry(entry_name, payload):
    if not isinstance(payload, dict):
        raise ValueError(f"Invalid LoRA entry '{entry_name}': expected a dictionary payload")

    missing_fields = [field_name for field_name in ("on", "lora", "strength") if field_name not in payload]
    if missing_fields:
        missing_fields_text = ", ".join(missing_fields)
        raise ValueError(f"Invalid LoRA entry '{entry_name}': missing required fields: {missing_fields_text}")

    on = payload["on"]
    if not isinstance(on, bool):
        raise ValueError(f"Invalid LoRA field '{entry_name}.on': expected a boolean, got {on!r}")

    lora_name = payload["lora"]
    if not isinstance(lora_name, str) or not lora_name.strip():
        raise ValueError(f"Invalid LoRA field '{entry_name}.lora': expected a non-empty LoRA filename")
    if lora_name == "None" and on:
        raise ValueError(f"Invalid LoRA field '{entry_name}.lora': expected a selected LoRA filename")

    strength_model = coerce_lora_float(payload["strength"], f"{entry_name}.strength")

    strength_clip_value = payload.get("strength_clip")
    if strength_clip_value is None:
        strength_clip_value = payload.get("strengthTwo")
    if strength_clip_value is None:
        strength_clip_value = strength_model
    strength_clip = coerce_lora_float(strength_clip_value, f"{entry_name}.strength_clip")

    return {
        "on": on,
        "lora": lora_name,
        "strength": strength_model,
        "strength_clip": strength_clip,
    }


def get_lora_entry_order(entry_name, payload):
    if isinstance(payload, dict) and "order" in payload:
        order_value = payload["order"]
        try:
            return int(order_value)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"Invalid LoRA field '{entry_name}.order': expected an integer, got {order_value!r}"
            ) from error

    match = re.search(r"(\d+)$", entry_name)
    if match is not None:
        return int(match.group(1))
    return 10**9


def extract_lora_stack(kwargs):
    ordered_entries = []

    for entry_name, payload in kwargs.items():
        if not entry_name.lower().startswith("lora_"):
            continue

        order = get_lora_entry_order(entry_name, payload)
        normalized_entry = normalize_lora_entry(entry_name, payload)
        ordered_entries.append((order, entry_name, normalized_entry))

    ordered_entries.sort(key=lambda item: (item[0], item[1]))
    return [entry for _, _, entry in ordered_entries]


def apply_lora_stack(model, clip, lora_stack):
    if lora_stack is None:
        return model, clip

    if not isinstance(lora_stack, list):
        raise ValueError("Invalid lora_stack: expected a list of LoRA entries")

    lora_loader = get_native_node_class(LORA_LOADER_NAME)()

    for index, entry in enumerate(lora_stack, start=1):
        normalized_entry = normalize_lora_entry(f"lora_stack[{index}]", entry)
        if not normalized_entry["on"]:
            continue

        strength_model = normalized_entry["strength"]
        strength_clip = normalized_entry["strength_clip"]
        if strength_model == 0 and strength_clip == 0:
            continue

        lora_name = normalized_entry["lora"]
        if folder_paths.get_full_path("loras", lora_name) is None:
            raise FileNotFoundError(f"LoRA file not found: {lora_name}")

        model, clip = lora_loader.load_lora(model, clip, lora_name, strength_model, strength_clip)

    return model, clip
