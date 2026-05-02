import { app } from "/scripts/app.js";

const NODE_NAME = "AliceModelLoader";
const CUSTOM_RESOLUTION_OPTION = "自定义";
const NONE_OPTION = "None";
const HIDDEN_WIDGET_TYPE = "converted-widget";
const MAX_WIDGET_READY_RETRIES = 20;

function getWidget(node, name) {
  return node.widgets?.find((widget) => widget?.name === name) ?? null;
}

function setWidgetVisibility(widget, visible, suffix = "") {
  if (!widget) {
    return;
  }

  if (!widget._aliceOriginalType) {
    widget._aliceOriginalType = widget.type;
    widget._aliceOriginalComputeSize = widget.computeSize;
  }

  widget.hidden = !visible;
  widget.type = visible ? widget._aliceOriginalType : `${HIDDEN_WIDGET_TYPE}${suffix}`;
  widget.computeSize = visible ? widget._aliceOriginalComputeSize : () => [0, -4];

  if (widget.linkedWidgets) {
    for (const linkedWidget of widget.linkedWidgets) {
      setWidgetVisibility(linkedWidget, visible, `:${widget.name}`);
    }
  }
}

function refreshNodeLayout(node) {
  if (typeof node.setSize === "function" && typeof node.computeSize === "function") {
    node.setSize([node.size?.[0] ?? 0, node.computeSize()[1]]);
  }
  node.setDirtyCanvas?.(true, true);
  app.graph?.setDirtyCanvas?.(true, true);
}

function updateResolutionWidgets(node, resolutionValue = undefined) {
  const resolutionWidget = getWidget(node, "resolution");
  const widthWidget = getWidget(node, "width");
  const heightWidget = getWidget(node, "height");
  if (!resolutionWidget || !widthWidget || !heightWidget) {
    return false;
  }

  const isCustom = (resolutionValue ?? resolutionWidget.value) === CUSTOM_RESOLUTION_OPTION;
  setWidgetVisibility(widthWidget, isCustom);
  setWidgetVisibility(heightWidget, isCustom);
  refreshNodeLayout(node);
  return true;
}

function scheduleResolutionWidgetsUpdate(node, resolutionValue = undefined) {
  if (resolutionValue !== undefined) {
    node._alicePendingResolutionValue = resolutionValue;
  }

  if (node._aliceResolutionWidgetsUpdateQueued) {
    return;
  }

  node._aliceResolutionWidgetsUpdateQueued = true;
  requestAnimationFrame(() => {
    node._aliceResolutionWidgetsUpdateQueued = false;
    const pendingResolutionValue = node._alicePendingResolutionValue;
    delete node._alicePendingResolutionValue;
    updateResolutionWidgets(node, pendingResolutionValue);
  });
}

function installValueWatcher(widget, watcherKey, onChange) {
  if (!widget || widget[watcherKey]) {
    return;
  }

  widget[watcherKey] = true;
  const originalDescriptor =
    Object.getOwnPropertyDescriptor(widget, "value") ??
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(widget), "value") ??
    Object.getOwnPropertyDescriptor(widget.constructor?.prototype ?? {}, "value");
  let widgetValue = widget.value;

  Object.defineProperty(widget, "value", {
    configurable: true,
    enumerable: true,
    get() {
      if (originalDescriptor?.get) {
        return originalDescriptor.get.call(this);
      }
      return widgetValue;
    },
    set(newValue) {
      if (originalDescriptor?.set) {
        originalDescriptor.set.call(this, newValue);
      } else {
        widgetValue = newValue;
      }
      onChange(newValue);
    },
  });
}

function installResolutionValueWatcher(node, resolutionWidget) {
  installValueWatcher(resolutionWidget, "_aliceValueWatcherInstalled", (newValue) => {
    scheduleResolutionWidgetsUpdate(node, newValue);
  });
}

function setWidgetValue(widget, value) {
  if (widget && widget.value !== value) {
    widget.value = value;
  }
}

function syncUnetSourceWidgets(node, changedWidgetName, changedValue) {
  const unetWidget = getWidget(node, "unet_name");
  const unetGgufWidget = getWidget(node, "unet_gguf");
  if (!unetWidget || !unetGgufWidget) {
    return;
  }

  if (changedWidgetName === "unet_name" && changedValue !== NONE_OPTION) {
    setWidgetValue(unetGgufWidget, NONE_OPTION);
  }
  if (changedWidgetName === "unet_gguf" && changedValue !== NONE_OPTION) {
    setWidgetValue(unetWidget, NONE_OPTION);
  }
}

function installUnetSourceWatcher(node, widgetName) {
  const widget = getWidget(node, widgetName);
  if (!widget || widget._aliceUnetSourceWatcherInstalled) {
    return;
  }

  widget._aliceUnetSourceWatcherInstalled = true;
  installValueWatcher(widget, `_alice${widgetName}ValueWatcherInstalled`, (newValue) => {
    syncUnetSourceWidgets(node, widgetName, newValue);
  });

  const originalCallback = widget.callback;
  widget.callback = function (value, ...args) {
    const result = originalCallback?.call(this, value, ...args);
    syncUnetSourceWidgets(node, widgetName, value ?? this.value);
    return result;
  };
}

function ensureUnetSourceWidgetBehavior(node) {
  installUnetSourceWatcher(node, "unet_name");
  installUnetSourceWatcher(node, "unet_gguf");
}

function ensureResolutionWidgetBehavior(node, retriesLeft = MAX_WIDGET_READY_RETRIES) {
  const resolutionWidget = getWidget(node, "resolution");
  const widthWidget = getWidget(node, "width");
  const heightWidget = getWidget(node, "height");

  ensureUnetSourceWidgetBehavior(node);

  if (!resolutionWidget || !widthWidget || !heightWidget) {
    if (retriesLeft > 0) {
      requestAnimationFrame(() => ensureResolutionWidgetBehavior(node, retriesLeft - 1));
    }
    return;
  }

  if (!node._aliceResolutionWidgetsReady) {
    node._aliceResolutionWidgetsReady = true;
    installResolutionValueWatcher(node, resolutionWidget);

    const originalCallback = resolutionWidget.callback;
    resolutionWidget.callback = function (value, ...args) {
      const result = originalCallback?.call(this, value, ...args);
      scheduleResolutionWidgetsUpdate(node, value ?? this.value);
      return result;
    };
  }

  scheduleResolutionWidgetsUpdate(node, resolutionWidget.value);
}

app.registerExtension({
  name: "Alice.ModelLoaderResolution",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== NODE_NAME) {
      return;
    }

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
      ensureResolutionWidgetBehavior(this);
      return result;
    };

    const configure = nodeType.prototype.configure;
    nodeType.prototype.configure = function (info) {
      const result = configure ? configure.apply(this, arguments) : undefined;
      ensureResolutionWidgetBehavior(this);
      return result;
    };
  },
});
