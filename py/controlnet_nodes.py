from .constants import ALICE_CONTROLNET_STACK_TYPE
from .controlnet_stack import apply_controlnet_stack, extract_controlnet_stack
from .types import FlexibleOptionalInputType, any_type


class AliceControlNetStack:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    RETURN_TYPES = (ALICE_CONTROLNET_STACK_TYPE,)
    RETURN_NAMES = ("ControlNet配置",)
    FUNCTION = "build_stack"
    CATEGORY = "Alice/ControlNet"

    def build_stack(self, **kwargs):
        return (extract_controlnet_stack(kwargs),)


class AliceApplyControlNetStack:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "positive": ("CONDITIONING",),
                "negative": ("CONDITIONING",),
                "controlnet_stack": (ALICE_CONTROLNET_STACK_TYPE,),
            },
            "optional": {
                "vae": ("VAE",),
            },
        }

    RETURN_TYPES = ("CONDITIONING", "CONDITIONING")
    RETURN_NAMES = ("positive", "negative")
    FUNCTION = "apply"
    CATEGORY = "Alice/ControlNet"

    def apply(self, positive, negative, controlnet_stack, vae=None):
        applied_positive, applied_negative = apply_controlnet_stack(
            positive,
            negative,
            controlnet_stack,
            vae=vae,
        )
        return applied_positive, applied_negative
