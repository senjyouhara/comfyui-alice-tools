import { getModelPath, loadModelPathMap } from "../../shared/modelPaths.js";

const CONTROLNET_FOLDER = "controlnet";

export function getAvailableControlNets() {
  const values = LiteGraph.registered_node_types?.ControlNetLoader?.nodeData?.input?.required?.control_net_name?.[0];
  return Array.isArray(values) ? values : [];
}

export function getControlNetPath(controlNetName) {
  return getModelPath(CONTROLNET_FOLDER, controlNetName);
}

export function loadControlNetPathMap() {
  return loadModelPathMap(CONTROLNET_FOLDER);
}
