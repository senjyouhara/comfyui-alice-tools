from .native_inputs import get_native_node_class


EMPTY_LATENT_IMAGE_NODE_NAME = "EmptyLatentImage"


def build_empty_latent(width, height):
    empty_latent_image = get_native_node_class(EMPTY_LATENT_IMAGE_NODE_NAME)()
    latent, = empty_latent_image.generate(width=int(width), height=int(height), batch_size=1)
    return latent
