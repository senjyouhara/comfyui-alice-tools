export function getAvailableLoras() {
  const values = LiteGraph.registered_node_types?.LoraLoader?.nodeData?.input?.required?.lora_name?.[0];
  return Array.isArray(values) ? values : [];
}
