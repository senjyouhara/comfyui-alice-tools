from .controlnet_nodes import AliceApplyControlNetStack, AliceControlNetStack
from .model_loader import AliceModelLoader
from .stack_node import AlicePowerLoraStack


NODE_CLASS_MAPPINGS = {
    "AlicePowerLoraStack": AlicePowerLoraStack,
    "AliceModelLoader": AliceModelLoader,
    "AliceControlNetStack": AliceControlNetStack,
    "AliceApplyControlNetStack": AliceApplyControlNetStack,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AlicePowerLoraStack": "Alice Power Lora Stack",
    "AliceModelLoader": "Alice 模型加载器",
    "AliceControlNetStack": "Alice ControlNet Stack",
    "AliceApplyControlNetStack": "Alice 应用 ControlNet 堆",
}
