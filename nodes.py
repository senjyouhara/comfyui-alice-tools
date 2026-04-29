from nodes import NODE_CLASS_MAPPINGS as ALL_NODE_CLASS_MAPPINGS


CHECKPOINT_LOADER_NAME = "CheckpointLoaderSimple"
UNET_LOADER_NAME = "UNETLoader"
CLIP_LOADER_NAME = "CLIPLoader"
VAE_LOADER_NAME = "VAELoader"


def get_native_node_class(node_name):
    node_class = ALL_NODE_CLASS_MAPPINGS.get(node_name)
    if node_class is None:
        raise RuntimeError(f"Native node not available: {node_name}")
    return node_class


def get_native_required_input(node_name, input_name):
    node_class = get_native_node_class(node_name)
    required_inputs = node_class.INPUT_TYPES()["required"]
    if input_name not in required_inputs:
        raise RuntimeError(f"Native input not available: {node_name}.{input_name}")

    input_spec = required_inputs[input_name]
    options = list(input_spec[0])
    settings = dict(input_spec[1]) if len(input_spec) > 1 else {}
    return options, settings


def build_optional_native_input(node_name, input_name):
    options, settings = get_native_required_input(node_name, input_name)
    if "None" not in options:
        options.append("None")
    settings["default"] = "None"
    return (options, settings)


def build_native_input(node_name, input_name):
    options, settings = get_native_required_input(node_name, input_name)
    if settings:
        return (options, settings)
    return (options,)


class AliceModelLoader:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "ckpt_name": build_optional_native_input(CHECKPOINT_LOADER_NAME, "ckpt_name"),
                "unet_name": build_optional_native_input(UNET_LOADER_NAME, "unet_name"),
                "weight_dtype": build_native_input(UNET_LOADER_NAME, "weight_dtype"),
                "clip_name": build_optional_native_input(CLIP_LOADER_NAME, "clip_name"),
                "clip_type": build_native_input(CLIP_LOADER_NAME, "type"),
                "clip_device": build_native_input(CLIP_LOADER_NAME, "device"),
                "vae_name": build_optional_native_input(VAE_LOADER_NAME, "vae_name"),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    RETURN_NAMES = ("模型", "CLIP", "VAE")
    FUNCTION = "load"
    CATEGORY = "Alice/Loaders"

    def load(self, ckpt_name, unet_name, weight_dtype, clip_name, clip_type, clip_device, vae_name):
        if ckpt_name != "None":
            return self.load_from_checkpoint(ckpt_name)
        return self.load_from_components(unet_name, weight_dtype, clip_name, clip_type, clip_device, vae_name)

    def load_from_checkpoint(self, ckpt_name):
        checkpoint_loader = get_native_node_class(CHECKPOINT_LOADER_NAME)()
        result = checkpoint_loader.load_checkpoint(ckpt_name)
        if len(result) < 3:
            raise ValueError("Checkpoint loader did not return MODEL, CLIP, and VAE")

        model, clip, vae = result[:3]
        if model is None or clip is None or vae is None:
            raise ValueError("Checkpoint loader returned an incomplete MODEL/CLIP/VAE bundle")
        return model, clip, vae

    def load_from_components(self, unet_name, weight_dtype, clip_name, clip_type, clip_device, vae_name):
        missing_fields = [
            field_name
            for field_name, field_value in (
                ("unet_name", unet_name),
                ("clip_name", clip_name),
                ("vae_name", vae_name),
            )
            if field_value == "None"
        ]
        if missing_fields:
            missing_fields_text = ", ".join(missing_fields)
            raise ValueError(f"When ckpt_name is None, these fields are required: {missing_fields_text}")

        unet_loader = get_native_node_class(UNET_LOADER_NAME)()
        clip_loader = get_native_node_class(CLIP_LOADER_NAME)()
        vae_loader = get_native_node_class(VAE_LOADER_NAME)()

        model, = unet_loader.load_unet(unet_name, weight_dtype)
        clip, = clip_loader.load_clip(clip_name, clip_type, clip_device)
        vae, = vae_loader.load_vae(vae_name)
        return model, clip, vae


NODE_CLASS_MAPPINGS = {
    "AliceModelLoader": AliceModelLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AliceModelLoader": "Alice 模型加载器",
}
