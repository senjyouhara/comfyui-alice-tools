from .constants import CLIP_TEXT_ENCODE_NAME
from .native_inputs import get_native_node_class


class AlicePromptConditioning:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "clip": ("CLIP",),
                "正向提示词": ("STRING", {"multiline": True, "dynamicPrompts": True}),
                "负面提示词": ("STRING", {"multiline": True, "dynamicPrompts": True}),
            }
        }

    RETURN_TYPES = ("CONDITIONING", "CONDITIONING")
    RETURN_NAMES = ("正面条件", "负面条件")
    FUNCTION = "encode"
    CATEGORY = "Alice/Conditioning"

    def encode(self, clip, **kwargs):
        positive_prompt = kwargs["正向提示词"]
        negative_prompt = kwargs["负面提示词"]
        text_encoder = get_native_node_class(CLIP_TEXT_ENCODE_NAME)()
        positive_conditioning, = text_encoder.encode(clip, positive_prompt)
        negative_conditioning, = text_encoder.encode(clip, negative_prompt)
        return positive_conditioning, negative_conditioning
