import copy

from nodes import NODE_CLASS_MAPPINGS as ALL_NODE_CLASS_MAPPINGS


def get_native_node_class(node_name):
    node_class = ALL_NODE_CLASS_MAPPINGS.get(node_name)
    if node_class is None:
        raise RuntimeError(f"Native node not available: {node_name}")
    return node_class


def get_native_input(node_name, input_name):
    node_class = get_native_node_class(node_name)
    input_types = node_class.INPUT_TYPES()

    for input_group in ("required", "optional"):
        group_inputs = input_types.get(input_group, {})
        if input_name not in group_inputs:
            continue

        input_spec = group_inputs[input_name]
        options = list(input_spec[0])
        settings = dict(input_spec[1]) if len(input_spec) > 1 else {}
        return options, settings

    raise RuntimeError(f"Native input not available: {node_name}.{input_name}")


def build_native_input_types(node_name):
    node_class = get_native_node_class(node_name)
    return copy.deepcopy(node_class.INPUT_TYPES())


def build_optional_native_input(node_name, input_name):
    options, settings = get_native_input(node_name, input_name)
    return build_optional_input(options, settings)


def build_optional_native_input_if_available(node_name, input_name):
    try:
        options, settings = get_native_input(node_name, input_name)
    except RuntimeError:
        options, settings = [], {}
    return build_optional_input(options, settings)


def build_optional_input(options, settings):
    if "None" not in options:
        options.append("None")
    settings["default"] = "None"
    return (options, settings)


def build_native_input(node_name, input_name):
    options, settings = get_native_input(node_name, input_name)
    if settings:
        return (options, settings)
    return (options,)
