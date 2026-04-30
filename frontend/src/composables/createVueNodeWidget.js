import { createApp } from "vue";

const DEFAULT_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "stretch",
  overflow: "visible",
};

export function createVueNodeWidget({
  node,
  name,
  component,
  props = {},
  type = "alice-vue-widget",
  serialize = true,
  getValue,
  setValue,
  serializeValue,
  getMinHeight,
  getMaxHeight,
  containerClassName = "",
  containerStyle = {},
  onRemove,
  widgetOptions = {},
  widgetProps = {},
}) {
  const container = document.createElement("div");
  if (containerClassName) {
    container.className = containerClassName;
  }
  Object.assign(container.style, DEFAULT_CONTAINER_STYLE, containerStyle);

  const widget = node.addDOMWidget(name, type, container, {
    ...widgetOptions,
    serialize: widgetOptions.serialize ?? serialize,
    getValue,
    setValue,
    getMinHeight,
    getMaxHeight,
  });

  widget.serialize = serialize;
  Object.assign(widget, widgetProps);

  if (typeof serializeValue === "function") {
    widget.serializeValue = (...args) => serializeValue(...args);
  }

  const baseOnRemove = typeof widget.onRemove === "function" ? widget.onRemove.bind(widget) : null;
  const vueApp = createApp(component, {
    ...props,
    node,
    widget,
  });
  vueApp.mount(container);

  widget.onRemove = () => {
    vueApp.unmount();
    baseOnRemove?.();
    onRemove?.(widget);
  };

  return widget;
}
