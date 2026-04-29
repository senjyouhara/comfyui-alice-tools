import { rebuildWidgets, ensureNodeHelpers } from "./serialization.js";
import { NODE_NAME } from "./constants.js";

export function beforeRegisterNodeDef(nodeType, nodeData) {
  if (nodeData.name !== NODE_NAME) {
    return;
  }

  const onNodeCreated = nodeType.prototype.onNodeCreated;
  nodeType.prototype.onNodeCreated = function () {
    const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
    ensureNodeHelpers(this);
    if (!Array.isArray(this.widgets) || !this.widgets.length) {
      rebuildWidgets(this, []);
    }
    return result;
  };

  const configure = nodeType.prototype.configure;
  nodeType.prototype.configure = function (info) {
    const result = configure ? configure.apply(this, arguments) : undefined;
    ensureNodeHelpers(this);
    rebuildWidgets(this, Array.isArray(info?.widgets_values) ? info.widgets_values : []);
    return result;
  };
}
