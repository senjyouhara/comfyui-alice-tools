import re

import folder_paths

from .constants import CONTROLNET_APPLY_ADVANCED_NAME, CONTROLNET_LOADER_NAME
from .native_inputs import get_native_node_class


CONTROLNET_ENTRY_PREFIX = "controlnet_"
IMAGE_INPUT_PREFIX = "image_"


def coerce_controlnet_float(value, field_name):
    try:
        return float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"Invalid ControlNet field '{field_name}': expected a number, got {value!r}") from error


def get_controlnet_entry_order(entry_name, payload):
    if isinstance(payload, dict) and "order" in payload:
        order_value = payload["order"]
        try:
            return int(order_value)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"Invalid ControlNet field '{entry_name}.order': expected an integer, got {order_value!r}"
            ) from error

    match = re.search(r"(\d+)$", entry_name)
    if match is not None:
        return int(match.group(1))
    return 10**9


def derive_image_input_name(entry_name, payload):
    if isinstance(payload, dict):
        image_input = payload.get("image_input")
        if image_input is not None:
            return image_input

    match = re.search(r"(\d+)$", entry_name)
    if match is None:
        return None
    return f"{IMAGE_INPUT_PREFIX}{match.group(1)}"


def normalize_controlnet_entry(entry_name, payload):
    if not isinstance(payload, dict):
        raise ValueError(f"Invalid ControlNet entry '{entry_name}': expected a dictionary payload")

    missing_fields = [
        field_name
        for field_name in ("on", "controlnet", "strength", "start_percent", "end_percent")
        if field_name not in payload
    ]
    if missing_fields:
        missing_fields_text = ", ".join(missing_fields)
        raise ValueError(f"Invalid ControlNet entry '{entry_name}': missing required fields: {missing_fields_text}")

    on = payload["on"]
    if not isinstance(on, bool):
        raise ValueError(f"Invalid ControlNet field '{entry_name}.on': expected a boolean, got {on!r}")

    controlnet_name = payload["controlnet"]
    if not isinstance(controlnet_name, str) or not controlnet_name.strip():
        raise ValueError(
            f"Invalid ControlNet field '{entry_name}.controlnet': expected a non-empty ControlNet filename"
        )
    if controlnet_name == "None" and on:
        raise ValueError(f"Invalid ControlNet field '{entry_name}.controlnet': expected a selected ControlNet filename")

    strength = coerce_controlnet_float(payload["strength"], f"{entry_name}.strength")
    start_percent = coerce_controlnet_float(payload["start_percent"], f"{entry_name}.start_percent")
    end_percent = coerce_controlnet_float(payload["end_percent"], f"{entry_name}.end_percent")

    if not 0.0 <= start_percent <= 1.0:
        raise ValueError(
            f"Invalid ControlNet field '{entry_name}.start_percent': expected a value between 0 and 1"
        )
    if not 0.0 <= end_percent <= 1.0:
        raise ValueError(
            f"Invalid ControlNet field '{entry_name}.end_percent': expected a value between 0 and 1"
        )
    if start_percent > end_percent:
        raise ValueError(
            f"Invalid ControlNet entry '{entry_name}': start_percent must be less than or equal to end_percent"
        )

    image_input = derive_image_input_name(entry_name, payload)
    if image_input is not None and (not isinstance(image_input, str) or not image_input.strip()):
        raise ValueError(
            f"Invalid ControlNet field '{entry_name}.image_input': expected a non-empty IMAGE input name"
        )

    return {
        "on": on,
        "controlnet": controlnet_name,
        "strength": strength,
        "start_percent": start_percent,
        "end_percent": end_percent,
        "image_input": image_input,
        "image": payload.get("image"),
    }


def extract_controlnet_stack(kwargs):
    ordered_entries = []

    for entry_name, payload in kwargs.items():
        if not entry_name.lower().startswith(CONTROLNET_ENTRY_PREFIX):
            continue

        order = get_controlnet_entry_order(entry_name, payload)
        normalized_entry = normalize_controlnet_entry(entry_name, payload)
        image_input_name = normalized_entry["image_input"]
        if image_input_name:
            normalized_entry["image"] = kwargs.get(image_input_name)

        if normalized_entry["on"] and normalized_entry["controlnet"] != "None" and normalized_entry["image"] is None:
            raise ValueError(
                f"ControlNet entry '{entry_name}' requires a connected IMAGE input ({image_input_name or 'missing image input'})"
            )

        ordered_entries.append((order, entry_name, normalized_entry))

    ordered_entries.sort(key=lambda item: (item[0], item[1]))
    return [entry for _, _, entry in ordered_entries]


def apply_controlnet_stack(positive, negative, controlnet_stack, vae=None):
    if controlnet_stack is None:
        return positive, negative

    if not isinstance(controlnet_stack, list):
        raise ValueError("Invalid controlnet_stack: expected a list of ControlNet entries")

    controlnet_loader = get_native_node_class(CONTROLNET_LOADER_NAME)()
    controlnet_apply = get_native_node_class(CONTROLNET_APPLY_ADVANCED_NAME)()
    loaded_controlnets = {}
    current_positive = positive
    current_negative = negative

    for index, entry in enumerate(controlnet_stack, start=1):
        normalized_entry = normalize_controlnet_entry(f"controlnet_stack[{index}]", entry)
        if not normalized_entry["on"]:
            continue

        strength = normalized_entry["strength"]
        if strength == 0:
            continue

        image = entry.get("image")
        if image is None:
            raise ValueError(f"ControlNet entry 'controlnet_stack[{index}]' requires an IMAGE value")

        controlnet_name = normalized_entry["controlnet"]
        if folder_paths.get_full_path("controlnet", controlnet_name) is None:
            raise FileNotFoundError(f"ControlNet file not found: {controlnet_name}")

        control_net = loaded_controlnets.get(controlnet_name)
        if control_net is None:
            control_net, = controlnet_loader.load_controlnet(controlnet_name)
            loaded_controlnets[controlnet_name] = control_net

        current_positive, current_negative = controlnet_apply.apply_controlnet(
            current_positive,
            current_negative,
            control_net,
            image,
            strength,
            normalized_entry["start_percent"],
            normalized_entry["end_percent"],
            vae=vae,
        )

    return current_positive, current_negative
