from .constants import KSAMPLER_ADVANCED_NAME, KSAMPLER_NAME, VAE_DECODE_NAME
from .native_inputs import build_native_input_types, get_native_node_class

SIMPLE_TYPE = "simple"
ADVANCED_TYPE = "advanced"
COMMON_INPUT_NAMES = (
    "model",
    "steps",
    "cfg",
    "sampler_name",
    "scheduler",
    "positive",
    "negative",
    "latent_image",
)
SIMPLE_INPUT_NAMES = ("seed", "denoise")
ADVANCED_INPUT_NAMES = (
    "add_noise",
    "noise_seed",
    "start_at_step",
    "end_at_step",
    "return_with_leftover_noise",
)
SAMPLER_INPUT_ORDER = (
    "model",
    "seed",
    "add_noise",
    "noise_seed",
    "steps",
    "cfg",
    "sampler_name",
    "scheduler",
    "positive",
    "negative",
    "latent_image",
    "denoise",
    "start_at_step",
    "end_at_step",
    "return_with_leftover_noise",
)


class AliceKSampler:
    @classmethod
    def INPUT_TYPES(cls):
        simple_inputs = build_native_input_types(KSAMPLER_NAME)["required"]
        advanced_inputs = build_native_input_types(KSAMPLER_ADVANCED_NAME)["required"]
        input_specs = {
            **{name: simple_inputs[name] for name in COMMON_INPUT_NAMES},
            **{name: simple_inputs[name] for name in SIMPLE_INPUT_NAMES},
            **{name: advanced_inputs[name] for name in ADVANCED_INPUT_NAMES},
        }
        required_inputs = {
            "type": ([SIMPLE_TYPE, ADVANCED_TYPE], {"default": SIMPLE_TYPE}),
            **{name: input_specs[name] for name in SAMPLER_INPUT_ORDER},
            "vae": ("VAE",),
        }
        return {"required": required_inputs}

    RETURN_TYPES = ("LATENT", "IMAGE")
    RETURN_NAMES = ("latent", "image")
    FUNCTION = "sample"
    CATEGORY = "Alice/Sampling"

    def sample(self, **kwargs):
        sampler_type = kwargs.pop("type")
        vae = kwargs.pop("vae")
        latent = self.sample_latent(sampler_type, kwargs)
        image = self.decode_image(vae, latent)
        return latent, image

    def sample_latent(self, sampler_type, inputs):
        if sampler_type == SIMPLE_TYPE:
            return self.sample_simple(inputs)
        if sampler_type == ADVANCED_TYPE:
            return self.sample_advanced(inputs)
        raise ValueError(f"Unsupported sampler type: {sampler_type}")

    def sample_simple(self, inputs):
        sampler = get_native_node_class(KSAMPLER_NAME)()
        return sampler.sample(
            inputs["model"],
            inputs["seed"],
            inputs["steps"],
            inputs["cfg"],
            inputs["sampler_name"],
            inputs["scheduler"],
            inputs["positive"],
            inputs["negative"],
            inputs["latent_image"],
            inputs["denoise"],
        )[0]

    def sample_advanced(self, inputs):
        sampler = get_native_node_class(KSAMPLER_ADVANCED_NAME)()
        return sampler.sample(
            inputs["model"],
            inputs["add_noise"],
            inputs["noise_seed"],
            inputs["steps"],
            inputs["cfg"],
            inputs["sampler_name"],
            inputs["scheduler"],
            inputs["positive"],
            inputs["negative"],
            inputs["latent_image"],
            inputs["start_at_step"],
            inputs["end_at_step"],
            inputs["return_with_leftover_noise"],
        )[0]

    def decode_image(self, vae, latent):
        vae_decode = get_native_node_class(VAE_DECODE_NAME)()
        return vae_decode.decode(vae, latent)[0]
