from .constants import (
    ALICE_LORA_STACK_TYPE,
    CHECKPOINT_LOADER_NAME,
    CLIP_LOADER_NAME,
    UNET_LOADER_NAME,
    VAE_LOADER_NAME,
)
from .lora_stack import apply_lora_stack
from .native_inputs import build_native_input, build_optional_native_input, get_native_node_class


class AliceModelLoader:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "ckpt_name": build_optional_native_input(CHECKPOINT_LOADER_NAME, "ckpt_name"),
                "unet_name": build_optional_native_input(UNET_LOADER_NAME, "unet_name"),
                "weight_dtype": build_native_input(UNET_LOADER_NAME, "weight_dtype"),
                "clip_name": build_optional_native_input(CLIP_LOADER_NAME, "clip_name"),
                "clip_type": build_optional_native_input(CLIP_LOADER_NAME, "type"),
                "clip_device": build_native_input(CLIP_LOADER_NAME, "device"),
                "vae_name": build_optional_native_input(VAE_LOADER_NAME, "vae_name"),
            },
            "optional": {
                "lora_stack": (ALICE_LORA_STACK_TYPE,),
            },
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    RETURN_NAMES = ("模型", "CLIP", "VAE")
    FUNCTION = "load"
    CATEGORY = "Alice/Loaders"

    def load(self, ckpt_name, unet_name, weight_dtype, clip_name, clip_type, clip_device, vae_name, lora_stack=None):
        if ckpt_name != "None":
            model, clip, vae = self.load_from_checkpoint(ckpt_name)
        else:
            model, clip, vae = self.load_from_components(
                unet_name,
                weight_dtype,
                clip_name,
                clip_type,
                clip_device,
                vae_name,
            )

        model, clip = apply_lora_stack(model, clip, lora_stack)
        return model, clip, vae

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
                ("clip_type", clip_type),
                ("vae_name", vae_name),
            )
            if field_value == "None"
        ]
        if missing_fields:
            missing_fields_text = ", ".join(missing_fields)
            if "clip_type" in missing_fields:
                raise ValueError(
                    f"When ckpt_name is None, these fields are required: {missing_fields_text}. "
                    "Please select a value for clip_type."
                )
            raise ValueError(f"When ckpt_name is None, these fields are required: {missing_fields_text}")

        unet_loader = get_native_node_class(UNET_LOADER_NAME)()
        clip_loader = get_native_node_class(CLIP_LOADER_NAME)()
        vae_loader = get_native_node_class(VAE_LOADER_NAME)()

        model, = unet_loader.load_unet(unet_name, weight_dtype)
        clip, = clip_loader.load_clip(clip_name, clip_type, clip_device)
        vae, = vae_loader.load_vae(vae_name)
        return model, clip, vae
