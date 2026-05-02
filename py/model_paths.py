from aiohttp import web
from server import PromptServer
import folder_paths

MODEL_PATH_FOLDERS = {"loras", "controlnet"}


def build_model_path_map(folder):
    paths = {}
    for filename in folder_paths.get_filename_list(folder):
        full_path = folder_paths.get_full_path(folder, filename)
        if full_path:
            paths[filename] = full_path
    return paths


@PromptServer.instance.routes.get("/alice-tools/model-paths/{folder}")
async def get_model_paths(request):
    folder = request.match_info["folder"]
    if folder not in MODEL_PATH_FOLDERS:
        return web.json_response({"error": "Unsupported model folder"}, status=404)

    return web.json_response({"folder": folder, "paths": build_model_path_map(folder)})
