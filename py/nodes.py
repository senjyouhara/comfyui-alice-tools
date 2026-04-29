from .model_loader import AliceModelLoader
from .stack_node import AlicePowerLoraStack


NODE_CLASS_MAPPINGS = {
    "AlicePowerLoraStack": AlicePowerLoraStack,
    "AliceModelLoader": AliceModelLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AlicePowerLoraStack": "Alice Power Lora Stack",
    "AliceModelLoader": "Alice 模型加载器",
}
