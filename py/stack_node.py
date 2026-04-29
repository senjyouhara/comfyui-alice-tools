from .constants import ALICE_LORA_STACK_TYPE
from .lora_stack import extract_lora_stack
from .types import FlexibleOptionalInputType, any_type


class AlicePowerLoraStack:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": FlexibleOptionalInputType(any_type),
        }

    RETURN_TYPES = (ALICE_LORA_STACK_TYPE,)
    RETURN_NAMES = ("LoRA配置",)
    FUNCTION = "build_stack"
    CATEGORY = "Alice/Loaders"

    def build_stack(self, **kwargs):
        return (extract_lora_stack(kwargs),)
