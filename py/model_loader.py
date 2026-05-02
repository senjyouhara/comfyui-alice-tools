from .constants import (
    ALICE_LORA_STACK_TYPE,
    CHECKPOINT_LOADER_NAME,
    CLIP_LOADER_NAME,
    UNET_GGUF_LOADER_NAME,
    UNET_LOADER_NAME,
    VAE_LOADER_NAME,
)
from .latent import build_empty_latent
from .lora_stack import apply_lora_stack
from .native_inputs import (
    build_native_input,
    build_optional_native_input,
    build_optional_native_input_if_available,
    get_native_node_class,
)
from .resolution import build_resolution_inputs, resolve_resolution


class AliceModelLoader:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "ckpt_name": build_optional_native_input(CHECKPOINT_LOADER_NAME, "ckpt_name"),
                "unet_name": build_optional_native_input(UNET_LOADER_NAME, "unet_name"),
                "unet_gguf": build_optional_native_input_if_available(UNET_GGUF_LOADER_NAME, "unet_name"),
                "weight_dtype": build_native_input(UNET_LOADER_NAME, "weight_dtype"),
                "clip_name": build_optional_native_input(CLIP_LOADER_NAME, "clip_name"),
                "clip_type": build_optional_native_input(CLIP_LOADER_NAME, "type"),
                "clip_device": build_native_input(CLIP_LOADER_NAME, "device"),
                "vae_name": build_optional_native_input(VAE_LOADER_NAME, "vae_name"),
                **build_resolution_inputs(),
            },
            "optional": {
                "lora_stack": (ALICE_LORA_STACK_TYPE,),
            },
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE", "LATENT")
    RETURN_NAMES = ("模型", "CLIP", "VAE", "Latent")
    FUNCTION = "load"
    CATEGORY = "Alice/Loaders"

    def load(
        self,
        ckpt_name,
        unet_name,
        unet_gguf,
        weight_dtype,
        clip_name,
        clip_type,
        clip_device,
        vae_name,
        resolution,
        width,
        height,
        lora_stack=None,
    ):
        resolved_width, resolved_height = resolve_resolution(resolution, width, height)

        if ckpt_name != "None":
            model, clip, vae = self.load_from_checkpoint(ckpt_name)
        else:
            model, clip, vae = self.load_from_components(
                unet_name,
                unet_gguf,
                weight_dtype,
                clip_name,
                clip_type,
                clip_device,
                vae_name,
            )

        model, clip = apply_lora_stack(model, clip, lora_stack)
        latent = build_empty_latent(resolved_width, resolved_height)
        return model, clip, vae, latent

    def load_from_checkpoint(self, ckpt_name):
        checkpoint_loader = get_native_node_class(CHECKPOINT_LOADER_NAME)()
        result = checkpoint_loader.load_checkpoint(ckpt_name)
        if len(result) < 3:
            raise ValueError("Checkpoint loader did not return MODEL, CLIP, and VAE")

        model, clip, vae = result[:3]
        if model is None or clip is None or vae is None:
            raise ValueError("Checkpoint loader returned an incomplete MODEL/CLIP/VAE bundle")
        return model, clip, vae

    def load_from_components(self, unet_name, unet_gguf, weight_dtype, clip_name, clip_type, clip_device, vae_name):
        missing_fields = [
            field_name
            for field_name, field_value in (
                ("clip_name", clip_name),
                ("clip_type", clip_type),
                ("vae_name", vae_name),
            )
            if field_value == "None"
        ]
        if unet_name == "None" and unet_gguf == "None":
            missing_fields.insert(0, "unet_name or unet_gguf")

        if missing_fields:
            missing_fields_text = ", ".join(missing_fields)
            if "clip_type" in missing_fields:
                raise ValueError(
                    f"When ckpt_name is None, these fields are required: {missing_fields_text}. "
                    "Please select a value for clip_type."
                )
            raise ValueError(f"When ckpt_name is None, these fields are required: {missing_fields_text}")

        clip_loader = get_native_node_class(CLIP_LOADER_NAME)()
        vae_loader = get_native_node_class(VAE_LOADER_NAME)()

        model = self.load_unet(unet_name, unet_gguf, weight_dtype)
        clip, = clip_loader.load_clip(clip_name, clip_type, clip_device)
        vae, = vae_loader.load_vae(vae_name)
        return model, clip, vae

    def load_unet(self, unet_name, unet_gguf, weight_dtype):
        if unet_name != "None":
            unet_loader = get_native_node_class(UNET_LOADER_NAME)()
            model, = unet_loader.load_unet(unet_name, weight_dtype)
            return model

        try:
            unet_gguf_loader = get_native_node_class(UNET_GGUF_LOADER_NAME)()
        except RuntimeError as error:
            raise RuntimeError(
                "UnetLoaderGGUF is not available. Install or enable ComfyUI-GGUF, "
                "or select a regular unet_name."
            ) from error

        model, = unet_gguf_loader.load_unet(unet_gguf)
        return model
