import re

from nodes import MAX_RESOLUTION


CUSTOM_RESOLUTION_OPTION = "自定义"
DEFAULT_RESOLUTION_OPTION = "1024 x 1024 (1:1)"
RESOLUTION_OPTIONS = [
    DEFAULT_RESOLUTION_OPTION,
    "896 x 1152 (9:16)",
    "1152 x 896 (16:9)",
    "832 x 1216 (2:3)",
    "1216 x 832 (3:2)",
    "768 x 1344 (9:16 Tall)",
    "1344 x 768 (16:9 Wide)",
    CUSTOM_RESOLUTION_OPTION,
]
RESOLUTION_SELECTOR_TOOLTIP = "选择预设分辨率，或选择 自定义 后手动输入宽高。"
CUSTOM_DIMENSION_TOOLTIP = "仅在选择 自定义 时使用，且必须为 8 的倍数。"
RESOLUTION_DIMENSION_SETTINGS = {
    "default": 1024,
    "min": 16,
    "max": MAX_RESOLUTION,
    "step": 8,
}


def build_resolution_inputs():
    return {
        "resolution": (
            list(RESOLUTION_OPTIONS),
            {"default": DEFAULT_RESOLUTION_OPTION, "tooltip": RESOLUTION_SELECTOR_TOOLTIP},
        ),
        "width": ("INT", {**RESOLUTION_DIMENSION_SETTINGS, "tooltip": CUSTOM_DIMENSION_TOOLTIP}),
        "height": ("INT", {**RESOLUTION_DIMENSION_SETTINGS, "tooltip": CUSTOM_DIMENSION_TOOLTIP}),
    }


def parse_resolution_text(value):
    match = re.search(r"(\d+)\s*[xX]\s*(\d+)", str(value))
    if match is None:
        return None
    return int(match.group(1)), int(match.group(2))


def resolve_resolution(resolution, width, height):
    if resolution == CUSTOM_RESOLUTION_OPTION:
        return int(width), int(height)

    parsed_resolution = parse_resolution_text(resolution)
    if parsed_resolution is None:
        raise ValueError(f"Invalid resolution preset: {resolution!r}")
    return parsed_resolution
