import os

from .py import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

PLUGIN_ROOT = os.path.dirname(os.path.realpath(__file__))
DEFAULT_WEB_DIRECTORY = "web_version/v1"
WEB_VERSION_ENV = "COMFYUI_ALICE_TOOLS_WEB_VERSION"


def _to_relative_web_path(directory):
    return f"./{directory.replace(os.sep, '/')}"


def _resolve_web_directory():
    requested_version = os.getenv(WEB_VERSION_ENV, "").strip().lower()
    candidates = []

    if requested_version:
        candidates.append(f"web_version/{requested_version}")

    candidates.append(DEFAULT_WEB_DIRECTORY)

    seen_directories = set()
    for directory in candidates:
        if directory in seen_directories:
            continue
        seen_directories.add(directory)

        if os.path.isdir(os.path.join(PLUGIN_ROOT, directory)):
            return _to_relative_web_path(directory)

    return _to_relative_web_path(DEFAULT_WEB_DIRECTORY)


WEB_DIRECTORY = _resolve_web_directory()

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
