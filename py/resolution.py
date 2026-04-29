import re

from nodes import MAX_RESOLUTION


CUSTOM_RESOLUTION_OPTION = "自定义"
DEFAULT_RESOLUTION_OPTION = "1024x1024 (1:1) (方形)"
RESOLUTION_OPTIONS = [
    "3072x2048 (横屏)",
    "2048x3072 (竖屏)",
    "640x960 (2:3) (竖屏)",
    "960x640 (3:2) (横屏)",
    "832x1216 (13:19) (竖屏)",
    "1216x832 (19:13) (横屏)",
    "1024x1536 (2:3) (竖屏)",
    "1536x1024 (3:2) (横屏)",
    "1280x720 (16:9) (横屏)",
    "1920x1080 (16:9) (横屏)",
    "720x1280 (9:16) (竖屏)",
    "1080x1920 (9:16) (竖屏)",
    "1344x768 (7:4) (横屏)",
    "768x1344 (4:7) (竖屏)",
    "1152x896 (9:7) (横屏)",
    "896x1152 (7:9) (竖屏)",
    "480x832 (3:5.2) (竖屏)",
    "832x480 (5.2:3) (横屏)",
    "480x854 (9:16) (竖屏)",
    "854x480 (16:9) (横屏)",
    "512x512 (1:1) (方形)",
    "768x768 (1:1) (方形)",
    DEFAULT_RESOLUTION_OPTION,
    "512x768 (2:3) (竖屏)",
    "768x512 (3:2) (横屏)",
    "512x896 (4:7) (竖屏)",
    "896x512 (7:4) (横屏)",
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
