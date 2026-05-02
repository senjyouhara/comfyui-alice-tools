import { app } from "/scripts/app.js";

const NODE_NAME = "AliceKSampler";
const SIMPLE_TYPE = "simple";
const ADVANCED_TYPE = "advanced";
const HIDDEN_WIDGET_TYPE = "converted-widget";
const MAX_WIDGET_SYNC_FRAMES = 30;
const SIMPLE_WIDGETS = ["seed", "denoise"];
const ADVANCED_WIDGETS = [
  "add_noise",
  "noise_seed",
  "start_at_step",
  "end_at_step",
  "return_with_leftover_noise",
];

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
    widget._aliceOriginalDraw = widget.draw;
  }

  widget.hidden = !visible;
  widget.type = visible ? widget._aliceOriginalType : `${HIDDEN_WIDGET_TYPE}${suffix}`;
  widget.computeSize = visible ? widget._aliceOriginalComputeSize : () => [0, -4];
  widget.draw = visible ? widget._aliceOriginalDraw : () => {};

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

function updateSamplerWidgets(node, typeValue = undefined) {
  const typeWidget = getWidget(node, "type");
  if (!typeWidget) {
    return false;
  }

  const samplerType = typeValue ?? typeWidget.value;
  const isAdvanced = samplerType === ADVANCED_TYPE;

  for (const widgetName of SIMPLE_WIDGETS) {
    setWidgetVisibility(getWidget(node, widgetName), !isAdvanced);
  }
  for (const widgetName of ADVANCED_WIDGETS) {
    setWidgetVisibility(getWidget(node, widgetName), isAdvanced);
  }

  refreshNodeLayout(node);
  return true;
}

function scheduleSamplerWidgetsUpdate(node, typeValue = undefined) {
  if (typeValue !== undefined) {
    node._alicePendingSamplerType = typeValue;
  }

  if (node._aliceSamplerWidgetsUpdateQueued) {
    return;
  }

  node._aliceSamplerWidgetsUpdateQueued = true;
  requestAnimationFrame(() => {
    node._aliceSamplerWidgetsUpdateQueued = false;
    const pendingSamplerType = node._alicePendingSamplerType;
    delete node._alicePendingSamplerType;
    updateSamplerWidgets(node, pendingSamplerType);
  });
}

function installSamplerTypeWatcher(node, typeWidget) {
  if (!typeWidget || typeWidget._aliceSamplerTypeWatcherInstalled) {
    return;
  }

  typeWidget._aliceSamplerTypeWatcherInstalled = true;
  const originalCallback = typeWidget.callback;
  typeWidget.callback = function (value, ...args) {
    const result = originalCallback?.call(this, value, ...args);
    scheduleSamplerWidgetsUpdate(node, value ?? this.value);
    return result;
  };
}

function syncSamplerWidgetsForNextFrames(node, framesLeft = MAX_WIDGET_SYNC_FRAMES) {
  const typeWidget = getWidget(node, "type");
  if (typeWidget) {
    installSamplerTypeWatcher(node, typeWidget);
    updateSamplerWidgets(node, typeWidget.value ?? SIMPLE_TYPE);
  }

  if (framesLeft > 0) {
    requestAnimationFrame(() => syncSamplerWidgetsForNextFrames(node, framesLeft - 1));
  }
}

function isSamplerNode(node) {
  if (node.comfyClass) {
    return node.comfyClass === NODE_NAME;
  }
  return node.type === NODE_NAME;
}

function ensureSamplerWidgetBehavior(node) {
  if (!isSamplerNode(node)) {
    return;
  }

  if (node._aliceSamplerBehaviorInstalled) {
    updateSamplerWidgets(node);
    return;
  }

  node._aliceSamplerBehaviorInstalled = true;
  syncSamplerWidgetsForNextFrames(node);
}

function ensureGraphSamplerWidgetBehavior() {
  for (const node of app.graph?._nodes ?? []) {
    ensureSamplerWidgetBehavior(node);
  }
}

app.registerExtension({
  name: "Alice.KSamplerSwitch",
  setup() {
    ensureGraphSamplerWidgetBehavior();
  },
  nodeCreated(node) {
    ensureSamplerWidgetBehavior(node);
  },
  loadedGraphNode(node) {
    ensureSamplerWidgetBehavior(node);
  },
  afterConfigureGraph() {
    ensureGraphSamplerWidgetBehavior();
  },
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== NODE_NAME) {
      return;
    }

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
      ensureSamplerWidgetBehavior(this);
      return result;
    };

    const configure = nodeType.prototype.configure;
    nodeType.prototype.configure = function (info) {
      const result = configure ? configure.apply(this, arguments) : undefined;
      ensureSamplerWidgetBehavior(this);
      return result;
    };

    const onDrawForeground = nodeType.prototype.onDrawForeground;
    nodeType.prototype.onDrawForeground = function () {
      updateSamplerWidgets(this);
      return onDrawForeground?.apply(this, arguments);
    };
  },
});
