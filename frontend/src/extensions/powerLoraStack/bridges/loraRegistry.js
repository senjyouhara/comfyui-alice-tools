import { getModelPath, loadModelPathMap } from "../../shared/modelPaths.js";

const LORA_FOLDER = "loras";

export function getAvailableLoras() {
  const values = LiteGraph.registered_node_types?.LoraLoader?.nodeData?.input?.required?.lora_name?.[0];
  return Array.isArray(values) ? values : [];
}

export function getLoraPath(loraName) {
  return getModelPath(LORA_FOLDER, loraName);
}

export function loadLoraPathMap() {
  return loadModelPathMap(LORA_FOLDER);
}
